/**
 * GTFS Static Ingestor
 *
 * Downloads and imports Metlink GTFS static data into the database.
 * Uses bulk upsert with batches of 5000 for large tables like stop_times.
 *
 * Usage:
 *   npm run ingest           # Full import
 *   npm run ingest:dry-run   # Parse only, no database writes
 *
 * Environment:
 *   DATABASE_URL             # Postgres connection string
 *   METLINK_API_KEY          # (Optional) Metlink API key if required
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createWriteStream, mkdirSync, rmSync, existsSync } from "fs";
import { pipeline } from "stream/promises";
import { createReadStream } from "fs";
import csv from "csv-parser";
import unzipper from "unzipper";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from monorepo root
config({ path: resolve(__dirname, "../.env") });


// =============================================================================
// CONFIGURATION
// =============================================================================

const GTFS_URL =
  process.env.GTFS_URL ||
  "https://static.opendata.metlink.org.nz/v1/gtfs/full.zip";

const BATCH_SIZE = 5000;
const TEMP_DIR = resolve(__dirname, ".tmp");
const DRY_RUN = process.env.DRY_RUN === "true" || process.argv.includes("--dry-run");

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

const connectionString = process.env.DATABASE_URL;
if (!connectionString && !DRY_RUN) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

// Only create DB connection if not in dry-run mode
const queryClient = !DRY_RUN && connectionString ? postgres(connectionString) : null;
type DrizzleDb = ReturnType<typeof drizzle>;
type SchemaModule = typeof import("../packages/db/src/schema");

let db: DrizzleDb | null = null;
let tables: SchemaModule | null = null;

async function initDb(): Promise<void> {
  if (DRY_RUN || !queryClient) return;
  if (db && tables) return;

  tables = await import("../packages/db/src/schema");
  db = drizzle(queryClient, { schema: tables });
}

// =============================================================================
// TYPES
// =============================================================================

interface GtfsAgency {
  agency_id: string;
  agency_name: string;
  agency_url: string;
  agency_timezone: string;
  agency_lang?: string;
  agency_phone?: string;
}

interface GtfsStop {
  stop_id: string;
  stop_code?: string;
  stop_name: string;
  stop_desc?: string;
  stop_lat: string;
  stop_lon: string;
  zone_id?: string;
  stop_url?: string;
  location_type?: string;
  parent_station?: string;
  platform_code?: string;
}

interface GtfsRoute {
  route_id: string;
  agency_id?: string;
  route_short_name?: string;
  route_long_name?: string;
  route_desc?: string;
  route_type: string;
  route_url?: string;
  route_color?: string;
  route_text_color?: string;
}

interface GtfsCalendar {
  service_id: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  start_date: string;
  end_date: string;
}

interface GtfsCalendarDate {
  service_id: string;
  date: string;
  exception_type: string;
}

interface GtfsTrip {
  trip_id: string;
  route_id: string;
  service_id: string;
  trip_headsign?: string;
  trip_short_name?: string;
  direction_id?: string;
  block_id?: string;
  shape_id?: string;
}

interface GtfsStopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: string;
  stop_headsign?: string;
  pickup_type?: string;
  drop_off_type?: string;
}

// =============================================================================
// UTILITIES
// =============================================================================

function log(message: string, emoji = "📋") {
  console.log(`${emoji} ${message}`);
}

function formatDate(yyyymmdd: string): string {
  // GTFS dates are YYYYMMDD, convert to YYYY-MM-DD
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

function parseBoolean(value: string): boolean {
  return value === "1";
}

function parseIntOrNull(value: string | undefined): number | null {
  if (!value || value === "") return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

async function parseCSV<T>(filePath: string): Promise<T[]> {
  const results: T[] = [];

  if (!existsSync(filePath)) {
    log(`File not found: ${filePath}, skipping...`, "⚠️");
    return results;
  }

  return new Promise((resolve, reject) => {
    createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: T) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

async function batchInsert<T>(
  tableName: string,
  records: T[],
  insertFn: (batch: T[]) => Promise<void>
): Promise<void> {
  const totalBatches = Math.ceil(records.length / BATCH_SIZE);
  log(`Inserting ${records.length} records in ${totalBatches} batches...`);

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    if (!DRY_RUN) {
      await insertFn(batch);
    }

    process.stdout.write(
      `\r  Batch ${batchNum}/${totalBatches} (${Math.min(i + BATCH_SIZE, records.length)}/${records.length})`
    );
  }
  console.log(); // New line after progress
}

// =============================================================================
// DOWNLOAD & EXTRACT
// =============================================================================

async function downloadGTFS(): Promise<void> {
  log("Downloading GTFS feed...", "⬇️");

  // Clean up and create temp directory
  if (existsSync(TEMP_DIR)) {
    rmSync(TEMP_DIR, { recursive: true });
  }
  mkdirSync(TEMP_DIR, { recursive: true });

  const zipPath = resolve(TEMP_DIR, "gtfs.zip");

  // Download the zip file
  const response = await fetch(GTFS_URL, {
    headers: process.env.METLINK_API_KEY
      ? { "x-api-key": process.env.METLINK_API_KEY }
      : {},
  });

  if (!response.ok) {
    throw new Error(`Failed to download GTFS: ${response.status} ${response.statusText}`);
  }

  // Save to disk
  const fileStream = createWriteStream(zipPath);
  await pipeline(response.body as NodeJS.ReadableStream, fileStream);

  log("Extracting GTFS files...", "📦");

  // Extract the zip
  await createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: TEMP_DIR }))
    .promise();

  log("GTFS files extracted", "✅");
}

// =============================================================================
// IMPORT FUNCTIONS
// =============================================================================

// Helper to convert undefined/empty strings to null
function toNull(value: string | undefined | null): string | null {
  if (value === undefined || value === null || value === "") return null;
  return value;
}

function timeToSeconds(value: string): number {
  const [h = "0", m = "0", s = "0"] = value.split(":");
  const hours = parseInt(h, 10) || 0;
  const minutes = parseInt(m, 10) || 0;
  const seconds = parseInt(s, 10) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

function filterRecords<T>(
  records: T[],
  isValid: (record: T) => boolean,
  entity: string
): T[] {
  let skipped = 0;
  const filtered = records.filter((record) => {
    const ok = isValid(record);
    if (!ok) skipped += 1;
    return ok;
  });
  if (skipped > 0) {
    log(`Skipped ${skipped} invalid ${entity} rows`, "⚠️");
  }
  return filtered;
}

async function importAgency(): Promise<void> {
  log("Importing agency.txt...", "🏢");
  const records = await parseCSV<GtfsAgency>(resolve(TEMP_DIR, "agency.txt"));
  log(`Found ${records.length} agencies`);

  if (DRY_RUN || !db || !tables) return;

  const validRecords = filterRecords(
    records,
    (r) =>
      Boolean(r.agency_id) &&
      Boolean(r.agency_name) &&
      Boolean(r.agency_url) &&
      Boolean(r.agency_timezone),
    "agency"
  );

  if (validRecords.length === 0) {
    log("No valid agency rows to import", "⚠️");
    return;
  }

  await db.insert(tables.agency).values(
    validRecords.map((r) => ({
      agencyId: r.agency_id,
      agencyName: r.agency_name,
      agencyUrl: r.agency_url,
      agencyTimezone: r.agency_timezone,
      agencyLang: toNull(r.agency_lang),
      agencyPhone: toNull(r.agency_phone),
    }))
  );

  log(`Imported ${records.length} agencies`, "✅");
}

async function importStops(): Promise<void> {
  log("Importing stops.txt...", "🚏");
  const records = await parseCSV<GtfsStop>(resolve(TEMP_DIR, "stops.txt"));
  log(`Found ${records.length} stops`);

  if (DRY_RUN || !db || !tables) return;

  const validRecords = filterRecords(
    records,
    (r) =>
      Boolean(r.stop_id) &&
      Boolean(r.stop_name) &&
      Boolean(r.stop_lat) &&
      Boolean(r.stop_lon),
    "stops"
  );

  if (validRecords.length === 0) {
    log("No valid stops to import", "⚠️");
    return;
  }

  await batchInsert("stops", validRecords, async (batch) => {
    await db!.insert(tables!.stops).values(
      batch.map((r) => ({
        stopId: r.stop_id,
        stopCode: toNull(r.stop_code),
        stopName: r.stop_name,
        stopDesc: toNull(r.stop_desc),
        stopLat: r.stop_lat,
        stopLon: r.stop_lon,
        zoneId: toNull(r.zone_id),
        stopUrl: toNull(r.stop_url),
        locationType: parseIntOrNull(r.location_type) ?? 0,
        parentStation: toNull(r.parent_station),
        platformCode: toNull(r.platform_code),
      }))
    );
  });

  log(`Imported ${records.length} stops`, "✅");
}

async function importRoutes(): Promise<void> {
  log("Importing routes.txt...", "🚌");
  const records = await parseCSV<GtfsRoute>(resolve(TEMP_DIR, "routes.txt"));
  log(`Found ${records.length} routes`);

  if (DRY_RUN || !db || !tables) return;

  const validRecords = filterRecords(
    records,
    (r) => Boolean(r.route_id) && Boolean(r.route_type),
    "routes"
  );

  if (validRecords.length === 0) {
    log("No valid routes to import", "⚠️");
    return;
  }

  await batchInsert("routes", validRecords, async (batch) => {
    await db!.insert(tables!.routes).values(
      batch.map((r) => ({
        routeId: r.route_id,
        agencyId: toNull(r.agency_id),
        routeShortName: toNull(r.route_short_name),
        routeLongName: toNull(r.route_long_name),
        routeDesc: toNull(r.route_desc),
        routeType: parseInt(r.route_type, 10),
        routeUrl: toNull(r.route_url),
        routeColor: toNull(r.route_color),
        routeTextColor: toNull(r.route_text_color),
      }))
    );
  });

  log(`Imported ${records.length} routes`, "✅");
}

async function importCalendar(): Promise<void> {
  log("Importing calendar.txt...", "📅");
  const records = await parseCSV<GtfsCalendar>(resolve(TEMP_DIR, "calendar.txt"));
  log(`Found ${records.length} calendar entries`);

  if (DRY_RUN || !db || !tables || records.length === 0) return;

  const validRecords = filterRecords(
    records,
    (r) =>
      Boolean(r.service_id) &&
      Boolean(r.start_date) &&
      Boolean(r.end_date),
    "calendar"
  );

  if (validRecords.length === 0) {
    log("No valid calendar rows to import", "⚠️");
    return;
  }

  await batchInsert("calendar", validRecords, async (batch) => {
    await db!.insert(tables!.calendar).values(
      batch.map((r) => ({
        serviceId: r.service_id,
        monday: parseBoolean(r.monday),
        tuesday: parseBoolean(r.tuesday),
        wednesday: parseBoolean(r.wednesday),
        thursday: parseBoolean(r.thursday),
        friday: parseBoolean(r.friday),
        saturday: parseBoolean(r.saturday),
        sunday: parseBoolean(r.sunday),
        startDate: formatDate(r.start_date),
        endDate: formatDate(r.end_date),
      }))
    );
  });

  log(`Imported ${records.length} calendar entries`, "✅");
}

async function importCalendarDates(): Promise<void> {
  log("Importing calendar_dates.txt...", "📆");
  const records = await parseCSV<GtfsCalendarDate>(
    resolve(TEMP_DIR, "calendar_dates.txt")
  );
  log(`Found ${records.length} calendar date exceptions`);

  if (DRY_RUN || !db || !tables || records.length === 0) return;

  const validRecords = filterRecords(
    records,
    (r) =>
      Boolean(r.service_id) &&
      Boolean(r.date) &&
      Boolean(r.exception_type),
    "calendar_dates"
  );

  if (validRecords.length === 0) {
    log("No valid calendar date rows to import", "⚠️");
    return;
  }

  await batchInsert("calendar_dates", validRecords, async (batch) => {
    await db!.insert(tables!.calendarDates).values(
      batch.map((r) => ({
        serviceId: r.service_id,
        date: formatDate(r.date),
        exceptionType: parseInt(r.exception_type, 10),
      }))
    );
  });

  log(`Imported ${records.length} calendar date exceptions`, "✅");
}

async function importTrips(): Promise<void> {
  log("Importing trips.txt...", "🚃");
  const records = await parseCSV<GtfsTrip>(resolve(TEMP_DIR, "trips.txt"));
  log(`Found ${records.length} trips`);

  if (DRY_RUN || !db || !tables) return;

  const validRecords = filterRecords(
    records,
    (r) => Boolean(r.trip_id) && Boolean(r.route_id) && Boolean(r.service_id),
    "trips"
  );

  if (validRecords.length === 0) {
    log("No valid trips to import", "⚠️");
    return;
  }

  await batchInsert("trips", validRecords, async (batch) => {
    await db!.insert(tables!.trips).values(
      batch.map((r) => ({
        tripId: r.trip_id,
        routeId: r.route_id,
        serviceId: r.service_id,
        tripHeadsign: toNull(r.trip_headsign),
        tripShortName: toNull(r.trip_short_name),
        directionId: parseIntOrNull(r.direction_id),
        blockId: toNull(r.block_id),
        shapeId: toNull(r.shape_id),
      }))
    );
  });

  log(`Imported ${records.length} trips`, "✅");
}

async function importStopTimes(): Promise<void> {
  log("Importing stop_times.txt (this may take a while)...", "⏱️");
  const records = await parseCSV<GtfsStopTime>(resolve(TEMP_DIR, "stop_times.txt"));
  log(`Found ${records.length} stop times`);

  if (DRY_RUN || !db || !tables) return;

  const validRecords = filterRecords(
    records,
    (r) =>
      Boolean(r.trip_id) &&
      Boolean(r.stop_id) &&
      Boolean(r.arrival_time) &&
      Boolean(r.departure_time) &&
      Boolean(r.stop_sequence),
    "stop_times"
  );

  if (validRecords.length === 0) {
    log("No valid stop_times rows to import", "⚠️");
    return;
  }

  await batchInsert("stop_times", validRecords, async (batch) => {
    await db!.insert(tables!.stopTimes).values(
      batch.map((r) => ({
        tripId: r.trip_id,
        arrivalTime: timeToSeconds(r.arrival_time),
        departureTime: timeToSeconds(r.departure_time),
        stopId: r.stop_id,
        stopSequence: parseInt(r.stop_sequence, 10),
        stopHeadsign: toNull(r.stop_headsign),
        pickupType: parseIntOrNull(r.pickup_type) ?? 0,
        dropOffType: parseIntOrNull(r.drop_off_type) ?? 0,
      }))
    );
  });

  log(`Imported ${records.length} stop times`, "✅");
}

// =============================================================================
// CLEAR ALL TABLES
// =============================================================================

async function clearAllTables(): Promise<void> {
  if (DRY_RUN) return;
  await initDb();
  if (!db) return;

  log("Clearing all GTFS tables...", "🗑️");

  // Use TRUNCATE CASCADE to handle FK constraints
  // Order matters: child tables first
  await db.execute(sql`TRUNCATE TABLE stop_times CASCADE`);
  await db.execute(sql`TRUNCATE TABLE trips CASCADE`);
  await db.execute(sql`TRUNCATE TABLE calendar_dates CASCADE`);
  await db.execute(sql`TRUNCATE TABLE calendar CASCADE`);
  await db.execute(sql`TRUNCATE TABLE routes CASCADE`);
  await db.execute(sql`TRUNCATE TABLE stops CASCADE`);
  await db.execute(sql`TRUNCATE TABLE agency CASCADE`);

  log("Tables cleared", "✅");
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("🚂 GTFS STATIC INGESTOR");
  console.log("=".repeat(60) + "\n");

  if (DRY_RUN) {
    log("DRY RUN MODE - No database writes will be made", "🔍");
  }

  if (!DRY_RUN) {
    await initDb();
  }

  const startTime = Date.now();

  try {
    // Download and extract GTFS
    await downloadGTFS();

    // Clear all tables first to avoid FK constraint issues
    await clearAllTables();

    // Import in dependency order
    // 1. Agency (no dependencies)
    await importAgency();

    // 2. Stops (no dependencies)
    await importStops();

    // 3. Routes (depends on agency)
    await importRoutes();

    // 4. Calendar (no dependencies)
    await importCalendar();

    // 5. Calendar Dates (depends on calendar - but uses service_id reference)
    await importCalendarDates();

    // 6. Trips (depends on routes, calendar)
    await importTrips();

    // 7. Stop Times (depends on trips, stops) - LARGEST TABLE
    await importStopTimes();

    // Cleanup temp directory
    log("Cleaning up...", "🧹");
    rmSync(TEMP_DIR, { recursive: true });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("\n" + "=".repeat(60));
    log(`GTFS import completed in ${duration}s`, "🎉");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  } finally {
    // Close database connection
    if (queryClient) {
      await queryClient.end();
    }
  }
}

main();


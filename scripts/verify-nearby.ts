/**
 * Verify Nearby Stops Query
 *
 * Tests the PostGIS spatial query for finding bus stops near a location.
 * Uses Wellington Railway Station as the test location.
 *
 * Usage:
 *   npm run verify-nearby
 *
 * Environment:
 *   DATABASE_URL - Postgres connection string
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from monorepo root
config({ path: resolve(__dirname, "../.env") });

// =============================================================================
// CONFIGURATION
// =============================================================================

// Wellington Railway Station coordinates
const TEST_LOCATION = {
  name: "Wellington Railway Station",
  lat: -41.2789,
  lon: 174.7805,
};

// Search radius in meters
const RADIUS_METERS = 500;

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const queryClient = postgres(connectionString);

// =============================================================================
// TYPES
// =============================================================================

interface NearbyStop {
  stop_id: string;
  stop_name: string;
  stop_code: string | null;
  distance_meters: number;
  stop_lat: number;
  stop_lon: number;
}

// =============================================================================
// QUERIES
// =============================================================================

async function findNearbyStops(
  lat: number,
  lon: number,
  radiusMeters: number
): Promise<NearbyStop[]> {
  const rows = await queryClient<NearbyStop>`
    SELECT 
      stop_id,
      stop_name,
      stop_code,
      stop_lat::float as stop_lat,
      stop_lon::float as stop_lon,
      ROUND(ST_Distance(
        location, 
        ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
      )::numeric, 1) as distance_meters
    FROM stops
    WHERE ST_DWithin(
      location, 
      ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography, 
      ${radiusMeters}
    )
    ORDER BY distance_meters ASC
    LIMIT 20
  `;

  return rows;
}

async function countTotalStops(): Promise<number> {
  const result = await queryClient<{ count: number }>`
    SELECT COUNT(*)::int as count FROM stops
  `;
  return result[0]?.count ?? 0;
}

async function countStopsWithLocation(): Promise<number> {
  const result = await queryClient<{ count: number }>`
    SELECT COUNT(*)::int as count FROM stops WHERE location IS NOT NULL
  `;
  return result[0]?.count ?? 0;
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 NEARBY STOPS VERIFICATION");
  console.log("=".repeat(60) + "\n");

  try {
    // Check database stats
    const totalStops = await countTotalStops();
    const stopsWithLocation = await countStopsWithLocation();

    console.log("📊 Database Stats:");
    console.log(`   Total stops: ${totalStops.toLocaleString()}`);
    console.log(`   Stops with location: ${stopsWithLocation.toLocaleString()}`);
    console.log(
      `   Location coverage: ${((stopsWithLocation / totalStops) * 100).toFixed(1)}%`
    );

    if (stopsWithLocation === 0) {
      console.log("\n⚠️  No stops have location data populated.");
      console.log("   Run the GTFS ingestor first: npm run ingest");
      console.log(
        "   The trigger should auto-populate the location column.\n"
      );
      return;
    }

    // Run the spatial query
    console.log(`\n📍 Test Location: ${TEST_LOCATION.name}`);
    console.log(`   Coordinates: ${TEST_LOCATION.lat}, ${TEST_LOCATION.lon}`);
    console.log(`   Search radius: ${RADIUS_METERS}m`);

    console.log("\n🚏 Nearby Stops:\n");

    const startTime = Date.now();
    const nearbyStops = await findNearbyStops(
      TEST_LOCATION.lat,
      TEST_LOCATION.lon,
      RADIUS_METERS
    );
    const queryTime = Date.now() - startTime;

    if (nearbyStops.length === 0) {
      console.log("   No stops found within the search radius.");
      console.log("   Try increasing the radius or check the location coordinates.");
    } else {
      // Table header
      console.log(
        "   " +
          "Stop ID".padEnd(12) +
          "Code".padEnd(8) +
          "Distance".padEnd(12) +
          "Name"
      );
      console.log("   " + "-".repeat(70));

      // Table rows
      nearbyStops.forEach((stop) => {
        const distance = `${stop.distance_meters}m`;
        console.log(
          "   " +
            stop.stop_id.padEnd(12) +
            (stop.stop_code || "-").padEnd(8) +
            distance.padEnd(12) +
            stop.stop_name.slice(0, 40)
        );
      });

      console.log("\n   " + "-".repeat(70));
      console.log(`   Found ${nearbyStops.length} stops in ${queryTime}ms`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Spatial query verification complete!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
}

main();


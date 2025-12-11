/**
 * SSE Departures Service
 *
 * Provides departure data fetching for Server-Sent Events streaming.
 * Includes content hashing for change detection to avoid pushing duplicate data.
 */

import {
  db,
  stopTimes,
  trips,
  routes,
  calendar,
  getTripDelays,
} from "@metlink/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { createHash } from "crypto";

// =============================================================================
// TYPES
// =============================================================================

type DepartureStatus = "ON_TIME" | "DELAYED" | "EARLY" | "CANCELLED";

export interface SSEDeparture {
  tripId: string;
  routeId: string;
  routeShortName: string;
  tripHeadsign: string;
  scheduledDeparture: string;
  realtimeDeparture: string | null;
  delaySeconds: number;
  status: DepartureStatus;
}

export interface SSEDeparturesData {
  stopId: string;
  departures: SSEDeparture[];
  timestamp: number;
  hash: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function secondsToTimeString(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function getCurrentTimeSeconds(): number {
  const now = new Date();
  const nzTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Pacific/Auckland" })
  );
  return (
    nzTime.getHours() * 3600 + nzTime.getMinutes() * 60 + nzTime.getSeconds()
  );
}

function getCurrentDateString(): string {
  const now = new Date();
  const nzTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Pacific/Auckland" })
  );
  return nzTime.toISOString().split("T")[0];
}

function getCurrentDayOfWeek(): number {
  const now = new Date();
  const nzTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Pacific/Auckland" })
  );
  return nzTime.getDay();
}

function getStatus(delaySeconds: number): DepartureStatus {
  if (delaySeconds > 60) return "DELAYED";
  if (delaySeconds < -60) return "EARLY";
  return "ON_TIME";
}

const dayColumns = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

/**
 * Generate a hash of the departure data for change detection
 */
function generateHash(departures: SSEDeparture[]): string {
  const content = JSON.stringify(
    departures.map((d) => ({
      tripId: d.tripId,
      delaySeconds: d.delaySeconds,
      status: d.status,
    }))
  );
  return createHash("md5").update(content).digest("hex").slice(0, 8);
}

// =============================================================================
// MAIN SERVICE FUNCTION
// =============================================================================

/**
 * Fetch departures for SSE streaming
 * Returns departure data with a content hash for change detection
 */
export async function fetchDeparturesForSSE(
  stopId: string,
  limit: number = 20,
  timeRangeSeconds: number = 7200
): Promise<SSEDeparturesData> {
  const currentTimeSeconds = getCurrentTimeSeconds();
  const currentDate = getCurrentDateString();
  const dayOfWeek = getCurrentDayOfWeek();
  const dayColumn = dayColumns[dayOfWeek];
  const endTimeSeconds = currentTimeSeconds + timeRangeSeconds;

  // Query departures from database
  const result = await db
    .select({
      tripId: stopTimes.tripId,
      departureTime: stopTimes.departureTime,
      stopHeadsign: stopTimes.stopHeadsign,
      routeId: trips.routeId,
      tripHeadsign: trips.tripHeadsign,
      routeShortName: routes.routeShortName,
    })
    .from(stopTimes)
    .innerJoin(trips, eq(stopTimes.tripId, trips.tripId))
    .innerJoin(routes, eq(trips.routeId, routes.routeId))
    .innerJoin(calendar, eq(trips.serviceId, calendar.serviceId))
    .where(
      and(
        eq(stopTimes.stopId, stopId),
        gte(stopTimes.departureTime, currentTimeSeconds),
        lte(stopTimes.departureTime, endTimeSeconds),
        sql`${calendar[dayColumn]} = true`,
        lte(calendar.startDate, currentDate),
        gte(calendar.endDate, currentDate)
      )
    )
    .orderBy(stopTimes.departureTime)
    .limit(limit);

  // Get trip IDs and fetch delays from Redis
  const tripIds = result.map((r) => r.tripId);
  const delays = await getTripDelays(tripIds);

  // Build departure list
  const departures: SSEDeparture[] = result.map((row) => {
    const delay = delays.get(row.tripId);
    const delaySeconds = delay?.delaySeconds ?? 0;
    const realtimeDepartureSeconds = row.departureTime + delaySeconds;

    return {
      tripId: row.tripId,
      routeId: row.routeId,
      routeShortName: row.routeShortName ?? "",
      tripHeadsign: row.stopHeadsign ?? row.tripHeadsign ?? "",
      scheduledDeparture: secondsToTimeString(row.departureTime),
      realtimeDeparture:
        delaySeconds !== 0
          ? secondsToTimeString(realtimeDepartureSeconds)
          : null,
      delaySeconds,
      status: getStatus(delaySeconds),
    };
  });

  return {
    stopId,
    departures,
    timestamp: Date.now(),
    hash: generateHash(departures),
  };
}

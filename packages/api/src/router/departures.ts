import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { stopTimes, trips, routes, calendar } from "@metlink/db";
import { getTripDelays } from "@metlink/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

// =============================================================================
// DEPARTURE TYPES
// =============================================================================

type DepartureStatus = "ON_TIME" | "DELAYED" | "EARLY" | "CANCELLED";

interface Departure {
  tripId: string;
  routeId: string;
  routeShortName: string;
  routeLongName: string | null;
  tripHeadsign: string;
  scheduledDeparture: string; // HH:MM:SS
  scheduledDepartureSeconds: number;
  realtimeDeparture: string | null;
  delaySeconds: number;
  status: DepartureStatus;
  stopSequence: number;
}

interface DeparturesResponse {
  stopId: string;
  departures: Departure[];
  lastUpdated: Date;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert seconds from midnight to HH:MM:SS string
 * Handles times > 24:00:00 for overnight trips
 */
function secondsToTimeString(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get current time as seconds from midnight in NZ timezone
 */
function getCurrentTimeSeconds(): number {
  const now = new Date();
  // Convert to NZ timezone
  const nzTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Pacific/Auckland" })
  );
  return (
    nzTime.getHours() * 3600 + nzTime.getMinutes() * 60 + nzTime.getSeconds()
  );
}

/**
 * Get current date in YYYY-MM-DD format in NZ timezone
 */
function getCurrentDateString(): string {
  const now = new Date();
  const nzTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Pacific/Auckland" })
  );
  return nzTime.toISOString().split("T")[0];
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday) in NZ timezone
 */
function getCurrentDayOfWeek(): number {
  const now = new Date();
  const nzTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Pacific/Auckland" })
  );
  return nzTime.getDay();
}

/**
 * Determine departure status based on delay
 */
function getStatus(delaySeconds: number): DepartureStatus {
  if (delaySeconds > 60) return "DELAYED";
  if (delaySeconds < -60) return "EARLY";
  return "ON_TIME";
}

// Day of week column mapping
const dayColumns = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

// =============================================================================
// DEPARTURES ROUTER
// =============================================================================

export const departuresRouter = router({
  /**
   * Get departures for a specific stop
   * Merges scheduled times (Postgres) with real-time data (Redis)
   */
  getForStop: publicProcedure
    .input(
      z.object({
        stopId: z.string(),
        limit: z.number().min(1).max(50).default(20),
        // Time range in seconds from now (defaults to next 2 hours = 7200s)
        timeRangeSeconds: z.number().min(0).max(86400).default(7200),
      })
    )
    .query(async ({ ctx, input }): Promise<DeparturesResponse> => {
      const { stopId, limit, timeRangeSeconds } = input;

      const currentTimeSeconds = getCurrentTimeSeconds();
      const currentDate = getCurrentDateString();
      const dayOfWeek = getCurrentDayOfWeek();
      const dayColumn = dayColumns[dayOfWeek];

      const endTimeSeconds = currentTimeSeconds + timeRangeSeconds;

      // Query stop_times joined with trips, routes, and calendar
      // Filter by:
      // 1. Stop ID
      // 2. Time range (departure_time between now and now + timeRange)
      // 3. Active service (calendar day is true and date is within range)
      const result = await ctx.db
        .select({
          tripId: stopTimes.tripId,
          departureTime: stopTimes.departureTime,
          stopSequence: stopTimes.stopSequence,
          stopHeadsign: stopTimes.stopHeadsign,
          routeId: trips.routeId,
          tripHeadsign: trips.tripHeadsign,
          serviceId: trips.serviceId,
          routeShortName: routes.routeShortName,
          routeLongName: routes.routeLongName,
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
            // Check if service is active on current day
            sql`${calendar[dayColumn]} = true`,
            // Check if current date is within service date range
            lte(calendar.startDate, currentDate),
            gte(calendar.endDate, currentDate)
          )
        )
        .orderBy(stopTimes.departureTime)
        .limit(limit);

      // Get trip IDs for Redis lookup
      const tripIds = result.map((r) => r.tripId);

      // Batch fetch delays from Redis
      const delays = await getTripDelays(tripIds);

      // Build departure list with real-time data merged
      const departures: Departure[] = result.map((row) => {
        const delay = delays.get(row.tripId);
        const delaySeconds = delay?.delaySeconds ?? 0;

        // Calculate real-time departure
        const realtimeDepartureSeconds = row.departureTime + delaySeconds;

        return {
          tripId: row.tripId,
          routeId: row.routeId,
          routeShortName: row.routeShortName ?? "",
          routeLongName: row.routeLongName,
          tripHeadsign: row.stopHeadsign ?? row.tripHeadsign ?? "",
          scheduledDeparture: secondsToTimeString(row.departureTime),
          scheduledDepartureSeconds: row.departureTime,
          realtimeDeparture:
            delaySeconds !== 0
              ? secondsToTimeString(realtimeDepartureSeconds)
              : null,
          delaySeconds,
          status: getStatus(delaySeconds),
          stopSequence: row.stopSequence,
        };
      });

      return {
        stopId,
        departures,
        lastUpdated: new Date(),
      };
    }),
});

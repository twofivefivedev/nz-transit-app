import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { stops } from "@metlink/db";
import { eq, ilike, sql } from "drizzle-orm";

// =============================================================================
// STOP RESPONSE TYPES
// =============================================================================

interface StopWithDistance {
  stopId: string;
  stopCode: string | null;
  stopName: string;
  stopLat: number;
  stopLon: number;
  distance: number; // meters
}

interface Stop {
  stopId: string;
  stopCode: string | null;
  stopName: string;
  stopLat: number;
  stopLon: number;
  locationType: number | null;
  parentStation: string | null;
  platformCode: string | null;
}

// =============================================================================
// STOPS ROUTER
// =============================================================================

export const stopsRouter = router({
  /**
   * Get nearby stops based on latitude and longitude
   * Uses PostGIS for geospatial queries
   */
  getNearby: publicProcedure
    .input(
      z.object({
        lat: z.number().min(-90).max(90),
        lon: z.number().min(-180).max(180),
        radius: z.number().min(0).max(10000).default(1000), // meters
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }): Promise<{ stops: StopWithDistance[] }> => {
      const { lat, lon, radius, limit } = input;

      // Use PostGIS ST_DWithin for efficient radius search
      // The location column is a geography type, so distances are in meters
      // Use PostGIS ST_DWithin for efficient radius search
      // Drizzle execute() returns rows directly as an array
      const rows = await ctx.db.execute<{
        stop_id: string;
        stop_code: string | null;
        stop_name: string;
        stop_lat: string;
        stop_lon: string;
        distance: number;
      }>(sql`
        SELECT 
          stop_id,
          stop_code,
          stop_name,
          stop_lat,
          stop_lon,
          ST_Distance(
            location,
            ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
          ) as distance
        FROM stops
        WHERE ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
          ${radius}
        )
        ORDER BY distance
        LIMIT ${limit}
      `);

      // Handle both array and { rows: [] } response formats
      const resultRows = Array.isArray(rows) ? rows : (rows as unknown as { rows: typeof rows }).rows ?? [];

      const nearbyStops: StopWithDistance[] = resultRows.map((row) => ({
        stopId: row.stop_id,
        stopCode: row.stop_code,
        stopName: row.stop_name,
        stopLat: parseFloat(row.stop_lat),
        stopLon: parseFloat(row.stop_lon),
        distance: Math.round(row.distance),
      }));

      return { stops: nearbyStops };
    }),

  /**
   * Get a single stop by ID
   */
  getById: publicProcedure
    .input(z.object({ stopId: z.string() }))
    .query(async ({ ctx, input }): Promise<Stop | null> => {
      const result = await ctx.db
        .select({
          stopId: stops.stopId,
          stopCode: stops.stopCode,
          stopName: stops.stopName,
          stopLat: stops.stopLat,
          stopLon: stops.stopLon,
          locationType: stops.locationType,
          parentStation: stops.parentStation,
          platformCode: stops.platformCode,
        })
        .from(stops)
        .where(eq(stops.stopId, input.stopId))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const stop = result[0];
      return {
        stopId: stop.stopId,
        stopCode: stop.stopCode,
        stopName: stop.stopName,
        stopLat: parseFloat(stop.stopLat),
        stopLon: parseFloat(stop.stopLon),
        locationType: stop.locationType,
        parentStation: stop.parentStation,
        platformCode: stop.platformCode,
      };
    }),

  /**
   * Search stops by name (case-insensitive)
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(
      async ({
        ctx,
        input,
      }): Promise<{ stops: Stop[]; query: string }> => {
        const searchPattern = `%${input.query}%`;

        const result = await ctx.db
          .select({
            stopId: stops.stopId,
            stopCode: stops.stopCode,
            stopName: stops.stopName,
            stopLat: stops.stopLat,
            stopLon: stops.stopLon,
            locationType: stops.locationType,
            parentStation: stops.parentStation,
            platformCode: stops.platformCode,
          })
          .from(stops)
          .where(ilike(stops.stopName, searchPattern))
          .limit(input.limit);

        const searchResults: Stop[] = result.map((stop) => ({
          stopId: stop.stopId,
          stopCode: stop.stopCode,
          stopName: stop.stopName,
          stopLat: parseFloat(stop.stopLat),
          stopLon: parseFloat(stop.stopLon),
          locationType: stop.locationType,
          parentStation: stop.parentStation,
          platformCode: stop.platformCode,
        }));

        return {
          stops: searchResults,
          query: input.query,
        };
      }
    ),
});

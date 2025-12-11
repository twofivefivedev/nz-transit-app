import { z } from "zod";
import { router, publicProcedure } from "../trpc";

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
    .query(async ({ input }) => {
      // TODO: Implement PostGIS query
      // SELECT * FROM stops
      // WHERE ST_DWithin(location, ST_MakePoint($lon, $lat)::geography, $radius)
      // ORDER BY location <-> ST_MakePoint($lon, $lat)::geography
      // LIMIT $limit;
      return {
        stops: [],
        query: input,
      };
    }),

  /**
   * Get a single stop by ID
   */
  getById: publicProcedure
    .input(z.object({ stopId: z.string() }))
    .query(async ({ input }) => {
      // TODO: Implement database query
      return {
        stopId: input.stopId,
        stopName: "",
        stopLat: 0,
        stopLon: 0,
      };
    }),

  /**
   * Search stops by name
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      // TODO: Implement full-text search
      return {
        stops: [],
        query: input.query,
      };
    }),
});









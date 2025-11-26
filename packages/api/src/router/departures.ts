import { z } from "zod";
import { router, publicProcedure } from "../trpc";

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
        // Time range to query (defaults to next 2 hours)
        startTime: z.date().optional(),
        endTime: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      // TODO: Implement departure query
      // 1. Query stop_times for scheduled departures
      // 2. Join with trips and routes for route info
      // 3. Merge with Redis real-time data for delays/cancellations
      return {
        stopId: input.stopId,
        departures: [],
        lastUpdated: new Date(),
      };
    }),

  /**
   * Subscribe to real-time updates for a stop
   * Returns SSE stream for live departure updates
   */
  // subscribeToStop: publicProcedure
  //   .input(z.object({ stopId: z.string() }))
  //   .subscription(async function* ({ input }) {
  //     // TODO: Implement SSE subscription via Redis pub/sub
  //     yield { type: "connected", stopId: input.stopId };
  //   }),
});






export { appRouter, type AppRouter } from "./router";
export { createTRPCContext, type TRPCContext } from "./trpc";

// GTFS-RT Service
export {
  syncGtfsRealtime,
  processTripUpdates,
  processVehiclePositions,
  processServiceAlerts,
  type SyncResult,
} from "./services/gtfs-realtime";

// SSE Departures Service
export {
  fetchDeparturesForSSE,
  type SSEDeparture,
  type SSEDeparturesData,
} from "./services/sse-departures";









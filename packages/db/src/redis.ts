import { Redis } from "@upstash/redis";

// =============================================================================
// UPSTASH REDIS CLIENT
// =============================================================================
// Used for hot state: vehicle positions, real-time delays, service alerts
// Configure via environment variables:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
// =============================================================================

// Lazy singleton - only creates connection when first used
let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        "Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN environment variables"
      );
    }

    redisInstance = new Redis({
      url,
      token,
    });
  }
  return redisInstance;
}

// =============================================================================
// KEY PATTERNS FOR TRANSIT DATA
// =============================================================================

export const REDIS_KEYS = {
  // Vehicle position: vehicle:{vehicle_id}
  // TTL: 60s (stale after 1 minute)
  vehiclePosition: (vehicleId: string) => `vehicle:${vehicleId}` as const,

  // Trip delay: delay:{trip_id}
  // TTL: 60s
  tripDelay: (tripId: string) => `delay:${tripId}` as const,

  // Stop departures (cached realtime): stop:{stop_id}:departures
  // TTL: 30s
  stopDepartures: (stopId: string) => `stop:${stopId}:departures` as const,

  // Service alert: alert:{alert_id}
  // TTL: 300s (5 minutes)
  serviceAlert: (alertId: string) => `alert:${alertId}` as const,

  // All active alerts list
  activeAlerts: "alerts:active" as const,

  // Pub/Sub channels for real-time updates
  channels: {
    stopUpdates: (stopId: string) => `stop:${stopId}` as const,
    vehicleUpdates: "vehicles" as const,
    alerts: "alerts" as const,
  },
} as const;

// =============================================================================
// DEFAULT TTLs (in seconds)
// =============================================================================

export const REDIS_TTL = {
  VEHICLE_POSITION: 60, // 1 minute - vehicle positions go stale fast
  TRIP_DELAY: 60, // 1 minute
  STOP_DEPARTURES: 30, // 30 seconds - keep departures fresh
  SERVICE_ALERT: 300, // 5 minutes
} as const;

// =============================================================================
// TYPE DEFINITIONS FOR CACHED DATA
// =============================================================================

export interface VehiclePosition {
  vehicleId: string;
  tripId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  bearing?: number;
  speed?: number;
  timestamp: number; // Unix timestamp
  currentStopSequence?: number;
  currentStatus?: "INCOMING_AT" | "STOPPED_AT" | "IN_TRANSIT_TO";
}

export interface TripDelay {
  tripId: string;
  delaySeconds: number; // Positive = late, Negative = early
  timestamp: number;
}

export interface CachedDeparture {
  tripId: string;
  routeId: string;
  routeShortName: string;
  tripHeadsign: string;
  scheduledDeparture: string; // HH:MM:SS
  realtimeDeparture?: string; // HH:MM:SS (if available)
  delaySeconds: number;
  status: "ON_TIME" | "DELAYED" | "EARLY" | "CANCELLED";
}

export interface ServiceAlert {
  alertId: string;
  headerText: string;
  descriptionText: string;
  cause?: string;
  effect?: string;
  affectedRoutes?: string[];
  affectedStops?: string[];
  activePeriodStart?: number;
  activePeriodEnd?: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Store vehicle position with automatic TTL
 */
export async function setVehiclePosition(
  position: VehiclePosition
): Promise<void> {
  const redis = getRedis();
  const key = REDIS_KEYS.vehiclePosition(position.vehicleId);
  await redis.set(key, JSON.stringify(position), {
    ex: REDIS_TTL.VEHICLE_POSITION,
  });
}

/**
 * Get vehicle position
 */
export async function getVehiclePosition(
  vehicleId: string
): Promise<VehiclePosition | null> {
  const redis = getRedis();
  const key = REDIS_KEYS.vehiclePosition(vehicleId);
  const data = await redis.get<string>(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Store trip delay with automatic TTL
 */
export async function setTripDelay(delay: TripDelay): Promise<void> {
  const redis = getRedis();
  const key = REDIS_KEYS.tripDelay(delay.tripId);
  await redis.set(key, JSON.stringify(delay), {
    ex: REDIS_TTL.TRIP_DELAY,
  });
}

/**
 * Get trip delay
 */
export async function getTripDelay(tripId: string): Promise<TripDelay | null> {
  const redis = getRedis();
  const key = REDIS_KEYS.tripDelay(tripId);
  const data = await redis.get<string>(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Batch get trip delays for multiple trips
 */
export async function getTripDelays(
  tripIds: string[]
): Promise<Map<string, TripDelay>> {
  const redis = getRedis();
  const keys = tripIds.map((id) => REDIS_KEYS.tripDelay(id));
  const results = await redis.mget<(string | null)[]>(...keys);

  const delays = new Map<string, TripDelay>();
  results.forEach((result, index) => {
    if (result) {
      const delay = JSON.parse(result);
      delays.set(tripIds[index], delay);
    }
  });
  return delays;
}

/**
 * Store cached departures for a stop
 */
export async function setStopDepartures(
  stopId: string,
  departures: CachedDeparture[]
): Promise<void> {
  const redis = getRedis();
  const key = REDIS_KEYS.stopDepartures(stopId);
  await redis.set(key, JSON.stringify(departures), {
    ex: REDIS_TTL.STOP_DEPARTURES,
  });
}

/**
 * Get cached departures for a stop
 */
export async function getStopDepartures(
  stopId: string
): Promise<CachedDeparture[] | null> {
  const redis = getRedis();
  const key = REDIS_KEYS.stopDepartures(stopId);
  const data = await redis.get<string>(key);
  return data ? JSON.parse(data) : null;
}


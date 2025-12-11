/**
 * GTFS-Realtime Service
 *
 * Fetches real-time transit data from Metlink's GTFS-RT API and stores it in Redis.
 * This service is designed to be called by a cron job every 30-60 seconds.
 *
 * Endpoints:
 *   - Trip Updates: delay information for trips
 *   - Vehicle Positions: current location of vehicles
 *   - Service Alerts: disruptions and announcements
 */

import {
  getRedis,
  REDIS_KEYS,
  REDIS_TTL,
  type VehiclePosition,
  type TripDelay,
  type ServiceAlert,
} from "@metlink/db";

// =============================================================================
// CONFIGURATION
// =============================================================================

const GTFS_RT_BASE_URL = "https://api.opendata.metlink.org.nz/v1/gtfs-rt";

const ENDPOINTS = {
  tripUpdates: `${GTFS_RT_BASE_URL}/tripupdates`,
  vehiclePositions: `${GTFS_RT_BASE_URL}/vehiclepositions`,
  serviceAlerts: `${GTFS_RT_BASE_URL}/servicealerts`,
} as const;

// =============================================================================
// GTFS-RT JSON TYPES (Metlink API Response Format)
// =============================================================================

interface GtfsRtHeader {
  gtfsRealtimeVersion: string;
  incrementality: number;
  timestamp: number;
}

interface GtfsRtTrip {
  tripId: string;
  routeId?: string;
  directionId?: number;
  startTime?: string;
  startDate?: string;
  scheduleRelationship?: number;
}

interface GtfsRtStopTimeEvent {
  delay?: number;
  time?: number;
  uncertainty?: number;
}

interface GtfsRtStopTimeUpdate {
  stopSequence?: number;
  stopId?: string;
  arrival?: GtfsRtStopTimeEvent;
  departure?: GtfsRtStopTimeEvent;
  scheduleRelationship?: number;
}

interface GtfsRtTripUpdate {
  trip: GtfsRtTrip;
  vehicle?: { id: string };
  stopTimeUpdate?: GtfsRtStopTimeUpdate[];
  timestamp?: number;
  delay?: number;
}

interface GtfsRtPosition {
  latitude: number;
  longitude: number;
  bearing?: number;
  odometer?: number;
  speed?: number;
}

interface GtfsRtVehicleDescriptor {
  id: string;
  label?: string;
  licensePlate?: string;
}

interface GtfsRtVehiclePosition {
  trip?: GtfsRtTrip;
  vehicle?: GtfsRtVehicleDescriptor;
  position?: GtfsRtPosition;
  currentStopSequence?: number;
  stopId?: string;
  currentStatus?: number;
  timestamp?: number;
  congestionLevel?: number;
  occupancyStatus?: number;
}

interface GtfsRtTranslatedString {
  translation: Array<{ text: string; language?: string }>;
}

interface GtfsRtEntitySelector {
  agencyId?: string;
  routeId?: string;
  routeType?: number;
  trip?: GtfsRtTrip;
  stopId?: string;
}

interface GtfsRtTimeRange {
  start?: number;
  end?: number;
}

interface GtfsRtAlert {
  activePeriod?: GtfsRtTimeRange[];
  informedEntity?: GtfsRtEntitySelector[];
  cause?: number;
  effect?: number;
  url?: GtfsRtTranslatedString;
  headerText?: GtfsRtTranslatedString;
  descriptionText?: GtfsRtTranslatedString;
}

interface GtfsRtEntity {
  id: string;
  isDeleted?: boolean;
  tripUpdate?: GtfsRtTripUpdate;
  vehicle?: GtfsRtVehiclePosition;
  alert?: GtfsRtAlert;
}

interface GtfsRtFeedMessage {
  header: GtfsRtHeader;
  entity: GtfsRtEntity[];
}

// =============================================================================
// CAUSE/EFFECT MAPPING (GTFS-RT enum values to strings)
// =============================================================================

const CAUSE_MAP: Record<number, string> = {
  1: "UNKNOWN_CAUSE",
  2: "OTHER_CAUSE",
  3: "TECHNICAL_PROBLEM",
  4: "STRIKE",
  5: "DEMONSTRATION",
  6: "ACCIDENT",
  7: "HOLIDAY",
  8: "WEATHER",
  9: "MAINTENANCE",
  10: "CONSTRUCTION",
  11: "POLICE_ACTIVITY",
  12: "MEDICAL_EMERGENCY",
};

const EFFECT_MAP: Record<number, string> = {
  1: "NO_SERVICE",
  2: "REDUCED_SERVICE",
  3: "SIGNIFICANT_DELAYS",
  4: "DETOUR",
  5: "ADDITIONAL_SERVICE",
  6: "MODIFIED_SERVICE",
  7: "OTHER_EFFECT",
  8: "UNKNOWN_EFFECT",
  9: "STOP_MOVED",
};

const VEHICLE_STATUS_MAP: Record<number, VehiclePosition["currentStatus"]> = {
  0: "INCOMING_AT",
  1: "STOPPED_AT",
  2: "IN_TRANSIT_TO",
};

// =============================================================================
// FETCH HELPERS
// =============================================================================

function getApiKey(): string {
  const apiKey = process.env.METLINK_API_KEY;
  if (!apiKey) {
    throw new Error("Missing METLINK_API_KEY environment variable");
  }
  return apiKey;
}

async function fetchGtfsRt(endpoint: string): Promise<GtfsRtFeedMessage> {
  const response = await fetch(endpoint, {
    headers: {
      "x-api-key": getApiKey(),
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GTFS-RT fetch failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

// =============================================================================
// PROCESSING FUNCTIONS
// =============================================================================

/**
 * Process trip updates and store delays in Redis
 */
export async function processTripUpdates(): Promise<number> {
  const feed = await fetchGtfsRt(ENDPOINTS.tripUpdates);
  const redis = getRedis();
  const timestamp = Date.now();

  let count = 0;

  for (const entity of feed.entity) {
    if (!entity.tripUpdate?.trip?.tripId) continue;

    const tripUpdate = entity.tripUpdate;
    const tripId = tripUpdate.trip.tripId;

    // Get delay from trip-level delay or first stop time update
    let delaySeconds = tripUpdate.delay ?? 0;

    if (delaySeconds === 0 && tripUpdate.stopTimeUpdate?.length) {
      const firstUpdate = tripUpdate.stopTimeUpdate[0];
      delaySeconds =
        firstUpdate.departure?.delay ?? firstUpdate.arrival?.delay ?? 0;
    }

    const delay: TripDelay = {
      tripId,
      delaySeconds,
      timestamp,
    };

    const key = REDIS_KEYS.tripDelay(tripId);
    await redis.set(key, JSON.stringify(delay), {
      ex: REDIS_TTL.TRIP_DELAY,
    });

    count++;
  }

  return count;
}

/**
 * Process vehicle positions and store in Redis
 */
export async function processVehiclePositions(): Promise<number> {
  const feed = await fetchGtfsRt(ENDPOINTS.vehiclePositions);
  const redis = getRedis();
  const timestamp = Date.now();

  let count = 0;

  for (const entity of feed.entity) {
    if (!entity.vehicle?.vehicle?.id || !entity.vehicle?.position) continue;

    const v = entity.vehicle;
    const vehicleId = v.vehicle.id;

    const position: VehiclePosition = {
      vehicleId,
      tripId: v.trip?.tripId ?? "",
      routeId: v.trip?.routeId ?? "",
      latitude: v.position.latitude,
      longitude: v.position.longitude,
      bearing: v.position.bearing,
      speed: v.position.speed,
      timestamp: v.timestamp ? v.timestamp * 1000 : timestamp,
      currentStopSequence: v.currentStopSequence,
      currentStatus:
        v.currentStatus !== undefined
          ? VEHICLE_STATUS_MAP[v.currentStatus]
          : undefined,
    };

    const key = REDIS_KEYS.vehiclePosition(vehicleId);
    await redis.set(key, JSON.stringify(position), {
      ex: REDIS_TTL.VEHICLE_POSITION,
    });

    count++;
  }

  return count;
}

/**
 * Process service alerts and store in Redis
 */
export async function processServiceAlerts(): Promise<number> {
  const feed = await fetchGtfsRt(ENDPOINTS.serviceAlerts);
  const redis = getRedis();

  let count = 0;
  const alertIds: string[] = [];

  for (const entity of feed.entity) {
    if (!entity.alert) continue;

    const a = entity.alert;
    const alertId = entity.id;

    // Extract affected routes and stops
    const affectedRoutes: string[] = [];
    const affectedStops: string[] = [];

    if (a.informedEntity) {
      for (const ie of a.informedEntity) {
        if (ie.routeId) affectedRoutes.push(ie.routeId);
        if (ie.stopId) affectedStops.push(ie.stopId);
      }
    }

    // Get translated text (prefer English)
    const headerText = getTranslatedText(a.headerText);
    const descriptionText = getTranslatedText(a.descriptionText);

    const alert: ServiceAlert = {
      alertId,
      headerText: headerText || "Service Alert",
      descriptionText: descriptionText || "",
      cause: a.cause !== undefined ? CAUSE_MAP[a.cause] : undefined,
      effect: a.effect !== undefined ? EFFECT_MAP[a.effect] : undefined,
      affectedRoutes: affectedRoutes.length > 0 ? affectedRoutes : undefined,
      affectedStops: affectedStops.length > 0 ? affectedStops : undefined,
      activePeriodStart: a.activePeriod?.[0]?.start,
      activePeriodEnd: a.activePeriod?.[0]?.end,
    };

    const key = REDIS_KEYS.serviceAlert(alertId);
    await redis.set(key, JSON.stringify(alert), {
      ex: REDIS_TTL.SERVICE_ALERT,
    });

    alertIds.push(alertId);
    count++;
  }

  // Update the active alerts list
  await redis.set(REDIS_KEYS.activeAlerts, JSON.stringify(alertIds), {
    ex: REDIS_TTL.SERVICE_ALERT,
  });

  return count;
}

function getTranslatedText(
  translatedString?: GtfsRtTranslatedString
): string | undefined {
  if (!translatedString?.translation?.length) return undefined;

  // Prefer English translation
  const english = translatedString.translation.find(
    (t) => t.language === "en" || t.language === "EN"
  );
  if (english) return english.text;

  // Fall back to first translation
  return translatedString.translation[0]?.text;
}

// =============================================================================
// MAIN SYNC FUNCTION
// =============================================================================

export interface SyncResult {
  success: boolean;
  tripUpdates: number;
  vehiclePositions: number;
  serviceAlerts: number;
  errors: string[];
  duration: number;
}

/**
 * Sync all GTFS-RT feeds to Redis
 * Each feed type is processed independently - failures in one don't block others
 */
export async function syncGtfsRealtime(): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let tripUpdates = 0;
  let vehiclePositions = 0;
  let serviceAlerts = 0;

  // Process each feed type independently
  try {
    tripUpdates = await processTripUpdates();
  } catch (error) {
    errors.push(`Trip updates: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    vehiclePositions = await processVehiclePositions();
  } catch (error) {
    errors.push(`Vehicle positions: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    serviceAlerts = await processServiceAlerts();
  } catch (error) {
    errors.push(`Service alerts: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    success: errors.length === 0,
    tripUpdates,
    vehiclePositions,
    serviceAlerts,
    errors,
    duration: Date.now() - startTime,
  };
}

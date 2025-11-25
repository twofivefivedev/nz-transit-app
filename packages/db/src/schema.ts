import {
  pgTable,
  varchar,
  text,
  integer,
  decimal,
  date,
  time,
  boolean,
  timestamp,
  uuid,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// =============================================================================
// GTFS STATIC TABLES (Public Transit Data)
// =============================================================================

/**
 * Agency - Transit agencies providing data
 */
export const agency = pgTable("agency", {
  agencyId: varchar("agency_id", { length: 255 }).primaryKey(),
  agencyName: varchar("agency_name", { length: 255 }).notNull(),
  agencyUrl: varchar("agency_url", { length: 255 }).notNull(),
  agencyTimezone: varchar("agency_timezone", { length: 100 }).notNull(),
  agencyLang: varchar("agency_lang", { length: 10 }),
  agencyPhone: varchar("agency_phone", { length: 50 }),
});

/**
 * Stops - Physical stop locations
 * Note: location column should use PostGIS geography type
 * ALTER TABLE stops ADD COLUMN location geography(Point, 4326);
 * CREATE INDEX stops_location_idx ON stops USING GIST (location);
 */
export const stops = pgTable(
  "stops",
  {
    stopId: varchar("stop_id", { length: 255 }).primaryKey(),
    stopCode: varchar("stop_code", { length: 50 }),
    stopName: varchar("stop_name", { length: 255 }).notNull(),
    stopDesc: text("stop_desc"),
    stopLat: decimal("stop_lat", { precision: 10, scale: 6 }).notNull(),
    stopLon: decimal("stop_lon", { precision: 10, scale: 6 }).notNull(),
    zoneId: varchar("zone_id", { length: 100 }),
    stopUrl: varchar("stop_url", { length: 255 }),
    locationType: integer("location_type").default(0),
    parentStation: varchar("parent_station", { length: 255 }),
    platformCode: varchar("platform_code", { length: 50 }),
  },
  (table) => ({
    latIdx: index("stops_lat_idx").on(table.stopLat),
    lonIdx: index("stops_lon_idx").on(table.stopLon),
  })
);

/**
 * Routes - Transit routes (train lines, bus routes)
 */
export const routes = pgTable("routes", {
  routeId: varchar("route_id", { length: 255 }).primaryKey(),
  agencyId: varchar("agency_id", { length: 255 }).references(
    () => agency.agencyId
  ),
  routeShortName: varchar("route_short_name", { length: 50 }),
  routeLongName: varchar("route_long_name", { length: 255 }),
  routeDesc: text("route_desc"),
  routeType: integer("route_type").notNull(), // 0=Tram, 1=Subway, 2=Rail, 3=Bus
  routeUrl: varchar("route_url", { length: 255 }),
  routeColor: varchar("route_color", { length: 6 }),
  routeTextColor: varchar("route_text_color", { length: 6 }),
});

/**
 * Calendar - Service schedules
 */
export const calendar = pgTable("calendar", {
  serviceId: varchar("service_id", { length: 255 }).primaryKey(),
  monday: boolean("monday").notNull(),
  tuesday: boolean("tuesday").notNull(),
  wednesday: boolean("wednesday").notNull(),
  thursday: boolean("thursday").notNull(),
  friday: boolean("friday").notNull(),
  saturday: boolean("saturday").notNull(),
  sunday: boolean("sunday").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
});

/**
 * Calendar Dates - Exceptions to regular service
 */
export const calendarDates = pgTable(
  "calendar_dates",
  {
    serviceId: varchar("service_id", { length: 255 }).notNull(),
    date: date("date").notNull(),
    exceptionType: integer("exception_type").notNull(), // 1=added, 2=removed
  },
  (table) => ({
    pk: primaryKey({ columns: [table.serviceId, table.date] }),
  })
);

/**
 * Trips - Individual trips on a route
 */
export const trips = pgTable(
  "trips",
  {
    tripId: varchar("trip_id", { length: 255 }).primaryKey(),
    routeId: varchar("route_id", { length: 255 })
      .notNull()
      .references(() => routes.routeId),
    serviceId: varchar("service_id", { length: 255 })
      .notNull()
      .references(() => calendar.serviceId),
    tripHeadsign: varchar("trip_headsign", { length: 255 }),
    tripShortName: varchar("trip_short_name", { length: 100 }),
    directionId: integer("direction_id"),
    blockId: varchar("block_id", { length: 255 }),
    shapeId: varchar("shape_id", { length: 255 }),
  },
  (table) => ({
    routeIdx: index("trips_route_idx").on(table.routeId),
    serviceIdx: index("trips_service_idx").on(table.serviceId),
  })
);

/**
 * Stop Times - Arrival/departure times at stops
 * IMPORTANT: Always query with time range and limit!
 */
export const stopTimes = pgTable(
  "stop_times",
  {
    tripId: varchar("trip_id", { length: 255 })
      .notNull()
      .references(() => trips.tripId),
    arrivalTime: integer("arrival_time").notNull(), // Stored as seconds from midnight (can exceed 86400)
    departureTime: integer("departure_time").notNull(),
    stopId: varchar("stop_id", { length: 255 })
      .notNull()
      .references(() => stops.stopId),
    stopSequence: integer("stop_sequence").notNull(),
    stopHeadsign: varchar("stop_headsign", { length: 255 }),
    pickupType: integer("pickup_type").default(0),
    dropOffType: integer("drop_off_type").default(0),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.tripId, table.stopSequence] }),
    stopIdx: index("stop_times_stop_idx").on(table.stopId),
    departureIdx: index("stop_times_departure_idx").on(table.departureTime),
    stopDepartureIdx: index("stop_times_stop_departure_idx").on(
      table.stopId,
      table.departureTime
    ),
  })
);

// =============================================================================
// USER DATA TABLES (Private, RLS Protected)
// =============================================================================

/**
 * User Profiles - Linked to Supabase Auth
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // References auth.users.id
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Saved Stops - User's favorite stops
 */
export const savedStops = pgTable(
  "saved_stops",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    stopId: varchar("stop_id", { length: 255 })
      .notNull()
      .references(() => stops.stopId),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    nickname: varchar("nickname", { length: 100 }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.stopId] }),
  })
);

/**
 * Saved Routes - User's favorite routes
 */
export const savedRoutes = pgTable(
  "saved_routes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    routeId: varchar("route_id", { length: 255 })
      .notNull()
      .references(() => routes.routeId),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.routeId] }),
  })
);

// =============================================================================
// RELATIONS
// =============================================================================

export const routesRelations = relations(routes, ({ one, many }) => ({
  agency: one(agency, {
    fields: [routes.agencyId],
    references: [agency.agencyId],
  }),
  trips: many(trips),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  route: one(routes, {
    fields: [trips.routeId],
    references: [routes.routeId],
  }),
  stopTimes: many(stopTimes),
}));

export const stopTimesRelations = relations(stopTimes, ({ one }) => ({
  trip: one(trips, {
    fields: [stopTimes.tripId],
    references: [trips.tripId],
  }),
  stop: one(stops, {
    fields: [stopTimes.stopId],
    references: [stops.stopId],
  }),
}));

export const profilesRelations = relations(profiles, ({ many }) => ({
  savedStops: many(savedStops),
  savedRoutes: many(savedRoutes),
}));

export const savedStopsRelations = relations(savedStops, ({ one }) => ({
  user: one(profiles, {
    fields: [savedStops.userId],
    references: [profiles.id],
  }),
  stop: one(stops, {
    fields: [savedStops.stopId],
    references: [stops.stopId],
  }),
}));

export const savedRoutesRelations = relations(savedRoutes, ({ one }) => ({
  user: one(profiles, {
    fields: [savedRoutes.userId],
    references: [profiles.id],
  }),
  route: one(routes, {
    fields: [savedRoutes.routeId],
    references: [routes.routeId],
  }),
}));



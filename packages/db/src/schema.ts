import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// GTFS Schema (Public Data) - will be expanded later
// Example: stops table with PostGIS geography column
export const stops = pgTable("stops", {
  stopId: text("stop_id").primaryKey(),
  // Additional fields will be added when implementing GTFS ingestion
});

// User Schema (Private Data)
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const savedStops = pgTable("saved_stops", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id),
  stopId: text("stop_id").notNull().references(() => stops.stopId),
});

export const savedRoutes = pgTable("saved_routes", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id),
  routeId: text("route_id").notNull(),
});

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  savedStops: many(savedStops),
  savedRoutes: many(savedRoutes),
}));



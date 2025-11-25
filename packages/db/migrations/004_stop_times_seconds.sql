-- =============================================================================
-- Migration 004: Store stop_times as integer seconds
-- =============================================================================
-- Converts arrival_time/departure_time columns to INTEGER so that we can store
-- GTFS times that exceed 24:00:00 (e.g. "24:08:00" for next-day service).
-- Run in Supabase SQL editor after pushing the updated Drizzle schema.
-- =============================================================================

ALTER TABLE stop_times
  ALTER COLUMN arrival_time TYPE integer USING (EXTRACT(EPOCH FROM arrival_time)::integer),
  ALTER COLUMN departure_time TYPE integer USING (EXTRACT(EPOCH FROM departure_time)::integer);


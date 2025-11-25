-- =============================================================================
-- Migration 002: Add Geography Column to Stops Table
-- =============================================================================
-- This migration adds a PostGIS geography column to the stops table and
-- creates a GIST spatial index for efficient nearby queries.
--
-- IMPORTANT: Run this AFTER the stops table has been created via Drizzle push
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================================

-- Add the geography column for spatial queries
-- Using SRID 4326 (WGS84) which is standard for GPS coordinates
ALTER TABLE stops 
ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- Populate the location column from existing lat/lon data
UPDATE stops 
SET location = ST_SetSRID(ST_MakePoint(stop_lon::float, stop_lat::float), 4326)::geography
WHERE location IS NULL AND stop_lat IS NOT NULL AND stop_lon IS NOT NULL;

-- Create GIST spatial index for fast nearby queries
CREATE INDEX IF NOT EXISTS stops_location_gist_idx 
ON stops USING GIST (location);

-- Create a trigger to auto-populate location on insert/update
CREATE OR REPLACE FUNCTION update_stop_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stop_lat IS NOT NULL AND NEW.stop_lon IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.stop_lon::float, NEW.stop_lat::float), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stop_location ON stops;
CREATE TRIGGER trigger_update_stop_location
BEFORE INSERT OR UPDATE ON stops
FOR EACH ROW
EXECUTE FUNCTION update_stop_location();

-- =============================================================================
-- Example Query: Find stops within 500m of a location
-- =============================================================================
-- SELECT stop_id, stop_name, 
--        ST_Distance(location, ST_SetSRID(ST_MakePoint(174.7762, -41.2865), 4326)::geography) as distance_meters
-- FROM stops
-- WHERE ST_DWithin(
--   location, 
--   ST_SetSRID(ST_MakePoint(174.7762, -41.2865), 4326)::geography, 
--   500
-- )
-- ORDER BY distance_meters;


-- =============================================================================
-- Migration 001: Enable PostGIS Extension
-- =============================================================================
-- This migration enables the PostGIS extension for geographic queries.
-- PostGIS provides support for geographic objects allowing location queries
-- to be run in SQL.
--
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Verify PostGIS is enabled
SELECT PostGIS_Version();


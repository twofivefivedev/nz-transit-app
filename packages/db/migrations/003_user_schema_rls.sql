-- =============================================================================
-- Migration 003: User Schema with Row Level Security (RLS)
-- =============================================================================
-- This migration sets up RLS policies for user data tables to ensure
-- users can only access their own data.
--
-- IMPORTANT: Run this AFTER tables have been created via Drizzle push
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================================

-- =============================================================================
-- PROFILES TABLE RLS
-- =============================================================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile (via trigger on auth.users)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- SAVED_STOPS TABLE RLS
-- =============================================================================

-- Enable RLS on saved_stops table
ALTER TABLE saved_stops ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own saved stops
CREATE POLICY "Users can view own saved stops" ON saved_stops
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own saved stops
CREATE POLICY "Users can insert own saved stops" ON saved_stops
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own saved stops
CREATE POLICY "Users can update own saved stops" ON saved_stops
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own saved stops
CREATE POLICY "Users can delete own saved stops" ON saved_stops
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- SAVED_ROUTES TABLE RLS
-- =============================================================================

-- Enable RLS on saved_routes table
ALTER TABLE saved_routes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own saved routes
CREATE POLICY "Users can view own saved routes" ON saved_routes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own saved routes
CREATE POLICY "Users can insert own saved routes" ON saved_routes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own saved routes
CREATE POLICY "Users can update own saved routes" ON saved_routes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own saved routes
CREATE POLICY "Users can delete own saved routes" ON saved_routes
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- =============================================================================

-- Function to create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- =============================================================================

-- Grant usage on public schema to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant select on GTFS tables (public data) to authenticated and anon users
GRANT SELECT ON agency TO authenticated, anon;
GRANT SELECT ON stops TO authenticated, anon;
GRANT SELECT ON routes TO authenticated, anon;
GRANT SELECT ON calendar TO authenticated, anon;
GRANT SELECT ON calendar_dates TO authenticated, anon;
GRANT SELECT ON trips TO authenticated, anon;
GRANT SELECT ON stop_times TO authenticated, anon;

-- Grant all on user tables to authenticated users (RLS will filter)
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON saved_stops TO authenticated;
GRANT ALL ON saved_routes TO authenticated;


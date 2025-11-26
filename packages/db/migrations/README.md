# Database Migrations

This directory contains SQL migrations for Supabase that need to be run manually in the SQL Editor.

## Migration Order

Run these migrations in order after deploying the Drizzle schema:

### 1. `001_enable_postgis.sql`
Enables the PostGIS extension for geographic queries.

**Prerequisites:** None

### 2. `002_add_stops_geography.sql`
Adds a geography column to the `stops` table with a GIST spatial index.

**Prerequisites:**
- PostGIS extension enabled (001)
- `stops` table created via `npm run db:push`

**Features:**
- Adds `location` column (geography type)
- Creates GIST index for fast spatial queries
- Auto-populates location from lat/lon on insert/update

### 3. `003_user_schema_rls.sql`
Sets up Row Level Security (RLS) policies for user data.

**Prerequisites:**
- User tables created via `npm run db:push` (profiles, saved_stops, saved_routes)

**Features:**
- Enables RLS on profiles, saved_stops, saved_routes
- Users can only read/write their own data
- Auto-creates profile on user signup (via trigger)
- Grants appropriate permissions to authenticated/anon roles

## How to Run

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Paste the contents of each migration file
4. Click **Run**
5. Verify success in the output

## Environment Variables

After setup, ensure these are configured:

```bash
# Supabase (Postgres)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Upstash Redis (for real-time data)
UPSTASH_REDIS_REST_URL=https://[your-redis].upstash.io
UPSTASH_REDIS_REST_TOKEN=[your-token]
```

## Useful Queries

### Find stops near a location (500m radius)
```sql
SELECT stop_id, stop_name, 
       ST_Distance(location, ST_SetSRID(ST_MakePoint(174.7762, -41.2865), 4326)::geography) as distance_meters
FROM stops
WHERE ST_DWithin(
  location, 
  ST_SetSRID(ST_MakePoint(174.7762, -41.2865), 4326)::geography, 
  500
)
ORDER BY distance_meters;
```

### Check RLS is enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'saved_stops', 'saved_routes');
```





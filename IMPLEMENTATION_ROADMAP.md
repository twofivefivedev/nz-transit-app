# Implementation Roadmap: Metlink vNext

## Phase 1: The Monorepo & Data Foundation (Weeks 1-2)

**Focus:** Setting up the workspace, the GTFS engine, and the User Database schema.

### 1.1 Workspace Setup

- [x] Initialize TurboRepo workspace.
- [x] Create `apps/web` (Next.js 14 App Router).
- [x] Create `apps/mobile` (Expo SDK 52+).
- [x] Create `packages/ui` (Shared UI Logic).
- [x] Create `packages/api` (tRPC router, Zod schemas, DB client).
- [x] Create `packages/db` (Drizzle ORM definitions).
- [x] Vercel Configuration: Create `vercel.json` to manage monorepo build settings (ignore mobile changes).

### 1.2 Database Infrastructure (Supabase)

- [x] Enable PostGIS extension.
- [x] Define GTFS Schema (Public Data):
  - `agency`, `stops` (geography), `routes`, `trips`, `stop_times`, `calendar`.
  - Index: `CREATE INDEX ON stops USING GIST (location);`.
- [x] Define User Schema (Private Data):
  - `profiles`: Linked to `auth.users` (UUID, created_at).
  - `saved_stops`: FK to `profiles.id` and `stops.stop_id`.
  - `saved_routes`: FK to `profiles.id` and `routes.route_id`.
  - RLS Policies: Enable Row Level Security so users can only select/insert their own rows.
- [x] Setup Redis (Upstash) for hot state (vehicle positions).

### 1.3 GTFS Static Ingestor

- [x] Build Node.js script (`scripts/ingest-static.ts`) using `csv-parser`.
- [x] Implement bulk upsert strategy (batches of 5000) for `stop_times`.
- [x] Verify we can query "Bus stops near me" via SQL.

## Phase 2: The "Sketchpad" Design System (Weeks 3-4)

**Focus:** Porting the specific aesthetic to a shared library compatible with Web and Mobile.

### 2.1 Styling Infrastructure

- [x] Install NativeWind (v4) in `packages/ui`.
- [x] Define Design Tokens in `tailwind.config.js`:
  - Border: 2px.
  - Colors: black, white, zinc-100.
  - Typography: Geist Mono (Web) / Platform Monospace (Mobile).

### 2.2 Core Components (Dumb UI)

- [x] `<Card />`: `border-2 border-black bg-white shadow-sharp`.
- [x] `<Button />`: Hard edges, uppercase text.
- [x] `<StatusBadge />`: Inverted colors for status.
- [x] `<DepartureRow />`: Grid layout for schedule times.
- [x] `<DepartureTable />`: Full departure schedule with header row.
- [x] `<FilterSelect />`: Dropdown-style selector with label/value.
- [x] `<IconButton />`: Icon-only button with accessibility label.
- [x] `<CountdownHero />`: Inverted hero block for countdown display.
- [x] `<SectionHeader />`: Title section with subtitle and timestamp.
- [x] `<FavoritesBar />`: Favorites toolbar with Add/Manage buttons.

## Phase 3: The Real-Time Engine & User API (Weeks 5-6)

**Focus:** Ingesting live data and building the API layer for both Public and User data.

### 3.1 GTFS-Realtime Worker

- [x] Create lightweight worker (Cloudflare/Vercel Cron).
- [x] Fetch Metlink GTFS-R.
- [x] Write Strategy: Store delay/status in Redis (TTL: 60s).

### 3.2 The API Layer (tRPC)

- [x] Public Routers:
  - `trpc.stops.getNearby({ lat, lon })`.
  - `trpc.departures.getForStop({ stopId })`: Merges Postgres Schedule + Redis Live Data.
- [ ] User Routers (Protected):
  - `trpc.user.getFavorites()`: Selects from `saved_stops` joined with `stops`.
  - `trpc.user.toggleFavorite({ stopId })`: Upsert/Delete on `saved_stops`.

### 3.3 Real-time Push

- [x] Implement SSE Endpoint (Web) / WebSocket (Mobile fallback).
- [x] Logic: Publish Redis updates to channel `stop:{id}`.

## Phase 4: App Assembly & Auth Integration (Weeks 7-8)

**Focus:** Wiring data to the UI and handling User Sessions.

### 4.1 Authentication Setup

- [ ] Supabase Auth: Configure Email/Password and potentially Anonymous Sign-ins (for "try before you buy").
- [ ] Auth Context: Create a shared `useAuth` hook in `packages/ui` that works on Web and Mobile.

### 4.2 Web App (`apps/web`)

- [ ] Landing Page: Hero section + Location prompt.
- [ ] Stop Detail: Uses `packages/ui/DepartureBoard`.
- [ ] Favorites Page: Server Component fetching from `trpc.user.getFavorites` (Redirect to login if unauthenticated).

### 4.3 Mobile App (`apps/mobile`)

- [ ] Setup Expo Router.
- [ ] Screens: `(tabs)/index.tsx`, `stop/[id].tsx`.
- [ ] Favorites Tab: Requires Auth check. If logged out, show "Sign in to sync favorites" CTA.

## Phase 5: Polish & Production (Week 9)

**Focus:** Reliability.

### 5.1 Caching

- [ ] Configure stale-while-revalidate for static data.

### 5.2 CI/CD

- [ ] Github Action: Run GTFS Static Ingest daily.
- [ ] Github Action: Deploy Web to Vercel & Build Mobile via EAS.

## Milestone Checklist for Launch

- [ ] Aesthetic: Sketchpad theme maintained?
- [ ] Data: Trains AND Buses visible?
- [ ] Speed: Live updates < 5s latency?
- [ ] Persistence: Do favorites persist across browser refreshes (via DB)?

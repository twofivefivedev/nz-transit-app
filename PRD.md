# Product Requirements Document (PRD): Metlink vNext

## 1. Executive Summary

We are rebuilding the Metlink Train Schedule into a scalable, multi-modal transit platform. The current architecture (hardcoded constants, client-side polling) cannot support the complexity of the bus network. The new system will use a GTFS-driven architecture to support Trains and Buses immediately, providing sub-second real-time updates via Server-Sent Events (SSE), while maintaining the distinctive "Sketchpad" design language across both Web and Mobile.

## 2. Problem Statement

- **Scalability:** Hardcoded station lists prevent adding Bus routes (3000+ stops vs 50 train stations).
- **Latency:** Users wait up to 2 minutes to see delays due to polling intervals.
- **Platform:** Logic is trapped in Next.js and cannot be shared with a native mobile app.
- **Experience:** Users need to know "What is leaving near me right now?", not just "What is leaving Wellington Station?".

## 3. Objectives & Key Results (OKRs)

### Objective: Support Multi-modal Transit (Bus + Train)

- **KR:** Successfully ingest Metlink GTFS (Static) and GTFS-RT (Realtime) feeds.
- **KR:** Query stops using geospatial searches (PostGIS) < 50ms.

### Objective: Real-time Performance

- **KR:** Reduce data staleness from ~120s to <5s.
- **KR:** Implement push-based updates (SSE) for live departure boards.

### Objective: Mobile Readiness & Consistency

- **KR:** Achieve 90% code sharing between Web and Mobile via Monorepo.
- **KR:** Strictly maintain the "Sketchpad/Wireframe" aesthetic on both platforms.

## 4. Functional Requirements

### 4.1 Data Layer (The Core)

- **FR-01:** System must ingest standard GTFS Static zip files to populate stops, routes, trips, and calendars into PostGIS.
- **FR-02:** System must ingest GTFS-Realtime (Protocol Buffers) feeds every 30s.
- **FR-03:** Real-time prediction offsets must be stored in ephemeral storage (Redis) to prevent database bloat.

### 4.2 API Layer (tRPC)

- **FR-04:** `getNearbyStops({ lat, lon, radius })`: Return stops sorted by distance.
- **FR-05:** `getDepartures({ stopId })`: Return unified list of Train and Bus departures.
- **FR-06:** `subscribeToStop({ stopId })`: Open a persistent connection for live status updates.

### 4.3 User Interface (Web & Mobile)

- **FR-07:** Visual Language: The UI must retain the neo-brutalist "Sketchpad" look (2px black borders, uppercase type, sharp edges, monochrome base).
- **FR-08:** Stop Selector: Geolocation-based list of nearest stops + text search.
- **FR-09:** Departure Board: Unified view of upcoming departures with live countdowns.
- **FR-10:** Offline Mode: Render scheduled times if network is unreachable, with a distinct visual indicator.

## 5. Non-Functional Requirements

- **Performance:** API response time < 100ms (p95).
- **Scalability:** Handle 3000+ concurrent users (approx. 1 full train capacity).
- **Freshness:** Real-time data reflected on client < 5s from ingestion.
- **Accessibility:** WCAG 2.1 AA Compliance (High contrast is native to the design, but ARIA labels are critical).

## 6. Technical Constraints

- **Data Source:** Metlink Open Data API (GTFS/GTFS-R).
- **Infrastructure:** Supabase (Postgres + PostGIS), Upstash (Redis).
- **Framework:** TurboRepo (Monorepo), Next.js (Web), Expo (Mobile).
- **Styling:** NativeWind (Tailwind for React Native) to share the specific design tokens.

## 7. Current Status

**Phase 1.1 - Workspace Setup: ✅ Complete**

- TurboRepo monorepo initialized and configured
- Next.js 14 web app (`apps/web`) with App Router, TypeScript, and Tailwind CSS
- Expo SDK 50+ mobile app (`apps/mobile`) with Expo Router, TypeScript, and NativeWind v4
- Shared UI package (`packages/ui`) configured with NativeWind/Tailwind
- tRPC API package (`packages/api`) with basic router structure
- Database package (`packages/db`) with Drizzle ORM and initial schema
- Vercel configuration for monorepo deployment (ignores mobile changes)
- Development servers running successfully (web: localhost:3000, mobile: localhost:8081)

**Next Steps:** Phase 1.2 - Database Infrastructure (Supabase setup)

## 8. Future Scope (Post-MVP)

- Journey Planner (A to B routing).
- Live Map View (Vehicle icons moving on map).
- Push Notifications for favorite routes.

# Metlink vNext

Real-time multi-modal transit platform for Wellington, New Zealand.

## Tech Stack

- **Monorepo**: TurboRepo
- **Web**: Next.js 14 (App Router)
- **Mobile**: Expo SDK 52 (Expo Router)
- **UI**: NativeWind v4 (Tailwind for Native)
- **Backend**: tRPC + Drizzle ORM
- **Database**: Supabase (Postgres + PostGIS) + Upstash (Redis)

## Project Structure

```
metlink-vnext/
├── apps/
│   ├── web/          # Next.js web application
│   └── mobile/       # Expo mobile application
├── packages/
│   ├── ui/           # Shared UI components (NativeWind)
│   ├── api/          # tRPC router and shared types
│   └── db/           # Drizzle ORM schema definitions
└── vercel.json       # Vercel deployment config
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
# Install dependencies
npm install

# Start development servers
npm run dev
```

### Development

```bash
# Run web app only
npm run dev --filter=@metlink/web

# Run mobile app only
npm run dev --filter=@metlink/mobile

# Build all packages
npm run build

# Lint all packages
npm run lint
```

### Database

```bash
# Generate migrations
npm run db:generate

# Push schema to database
npm run db:push
```

## Environment Variables

Create `.env` files in the appropriate directories:

### Root `.env`

```env
# Database
DATABASE_URL=postgresql://...

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Metlink API (for GTFS-RT real-time data)
METLINK_API_KEY=your-api-key-from-opendata.metlink.org.nz
```

### `apps/web/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Vercel Cron Authentication (set in Vercel dashboard)
CRON_SECRET=your-random-secret-for-cron-auth
```

## Design System ("Sketchpad")

The UI follows a neo-brutalist "Sketchpad" aesthetic:

- **Colors**: Strict monochrome (Black #000, White #FFF, Zinc-100 #F4F4F5)
- **Status Colors**: Yellow-400 (Delay), Red-500 (Cancel), Green-500 (On Time)
- **Borders**: All containers have `border-2 border-black`
- **Shadows**: Hard shadows only (`shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`)
- **Typography**: Uppercase headers, monospace fonts
- **Corners**: Minimal rounding (`rounded-sm` or `rounded-none`)

## Real-Time Engine

The real-time engine fetches GTFS-RT data from Metlink's API and stores it in Redis:

- **Endpoint**: `/api/cron/gtfs-realtime`
- **Schedule**: Every minute (Vercel Cron)
- **Data Types**:
  - Trip Updates (delays)
  - Vehicle Positions
  - Service Alerts
- **TTL**: 60 seconds for positions/delays, 5 minutes for alerts

To get a Metlink API key, register at [opendata.metlink.org.nz](https://opendata.metlink.org.nz).

## Deployment

The project is configured for Vercel deployment with:

- Root directory set to `apps/web`
- Ignores mobile-only changes
- Builds trigger on changes to `apps/web` or `packages/*`
- Cron job for real-time data sync (requires Pro plan for < 1 minute intervals)

## License

MIT

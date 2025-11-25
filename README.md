# Metlink vNext

A scalable, multi-modal transit platform for Wellington, NZ built with TurboRepo, Next.js, and Expo.

## Architecture

This is a TurboRepo monorepo containing:

- **apps/web** - Next.js 14 web application (App Router)
- **apps/mobile** - Expo SDK 50+ mobile application
- **packages/ui** - Shared UI components (NativeWind/Tailwind)
- **packages/api** - tRPC router and shared types
- **packages/db** - Drizzle ORM schema definitions

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+

### Installation

```bash
npm install
```

### Development

Run all apps in development mode:

```bash
npm run dev
```

Run specific apps:

```bash
# Web app
cd apps/web && npm run dev

# Mobile app
cd apps/mobile && npm run dev
```

### Building

Build all packages and apps:

```bash
npm run build
```

## Project Structure

```
.
├── apps/
│   ├── web/          # Next.js 14 web app
│   └── mobile/       # Expo mobile app
├── packages/
│   ├── ui/           # Shared UI components
│   ├── api/          # tRPC API layer
│   └── db/           # Database schema (Drizzle ORM)
├── turbo.json        # TurboRepo configuration
└── vercel.json       # Vercel deployment configuration
```

## Documentation

- [PRD.md](./PRD.md) - Product Requirements Document
- [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - Implementation roadmap

## License

Private


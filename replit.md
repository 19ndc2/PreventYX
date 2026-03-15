# CancerGuard — Cancer Prevention Platform for Canadians

## Overview

CancerGuard is an AI-powered cancer prevention platform built for Canadians. It provides personalized risk assessments, cancer type education, preventative care pathways, an AI advisor chat interface (Flowise backend), and a health tracker.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite, Tailwind CSS, React Query, Wouter, Recharts, Framer Motion
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080, proxied at /api)
│   └── cancer-guard/       # React + Vite frontend (port 20104, at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
│   └── src/
│       ├── hello.ts
│       └── seed-cancer-data.ts    # Seeds cancer types & pathways
└── ...
```

## Database Schema

- **cancer_types** — 8 cancer types seeded (Lung, Colorectal, Breast, Prostate, Skin, Cervical, Bladder, Thyroid)
- **prevention_pathways** — 10 pathways by cancer type and risk level
- **risk_assessments** — User risk assessment submissions with computed risk scores
- **health_logs** — User health tracking entries (symptoms, appointments, screenings, etc.)

## API Endpoints

- `GET /api/cancer-types` — List all cancer types
- `GET /api/cancer-types/:id` — Get single cancer type
- `GET /api/prevention-pathways?cancerTypeId=&riskLevel=` — List prevention pathways
- `POST /api/risk-assessments` — Submit risk assessment (computes risk scores internally)
- `GET /api/risk-assessments?sessionId=` — List risk assessments for a session
- `POST /api/chat` — AI chat proxy (routes to Flowise if FLOWISE_API_URL is set)
- `POST /api/health-logs` — Create health log entry
- `GET /api/health-logs?sessionId=&logType=` — List health log entries

## Flowise Integration

The `/api/chat` route proxies to a Flowise AI backend. Set these environment variables:

- `FLOWISE_API_URL` — The Flowise chatflow endpoint URL (e.g. `https://yourflowise.com/api/v1/prediction/YOUR-FLOW-ID`)
- `FLOWISE_API_KEY` — Optional API key for the Flowise instance

If `FLOWISE_API_URL` is not set, the chat falls back to a built-in response system based on Canadian cancer guidelines.

## User Identity

Users are identified by a `sessionId` (UUID v4) stored in `localStorage` under the key `cg-session-id`. No login is required.

## Frontend Pages

1. **Home** (`/`) — Landing page with hero, stats, and CTA
2. **Risk Assessment** (`/risk-assessment`) — 4-step form wizard with computed results
3. **Cancer Library** (`/cancer-types`) — Searchable cancer type cards
4. **Care Pathways** (`/pathways`) — Prevention pathways filterable by type/risk level
5. **AI Advisor** (`/chat`) — Full-screen AI chat interface
6. **Health Tracker** (`/health-tracker`) — Log health events timeline
7. **Dashboard** (`/dashboard`) — Summary of risk profile, upcoming screenings, recent logs

## Seeding Data

```bash
pnpm --filter @workspace/scripts run seed-cancer-data
```

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build`
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` for libs, then artifact typechecks
- `pnpm --filter @workspace/api-spec run codegen` — regenerates React Query hooks and Zod schemas

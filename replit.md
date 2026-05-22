# MarketVerse AI

An AI-powered stock market learning platform that teaches investing through simulations, psychology challenges, historical crash scenarios, AI mentoring, and gamified decision-making — cinematic dark futuristic aesthetic.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied to /api)
- `pnpm --filter @workspace/marketverse run dev` — run the frontend (React+Vite)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — build composite lib declarations (run before api-server typecheck)
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `GEMINI_API_KEY` — Google Gemini API key (direct, not Replit AI integration)
- Required env: `SESSION_SECRET` — Express session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter routing + Framer Motion + Recharts + TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: Google Gemini 2.5 Flash via `@google/genai` SDK (GEMINI_API_KEY)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/marketverse/` — React+Vite frontend
- `artifacts/api-server/` — Express backend
- `lib/db/src/schema/` — Drizzle ORM table definitions (source of truth for DB)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — Auto-generated React Query hooks + Zod schemas
- `lib/integrations-gemini-ai/` — Gemini AI client wrapper

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks + Zod validators
- SSE streaming for AI mentor chat: raw `fetch` on client (not generated hooks) → token-by-token rendering
- `@google/*` packages are externalized in esbuild config (not bundled, resolved at runtime)
- Route ordering: `/simulations/summary` must appear before `/simulations/:id` in Express
- Gemini image client (`lib/integrations-gemini-ai/src/image/client.ts`) falls back to `GEMINI_API_KEY` if Replit AI integration env vars aren't present

## Product

- **Landing** — cinematic hero with feature cards
- **Universe** — command center: investor scores, psychology summary, quick navigation
- **Simulator** — configure risk/time horizon via sliders, Recharts projection chart
- **Psychology Engine** — biometric heartbeat animation, emotional event tracker, behavioral bias analysis
- **AI Mentor** — streaming Gemini chat, persistent conversation history
- **Historical Scenarios** — 4 seeded crashes (2008, COVID, Dot-Com, Harshad Mehta 1992) with Recharts timelines
- **Challenges Arena** — 5 gamified decision challenges with AI feedback + scoring
- **Portfolio** — pie charts, holdings table, performance metrics

## User preferences

- Dark futuristic aesthetic with neon accents (electric blue, emerald green, amber)
- Indian market context (₹ currency, Nifty, Harshad Mehta scenario)
- Gemini API key provided directly by user (not via Replit AI Integrations)

## Gotchas

- Always run `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck`
- DB schema tables: `conversations`, `messages`, `simulationsTable`, `psychologyEventsTable`, `scenariosTable`, `portfolioTable`, `challengesTable`
- `@google/genai` must be in api-server `dependencies` (not just integrations-gemini-ai lib) since it's externalized in esbuild

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

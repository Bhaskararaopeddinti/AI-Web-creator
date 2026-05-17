# Smart Campus GatePass System

A production-grade full-stack SaaS web app for colleges and hostels to digitally manage student outgoing/incoming records with real-time tracking, QR gate passes, role-based dashboards, analytics, and AI security insights.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, shadcn/ui components, Recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (stored in localStorage as `gatepass_token`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — DB schema files (users, hostels, departments, gate-passes, gate-logs, notifications)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — generated hooks and Zod schemas (do not edit manually)
- `lib/api-zod/` — Zod validators for server-side request validation
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware (requireAuth, requireRole, signToken)
- `artifacts/gatepass/src/pages/` — all React pages organized by role (student/, warden/, security/, admin/)
- `artifacts/gatepass/src/components/layout.tsx` — shared sidebar navigation layout

## Architecture decisions

- JWT stored in localStorage; custom-fetch.ts auto-injects as Bearer token on every API call
- QR gate passes use UUID tokens (crypto.randomUUID) stored in DB; verified at gate by security
- Role-based access control enforced at both route level (middleware) and UI level (ProtectedRoute)
- Analytics computed at query time from DB (no pre-aggregation needed at this scale)
- AI insights use OpenAI via Replit proxy with graceful fallback if API is unavailable

## Product

**Four role-based dashboards:**
- **Student**: Apply for gate passes, view QR codes for approved passes, track status, notifications
- **Warden**: Review and approve/reject requests with remarks, live outside tracking, history
- **Security**: QR scanner to mark student exits/entries, gate activity logs
- **Admin**: User management, hostel/department management, analytics charts, AI security insights

**Demo accounts (password = role + "123"):**
- `admin@campus.edu` / `admin123`
- `warden@campus.edu` / `warden123`
- `security@campus.edu` / `security123`
- `student@campus.edu` / `student123`

## User preferences

- Dark theme by default
- Production-quality code — no mocks or placeholders

## Gotchas

- After editing route files, must restart `artifacts/api-server: API Server` workflow to rebuild
- `pnpm run dev` at workspace root does NOT work — use individual artifact workflows
- Custom-fetch already injects JWT from localStorage; do NOT add duplicate auth in components
- When codegen runs, do not change `info.title` in OpenAPI spec — it controls generated filenames
- `isLate` on gate passes is computed at query time (not stored), so it updates in real-time

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

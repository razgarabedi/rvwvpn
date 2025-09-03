## FreeRADIUS User Manager – Documentation Log

This file is the authoritative, running log for the project. Every implementation change must be accompanied by an entry in this document.

- Purpose: Modern, clean SPA for managing users in a FreeRADIUS-backed OpenConnect VPN (modular for any FreeRADIUS-auth service).
- Stack: React (Vite, TS) SPA + Fastify (TypeScript) API + Knex (MySQL/MariaDB or PostgreSQL).
- Security: Admin JWT, CORS allowlist, ENV-configured DB credentials.

### Conventions
- Add a new entry under “Change Log” for each change. Use the template provided below.
- Update the “Next Steps” section whenever the plan changes.
- Keep commands copy-pasteable and minimal.

### Architecture Overview
- Frontend: Vite React TS SPA served at dev port 5173.
- Backend: Fastify TypeScript server exposing REST API under `/api`.
- Database: Direct Knex connection to FreeRADIUS DB (tables such as `radcheck`, `radusergroup`).
- Auth: ENV-seeded admin credentials -> login -> JWT bearer token -> protected routes.

### Change Log

#### Entry 0001 – Initialize backend project (Node + TS + Fastify)
- What: Created backend Node project and installed core dependencies; added TypeScript config and basic server.
- Why: Foundation for secure API to manage FreeRADIUS users.
- Files created/edited:
  - `backend/package.json` (scripts, dependencies)
  - `backend/tsconfig.json` (NodeNext ESM config)
  - `backend/src/index.ts` (Fastify server + CORS + `/health`)
- Commands executed:
```bash
cd backend
npm init -y
npm pkg set type=module
npm i fastify @fastify/cors dotenv zod knex mysql2 pg jsonwebtoken bcryptjs
npm i -D typescript tsx @types/node @types/jsonwebtoken @types/bcryptjs
```
- Verification:
  - `npm run dev` (after later steps) should start server; `GET /health` returns `{ status: 'ok', db: <boolean> }`.

#### Entry 0002 – Add TypeScript config and scripts
- What: Set `tsconfig.json` for NodeNext; added dev/build/start scripts.
- Files created/edited:
  - `backend/tsconfig.json`
  - `backend/package.json` scripts: `dev`, `build`, `start`
- Commands executed:
```bash
# Config and scripts were written directly to files
```
- Verification:
  - `npm run build` compiles to `dist/`; `npm run start` runs `dist/index.js`.

#### Entry 0003 – Environment validation and DB connector
- What: Validated environment with Zod; added Knex connector; added `.env.example` and `knexfile.ts`.
- Why: Typed, fail-fast config; safe DB access for MySQL/Postgres.
- Files created/edited:
  - `backend/src/config/env.ts` (Zod schema, typed `env`)
  - `backend/src/db/knex.ts` (singleton `getDb`, `healthCheck`)
  - `backend/.env.example` (PORT/HOST/CORS_ORIGIN, DB_*, JWT_SECRET)
  - `backend/knexfile.ts` (env-based connection)
- Commands executed:
```bash
# Files written directly by tooling; no additional commands required
```
- Verification:
  - `GET /health` includes `db: true` if DB env values are valid and DB is reachable.

#### Entry 0004 – JWT admin auth and login route
- What: Implemented JWT helpers and `/api/auth/login` route using ENV-seeded admin credentials.
- Why: Secure API access for administrative actions.
- Files created/edited:
  - `backend/src/auth/jwt.ts` (sign/verify, Fastify `authenticate` preHandler)
  - `backend/src/routes/auth.ts` (POST `/api/auth/login`)
  - `backend/.env.example` (added `ADMIN_USERNAME`, `ADMIN_PASSWORD` and optional `ADMIN_PASSWORD_HASH`)
- Verification:
  - `POST /api/auth/login` with correct credentials returns `{ token }`.
  - Use `Authorization: Bearer <token>` for protected endpoints.

#### Entry 0005 – FreeRADIUS user endpoints (radcheck/radusergroup)
- What: Implemented CRUD and enable/disable endpoints for users.
- Why: Provide core lifecycle management for VPN access.
- Files created/edited:
  - `backend/src/routes/users.ts`
  - `backend/src/index.ts` (route registration under `/api`)
- Endpoints (all require Bearer JWT):
  - `GET /api/users` → list usernames
  - `GET /api/users/:username` → details (presence of password, groups)
  - `POST /api/users` → create user `{ username, password, group? }`
  - `PUT /api/users/:username/password` → update cleartext password
  - `POST /api/users/:username/disable` → insert/merge `Auth-Type := Reject`
  - `POST /api/users/:username/enable` → remove any `Auth-Type` reject row
  - `DELETE /api/users/:username` → delete from `radcheck` and `radusergroup`
- Verification:
  - Exercise endpoints against a test FreeRADIUS DB. Check rows in `radcheck`/`radusergroup`.

#### Entry 0006 – Initialize frontend (Vite React TS)
- What: Created base React TS app; added Tailwind dev dependencies (to be configured).
- Files created/edited:
  - `frontend/` (Vite scaffold: `index.html`, `src/main.ts`, etc.)
  - `frontend/package.json` (scripts `dev`, `build`, `preview`; devDeps include `tailwindcss`, `postcss`, `autoprefixer`)
- Status:
  - Tailwind config and app wiring pending (see Next Steps).

### How to run locally (current status)
- Backend:
```bash
cd backend
cp .env.example .env
# Edit .env with DB_* and ADMIN_* values
npm run dev
# Visit: http://localhost:4000/health
```
- Frontend (scaffolded, not yet wired to API):
```bash
cd frontend
npm i
npm run dev
# Visit: http://localhost:5173
```

### API quick reference (current)
- Public:
  - `GET /health`
- Auth:
  - `POST /api/auth/login` → `{ token }`
- Users (Bearer token required):
  - `GET /api/users`
  - `GET /api/users/:username`
  - `POST /api/users` body: `{ username, password, group? }`
  - `PUT /api/users/:username/password` body: `{ password }`
  - `POST /api/users/:username/disable`
  - `POST /api/users/:username/enable`
  - `DELETE /api/users/:username`

### Next Steps (working plan)
- Configure Tailwind in frontend and add UI pages:
  - Login page (calls `/api/auth/login`)
  - Users list/detail pages (call `/api/users*`)
- Add server-side input validation refinements and audit logging.
- Optional: Add rate-limiting and improved CORS management.
- Optional: Add PR/commit enforcement to require updates to this document.

### Template for future entries
Copy and paste this block for each new change.

```
#### Entry 00XX – <short title>
- What: <describe the change>
- Why: <reason/benefit>
- Files created/edited:
  - <paths>
- Commands executed:
```bash
<commands>
```
- Verification:
  - <how to test>
```

### Enforcing documentation updates (recommended)
If you want to make updates “mandatory,” adopt one (or both) of these approaches:
- Add a PR template with a checkbox “I updated documentions.md”.
- Add a pre-commit hook that fails when `documentions.md` wasn’t modified alongside code changes.
  - Example (Husky):
```bash
npm i -D husky && npx husky init
# .husky/pre-commit
if git diff --name-only --cached | findstr /R /C:"^documentions.md$" >nul 2>&1; then
  exit 0
else
  echo "Please update documentions.md with this change." && exit 1
fi
```
Note: The above hook is optional and can be adapted for your OS/shell.

```

#### Entry 0007 – Add installation and usage guide (howto.md)
- What: Wrote a comprehensive HOWTO for installation, configuration, API usage, deployment, security, and troubleshooting.
- Why: Provide a step-by-step reference for setting up and operating the app.
- Files created/edited:
  - `howto.md`
- Verification:
  - Read `howto.md` and follow steps end-to-end on a clean machine.

## How to Install and Run the FreeRADIUS User Manager

This guide walks you through prerequisites, installation, configuration, local development, API usage, and deployment. It assumes you have access to a FreeRADIUS database (MySQL/MariaDB or PostgreSQL) and admin permissions to create/read/update relevant tables.

### 1) Prerequisites
- Node.js 18+ and npm
- A FreeRADIUS database with standard tables (e.g., `radcheck`, `radusergroup`)
- Network access to the DB from this server/workstation
- Open ports (defaults): Backend 4000, Frontend 5173

Optional but recommended:
- Reverse proxy (Nginx/Caddy) for HTTPS and route `/api` to backend
- PM2 or systemd for running backend in production

### 2) Get the code
If you haven’t already cloned the repo:
```bash
# Replace with your repository URL
git clone <REPO_URL> freeradius-user-manager
cd freeradius-user-manager
```
If you are using this in the provided workspace, your root is already set to this project directory.

### 3) Backend setup
The backend is a Fastify TypeScript API that talks directly to the FreeRADIUS DB via Knex.

1. Install dependencies and configure environment:
```bash
cd backend
npm i
cp .env.example .env
```
2. Edit `.env` with your values:
- Server:
  - `PORT` (default 4000)
  - `HOST` (default 0.0.0.0)
  - `CORS_ORIGIN` (e.g., http://localhost:5173 for the frontend)
- Database:
  - `DB_CLIENT` (`mysql2` or `pg`)
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Auth:
  - `JWT_SECRET` (use a strong random string)
  - `ADMIN_USERNAME` (e.g., `admin`)
  - EITHER `ADMIN_PASSWORD` OR `ADMIN_PASSWORD_HASH`

3. (Optional) Generate a secure bcrypt hash instead of using plain `ADMIN_PASSWORD`:
```bash
# from the backend directory
node -e "console.log(require('bcryptjs').hashSync('change-me-please', 10))"
# Copy the output into ADMIN_PASSWORD_HASH and remove ADMIN_PASSWORD
```

4. Run the backend in dev mode:
```bash
npm run dev
# Server listens on http://localhost:4000
# Health check: http://localhost:4000/health
```
- Health check returns `{ status: 'ok', db: true }` if DB is reachable (requires valid DB env).

Build for production:
```bash
npm run build
node dist/index.js
```

### 4) Frontend setup
The frontend is currently scaffolded with Vite TypeScript (UI to be expanded). You can run it now to verify CORS and future integration.

```bash
cd frontend
npm i
npm run dev
# Visit http://localhost:5173
```

Tailwind CSS is installed as a dev dependency but not yet fully configured. When the React UI is implemented, we’ll finalize Tailwind (content paths and CSS entry).

### 5) API usage
Authenticate as admin and use the returned JWT to access protected endpoints.

1. Login to get a token:
```bash
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}'
# => { "token": "<JWT>" }
```

2. List users (use the JWT):
```bash
curl -s http://localhost:4000/api/users \
  -H "Authorization: Bearer <JWT>"
```

3. Create a user:
```bash
curl -s -X POST http://localhost:4000/api/users \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret","group":"vpn"}'
```

4. Update a user password:
```bash
curl -s -X PUT http://localhost:4000/api/users/alice/password \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"password":"new-secret"}'
```

5. Disable/enable a user:
```bash
# disable
curl -s -X POST http://localhost:4000/api/users/alice/disable \
  -H "Authorization: Bearer <JWT>"
# enable
curl -s -X POST http://localhost:4000/api/users/alice/enable \
  -H "Authorization: Bearer <JWT>"
```

6. Delete a user:
```bash
curl -s -X DELETE http://localhost:4000/api/users/alice \
  -H "Authorization: Bearer <JWT>"
```

### 6) Deployment (example)
- Backend (production):
  - Build: `cd backend && npm ci && npm run build`
  - Run: `node dist/index.js` (consider PM2 or systemd)
- Frontend: Build and serve static site (after UI is implemented):
  - `cd frontend && npm ci && npm run build`
  - Serve `dist/` via Nginx/Caddy/Netlify/etc.
- Reverse proxy (Nginx) sketch:
```nginx
server {
    listen 80;
    server_name your-domain.example;

    location /api/ {
        proxy_pass http://127.0.0.1:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /var/www/frontend;  # point to your built frontend dist
        try_files $uri /index.html;
    }
}
```

### 7) Security best practices
- Use `ADMIN_PASSWORD_HASH` instead of `ADMIN_PASSWORD`.
- Set a long, random `JWT_SECRET`.
- Restrict `CORS_ORIGIN` to known hosts (avoid `*`).
- Use a least-privilege DB user (only needed tables, CRUD as required).
- Put the backend behind HTTPS and ideally a reverse proxy.
- Add rate-limiting and audit logging for admin actions (future enhancement).

### 8) Troubleshooting
- DB connection errors:
  - Verify DB host/port, firewall, credentials, and that the FreeRADIUS schema exists.
- `/health` shows `db: false`:
  - The backend can’t connect to DB; check `.env` and DB reachability.
- CORS errors in browser:
  - Ensure `CORS_ORIGIN` includes your frontend origin.
- 401 Unauthorized:
  - Login again and pass `Authorization: Bearer <token>` header.
- Port already in use:
  - Change `PORT` or stop the conflicting process.

### 9) Maintaining this project
- Update `documentions.md` for every code or configuration change (mandatory for this project).
- Keep dependencies up to date and rebuild.
- Back up DB regularly and test restores.

If something is unclear or you need platform-specific guidance, add a new entry to `documentions.md` describing the issue and resolution.

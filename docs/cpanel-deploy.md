# Automated deploy to Namecheap shared hosting (cPanel) — FTP

The repo contains a GitHub Actions workflow (`.github/workflows/deploy.yml`)
that, on every push to `main`, runs the test suite and then **builds Next.js
in CI** and uploads the app to cPanel over **FTP**.

SSH is not required. The build uses Next.js `output: "standalone"`, which emits
a self-contained runtime (a `server.js` plus a traced `node_modules`), so the
server needs **no `npm install` and no build step** — the uploaded files run
directly under cPanel's Node.js App.

## What the workflow uploads
The bundle (`deploy/`) contains:
- standalone runtime: `server.js` + traced `node_modules` + `.next`
- `public/` assets (media uploads live here and persist on the server)
- `data/schema.sqlite.sql` + `data/seed.json` (used to auto-provision the DB
  on first boot)

`data/portfolio.db` is created + seeded automatically on the first request and
is never overwritten by deploys (it lives only on the server).

## One-time cPanel setup

1. **FTP account** (cPanel → Files → FTP Accounts) — create one for the app,
   note the host and whether it supports FTPS (implicit on port 990) or plain
   FTP (port 21). Prefer FTPS.

2. **Setup Node.js App** (cPanel → Software → Setup Node.js App):
   - Application root: the folder the app will be uploaded into (e.g. `~/app`)
   - **Application startup file:** `server.js`
   - **Application URL:** your domain
   - **Node.js version: 22 or 24** (required for `node:sqlite`)
   - Environment variables:
     - `DB_FILE=data/portfolio.db`
     - `JWT_SECRET=<a long random hex string>`
     - `NEXT_PUBLIC_API_URL=/api/v1`
     - `MEDIA_UPLOAD_DIR=public/uploads`
     - `MEDIA_QUOTA_BYTES=6442450944`
     - `HOSTNAME=127.0.0.1`
     - `NODE_ENV=production`
   - Save and start the app. It must be running before the first deploy so the
     domain/proxy is live.

3. **Verify once:** after the first deploy, the app should respond at your
   domain, `/admin` login works, and `data/portfolio.db` exists.

## One-time GitHub setup

Repo → **Settings → Secrets and variables → Actions**:

**Secrets** (New repository secret):

| Secret           | Value |
|------------------|-------|
| `FTP_HOST`       | FTP host from step 1 (hostname or IP) |
| `FTP_USERNAME`   | FTP username |
| `FTP_PASSWORD`   | FTP password |
| `FTP_PORT`       | `990` (FTPS) or `21` (plain FTP) |
| `FTP_PROTOCOL`   | `ftps` or `ftp` (match the port) |

**Variables** (Variables tab → New repository variable):

| Variable     | Value |
|--------------|-------|
| `SERVER_DIR` | app root relative to the FTP user's home, e.g. `app/` (no leading slash) |

## Restart after deploy

Uploading new files does **not** restart a running Node app. After a deploy:
- **Manual (recommended start):** click **Restart** in Setup Node.js App.
- **Automated:** add a cPanel cron job that calls the cPanel UAPI
  `NodeApp::restart_app` with an API token after each deploy (set up once the
  app is proven).

## Manual trigger
The workflow runs on every push to `main`, and can also be triggered manually
from the **Actions** tab (Run workflow).

## Troubleshooting
- **Node < 22.5:** the app will fail on startup (`node:sqlite` unavailable).
  Select Node 22/24 in Setup Node.js App, or ask to switch `db.ts` to
  `better-sqlite3`.
- **`HOSTNAME` missing:** the standalone server binds to the machine hostname
  and may not be reachable — keep `HOSTNAME=127.0.0.1` in the env vars.
- **DB not persisted after restart:** confirm `DB_FILE` is a relative path
  (`data/portfolio.db`) so it resolves under the app root, and that the app
  root folder is writable by the Node app.
- **Empty site on first boot:** the seed runs only when the `users` table is
  empty; after first boot it stays seeded even after redeploys.
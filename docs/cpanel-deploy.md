# Automated deploy to Namecheap shared hosting (cPanel)

The repo contains a GitHub Actions workflow (`.github/workflows/deploy.yml`)
that, on every push to `main`, runs the test suite and then deploys over SSH
to the cPanel box via `scripts/deploy.sh`.

The deploy runs on the **server**: it `git pull`s, installs production deps,
builds Next.js, and restarts the app. The `.next` output and `node_modules`
are produced natively on the host, so no large artifacts are uploaded.

## One-time server setup (cPanel)

1. **SSH** — already enabled (`~/.ssh/id_rsa`). Make sure the public key that
   GitHub Actions will use is in `~/.ssh/authorized_keys`.

2. **Clone the repo** into the app root (e.g. `~/app`):

   ```bash
   cd ~
   git clone https://github.com/Pro-joseph/Dev_Portfolio.git app
   cd app
   ```

3. **Create `.env.production`** in `~/app` (copied from `.env.example`):

   ```bash
   cp .env.example .env.production
   nano .env.production   # set a real JWT_SECRET, keep DB_FILE=data/portfolio.db
   ```

   The DB is auto-created + seeded on first boot; `data/*.db` is gitignored so
   it is never overwritten by deploys.

4. **Setup Node.js App** (cPanel → Software → Setup Node.js App):
   - Application root: the app dir (e.g. `~/app`)
   - **Application startup file:** `server.js`
   - **Application URL:** your domain
   - **Node.js version: 22 or 24** (required for `node:sqlite`; deploy aborts if < 22)
   - Paste the `.env.production` values into the application environment variables
   - Save/start the app, confirm it serves your domain.

5. **Verify manually:** `~/app` should respond at your domain, `/admin` login
   works, and `data/portfolio.db` exists after the first request.

## One-time GitHub setup

1. **Repo secrets** (Settings → Secrets and variables → Actions → New secret):

   | Secret             | Value |
   |--------------------|-------|
   | `SSH_HOST`         | your server hostname/IP |
   | `SSH_PORT`         | `22` |
   | `SSH_USER`         | cPanel username (e.g. `josecciq`) |
   | `SSH_PRIVATE_KEY`  | the **private** key GitHub Actions uses to log in |

   For `SSH_PRIVATE_KEY`: generate a dedicated key locally
   (`ssh-keygen -t ed25519 -f deploy_key`), paste the private key into the
   secret, and add the **public** key to `~/.ssh/authorized_keys` on the server.

2. **Repo variable** (Settings → Secrets and variables → Actions → Variables):

   | Variable  | Value  |
   |-----------|--------|
   | `APP_ROOT`| server path to the app, e.g. `/home/josecciq/app` |

3. **Server can `git pull` the repo** — for a private repo the server needs a
   deploy key: add the server's `~/.ssh/id_rsa.pub` as a read-only deploy key
   (Settings → Deploy keys), or switch the clone to HTTPS with a PAT in the
   remote URL.

## How it behaves

- Push to `main` → workflow runs. `test` job must pass; then `deploy` SSHes in
  and runs `scripts/deploy.sh` (pull, `npm ci --omit=dev`, `next build`,
  restart via `pkill -f "node .*server.js"`).
- cPanel's Node.js supervisor restarts the app after the process is killed.
  If the host does **not** auto-restart, replace the `pkill` line in
  `scripts/deploy.sh` with a cPanel UAPI restart call using an API token.
- If Node < 22.5 on the server, the deploy aborts with a clear message — then
  either bump the Node version in cPanel or ask to switch `db.ts` to
  `better-sqlite3`.
# Global Partner Expansion Hub

Internal business development workspace for markets, partners, activities, agreements, training and reports. React/Vite frontend with an Express backend. Node.js 24 is required.

## Local development

1. Run `npm ci`.
2. Copy `.env.example` to `.env`. Set your own `APP_USERNAME`, `APP_PASSWORD` (12+ characters) and random `SESSION_SECRET` (32+ characters). Never commit these values.
3. For local JSON storage, set `NODE_ENV=development`, remove/leave blank the MySQL variables, and set `DATA_DIR` to an absolute directory outside this checkout. Alternatively configure a dedicated local MySQL database.
4. Run `npm run dev`.

Business data starts empty. Set `INITIAL_DATA_MODE=sample` only when intentionally creating a new demonstration database. Existing data is never replaced by changing that variable.

## Validation and production build

```sh
npm run lint
npm test
npm run build
npm start
```

The build creates `dist/` and `server.js`. Build errors stop deployment. The production server refuses to start without a built frontend, configured credentials, a strong session secret, and a MySQL database. Do not deploy only the `dist/` folder: authentication and data storage require Express.

## Hostinger

Target repository: https://github.com/hamdanfaiz/expansion-hub

Target domain: https://blueviolet-crane-779239.hostingersite.com

Use a Node.js Web App with backend Express (or Other with an explicit backend entry), Node.js 24, repository root `.`, build command `npm run build`, and entry file `server.js`. If a start command is requested, use `npm start`. Express serves the generated frontend in `dist/`. Build tools are devDependencies, so ensure the build installation includes them (`npm ci --include=dev` if the installation command is configurable).

Set `NODE_ENV=production`, `APP_URL`, `APP_USERNAME`, `APP_PASSWORD`, `SESSION_SECRET`, and the `MYSQL_*` variables in Hostinger Environment Variables. Do not add real credentials to this repository or to any `VITE_*` variable. Hostinger supplies the listening port.

Create a dedicated MySQL database and database user. Use the exact names including Hostinger's account prefix; use `MYSQL_HOST=127.0.0.1` for a database on the same Hostinger account. The application creates its state table in that database. It stores the full validated application snapshot in MySQL and uses atomic revision checks to reject conflicting writes.

`ENABLE_DATABASE_RESET=false` should remain set for production. Export a JSON backup through Settings before bulk changes, and enable the hosting database backup schedule. Restore application data using the JSON import, or restore a real MySQL backup of the live state table. The SQL download contains normalized tables for reporting/interoperability; importing that download alone does not restore the application's live snapshot table.

After deployment verify `/api/health`, login, create/edit/reload, JSON/SQL exports, two-browser conflict handling, and persistence after restart/redeploy. Enable HTTPS for the domain; production session cookies are Secure and HttpOnly.

## Data and access behavior

- The server is the authoritative source of business data. Browser caches from the prototype are not automatically uploaded.
- Saving begins only after a successful authenticated database load.
- Writes include the loaded revision. A conflicting edit pauses saving and requires reloading or explicitly resolving the local work; it never silently overwrites the other user.
- Validation rejects malformed records and broken references. Deleting records with dependents is restricted.
- Users currently share one workspace. The displayed role is a profile label, not a granular permissions system. Keep access limited to trusted team members.
- Login is throttled. Missing credentials do not create a default account.

## Repository hygiene

Keep secrets, runtime data, SQL dumps, generated bundles and AI Studio scratch artifacts out of Git. `.gitignore` excludes these. The original ZIP's generated server bundle and cPanel instructions are superseded by this build and README.

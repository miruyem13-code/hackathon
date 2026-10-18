# Backend deployment verification — 2026-10-18

This branch adds PostgreSQL support for Vercel while retaining local SQLite. No production database credentials were accessed, and no production database was changed.

Validated locally on Node.js 24.19.0:

- `npm run typecheck`: passed.
- `npm test`: 40/40 passed. The 17 existing business/API tests run against both SQLite and PGlite PostgreSQL. Six additional tests cover missing Vercel configuration, migration repeatability, transaction rollback, case-insensitive email uniqueness, rate-limit enforcement and PostgreSQL health.
- `npm run build`: passed. The build does not require DATABASE_URL, open a database connection, or apply migrations.
- Built Next.js production server over HTTP: health, registration, HttpOnly/Secure session cookie, authenticated student page, four courses, reports, logout invalidation and login passed. This HTTP check used an isolated local SQLite file and random credentials.
- `git diff --check`: passed.

Limits:

- PGlite validates the PostgreSQL schema and the production SQL adapter, but does not validate node-postgres network/TLS connectivity, Neon provisioning or concurrent connections to a live PostgreSQL server.
- Playwright browser installation failed because the environment received an invalid download archive; browser UI E2E tests were not run in this environment.
- Vercel connector access to project environment variables and runtime logs was denied for the `alset` scope. The deployed site is protected by Vercel Authentication. Live registration and database state have not been verified.
- Existing SQLite data is not automatically imported into PostgreSQL; its files are left intact.

Before promoting the fix, follow README's Vercel + Neon section: configure the correct environment's DATABASE_URL and APP_ORIGIN, apply migrations and content seed, deploy this branch, then verify `/api/health`, registration and login on that deployment. Keep preview data separate from production.

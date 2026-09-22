# Customer demo implementation

Two separate tenant deployments: Cairnhead Racing Yard (`cairnhead`) and Canswell Farm (`canswell`). One repository; each deployment has its own PostgreSQL database, upload volume and authentication secret. These are fictional demonstration datasets, not customer records.

## Work checklist

- General yard terminology and optional legacy military fields, preserving stored identifiers.
- Invitations and password recovery with expiring, single-use, hashed tokens.
- Revalidate active status and permissions on every server session check; revoke sessions on password/security changes.
- Persistent upload directory and traversal protection.
- Guarded, transactional demo seed for empty databases only.
- Repeatable deployment and backup/restore instructions.
- Automated checks, database integration checks and browser smoke tests.

Deployment, spending, DNS changes and real invitations require owner approval. No automatic provisioning or deployment is part of this change.

## Railway inspection (22 September 2026)

The connected workspace currently contains `Paddock Marketing`, with one service named `Paddock Demo`. Its latest deployment is CRASHED. Runtime logs show migrations attempting to connect to `localhost:5432`; no PostgreSQL service or upload volume appears in the project status. The service has no `PADDOCK_SITE_MODE` variable and therefore starts as a tenant. No live variables, services or deployments were changed during implementation.

For the public site, set `PADDOCK_SITE_MODE=marketing`, `PADDOCK_PORTAL_DOMAIN=paddock-ltd.com` and `NEXTAUTH_URL` to its verified HTTPS address, then redeploy after approval. A marketing deployment does not need a database. Review/remove the obsolete local DATABASE_URL separately; do not reuse it for a customer.

## Deployment recipe (after approval)

1. Create two private Railway projects in the existing workspace: `Paddock — Cairnhead Racing Yard` and `Paddock — Canswell Farm`.
2. Add one PostgreSQL service named `Postgres` in each. Use each project's own private database URL and credentials. Never share databases or authentication secrets between customers.
3. Add an application service from `jpabird-art/Paddock`, using the reviewed release commit. Use the repository Dockerfile and railway.json. Do not enable unreviewed automatic production releases from arbitrary branches.
4. Apply `deploy/cairnhead.env.example` or `deploy/canswell.env.example`. Generate a separate NEXTAUTH_SECRET per service. Configure a persistent volume mounted at `/app/uploads`; UPLOAD_DIR points there. Keep one application replica: filesystem uploads and the in-memory rate limiter are designed for a single instance. Horizontal scaling needs shared object storage and a shared rate-limit store first.
5. Add `cairnhead.paddock-ltd.com` and `canswell.paddock-ltd.com` to their respective services. Add the exact CNAME and verification TXT records Railway supplies. Verify HTTPS before issuing invitations. Set NEXTAUTH_URL to that exact origin; never derive account links from incoming Host headers.
6. Allow startup migrations to complete and verify `/api/health`. Marketing health checks must not require PostgreSQL. Existing users will have to sign in again after the session-version migration.
7. Seed each EMPTY demo database once using the command below. The script refuses any existing application data, mismatched organisation names, missing confirmation, or an existing credentials output file. It never sends email. Do not enable demo seeding on normal customer deployments or make it part of startup.
8. Retrieve credentials through an approved private channel and remove the server-side credentials file. Store them in the operator's password manager. Never commit, paste into logs, or place them in uploads/public. The `.example.invalid` email addresses are intentionally undeliverable.
9. Configure verified SMTP credentials for real invitation testing after the owner supplies approved recipients. Smoke-test delivery and recovery; until SMTP is configured, the UI reports that email is unavailable. Existing administrator-created password accounts remain supported.
10. Set daily database and upload-volume backups; retain an independent encrypted backup outside the application. Test restoring the database and matching uploaded files into a separate project. Enable uptime/error alerts and spending notifications before real customer use.

Seed command, run inside the matching application container after migrations:

```sh
# For Cairnhead (other required settings come from the service environment):
DEMO_SEED_CONFIRM='SEED cairnhead' DEMO_CREDENTIAL_FILE=/tmp/cairnhead-credentials.json node scripts/seed-demo.mjs
# For Canswell, in its own project:
DEMO_SEED_CONFIRM='SEED canswell' DEMO_CREDENTIAL_FILE=/tmp/canswell-credentials.json node scripts/seed-demo.mjs
```

The two projects add two application services, two PostgreSQL services and four persistent volumes (database + uploads per project). Hosting charges depend on actual memory/CPU, storage and egress; check the workspace plan and set a budget before provisioning. No fixed cost estimate should be treated as a quote.

## Verification and recovery

Local: `npm ci`, `npx prisma generate`, `npm run check`, `npm run build`.
Integration tests opt in through TEST_DATABASE_URL and TEST_OTHER_DATABASE_URL, both restricted to loopback addresses. Apply migrations to both empty local databases first. CI runs these against two PostgreSQL 16 services. Tests create and remove only their own random user records.

Acceptance: log into both Paddocks; verify different horse lists; try a Cairnhead record ID and session against Canswell; test staff versus manager versus administrator access; invite a test recipient; redeem and replay the link; reset a password; deactivate a signed-in user; downgrade a signed-in manager; upload and download a document; restart and verify the file persists; edit the same horse in two browser tabs and confirm the stale form receives a conflict message. Check desktop and mobile layouts.

Backup example from an approved operator environment with PostgreSQL tools:

```sh
# DATABASE_URL is injected securely, not written into this command.
umask 077
pg_dump --format=custom --file=database.dump "$DATABASE_URL"
# Capture the upload volume during the same maintenance window.
# Restore into a NEW empty project, never over a customer's live database.
pg_restore --no-owner --no-acl --dbname="$RESTORE_DATABASE_URL" database.dump
```

After restoring the matching files and database, check record/file counts, sample downloads and role permissions before switching traffic. Use a new authentication secret for the restore test. Do not assume rolling back an image reverses schema migrations; this migration is additive, but future destructive migrations require a separate recovery plan.

## Compatibility and release limitations

- General yard profile is the default. Set PADDOCK_ORG_PROFILE=military to show the optional legacy rank/squadron/horse classification fields and parade dashboard. Existing database identifiers and enum values are preserved; OFFICER displays as Yard manager and TROOPER as Yard staff. This is not a configurable arbitrary-role or arbitrary-team system.
- Recovery does not disable MFA. MFA recovery for a lost authenticator still needs an operator procedure; use the existing backup codes where possible.
- Horse edit forms detect stale updates using updatedAt. Other existing editing screens still use their current update behaviour; a full concurrent-edit audit is needed before a wider production launch.
- Rate limits are per process, reset on restart, and assume Railway supplies trustworthy proxy IP headers. Shared/edge rate limiting is required before adding replicas or exposing a high-volume public signup flow.
- npm audit identifies pre-existing high/critical advisories, including Next.js, NextAuth and email dependencies. Their upgrades and any required migrations need a dedicated compatibility review before real customer launch. This change does not claim production security certification.
- Railway backup restoration, real SMTP deliverability, DNS verification and live volume persistence require the approved hosted environment. Local checks cannot establish those properties of a future deployment.

## Validation completed for this change

- 65 tests passed, including two isolated local PostgreSQL-compatible PGlite databases; all migrations applied to both. CI also provisions two full PostgreSQL 16 services.
- Production build and TypeScript checks passed.
- HTTP smoke checks passed for cross-customer record/session rejection, role enforcement, stale horse edits, upload isolation, invitations, single-use recovery, session revocation and origin validation. Email was captured by a local SMTP sink; no real messages were sent.
- Browser checks verified the branded login/dashboard and the general-yard riding board. Live DNS, SMTP delivery, restart persistence and backup restoration remain deployment acceptance checks.

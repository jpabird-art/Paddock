# Paddock

Equine operations software. Paddock holds the health, injuries, movements,
exercise, farriery, feed, medication, tack and inspections of every horse in an
organisation's care on a single auditable record.

The repository serves two roles from one codebase:

- **Marketing site** — the public product site at `paddock.app`: home,
  capabilities, contact and a portal that sends each customer to their own
  instance.
- **Tenant application** — a single customer's paddock, behind sign-in, at
  their own subdomain and on their own database.

`PADDOCK_SITE_MODE` decides which. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
for the Railway setup.

---

## Quick start

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL (local, or hosted on Railway or Neon)

### Setup

```bash
git clone <repo-url>
cd Paddock

npm install

cp .env.example .env
# Fill in DATABASE_URL and NEXTAUTH_SECRET

npx prisma migrate dev

# Create the first administrator
BOOTSTRAP_ADMIN_NAME="Jane Smith" \
BOOTSTRAP_ADMIN_SERVICE_NUMBER=ADMIN001 \
BOOTSTRAP_ADMIN_EMAIL=jane@example.org \
BOOTSTRAP_ADMIN_PASSWORD='<a long random password>' \
npm run bootstrap

npm run dev
```

Open <http://localhost:3000> and sign in. There is no demo data and there are
no default credentials: the bootstrap account is the only way in, and its
password is the one you set.

To work on the public site instead, set `PADDOCK_SITE_MODE=marketing` in `.env`
and reload. Marketing mode needs no database: it reads nothing, and the start
command skips migrations.

---

## Environment variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Tenant mode only |
| `NEXTAUTH_SECRET` | Auth signing secret, minimum 32 characters | Yes |
| `NEXTAUTH_URL` | Full URL this deployment is served from | No |
| `PADDOCK_SITE_MODE` | `tenant` (default) or `marketing` | No |
| `PADDOCK_ORG_NAME` | Customer name shown in the app and as MFA issuer | No |
| `PADDOCK_PORTAL_DOMAIN` | Domain tenant instances sit under | No |
| `PADDOCK_TENANT_DIRECTORY` | Published tenant list for the portal | No |
| `PADDOCK_CONTACT_EMAIL` | Where contact enquiries are sent | No |
| `PADDOCK_CONTACT_PHONE` | Shown on the contact page when set | No |
| `PADDOCK_CONTACT_ADDRESS` | Shown on the contact page | No |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Email delivery; notifications and the contact form are disabled without them | No |

Bootstrap-only variables are listed in `.env.example`.

---

## Tech stack

- **Next.js 16** — App Router, React Server Components, standalone output
- **PostgreSQL** via **Prisma 5**
- **NextAuth.js v4** — JWT sessions, credentials provider, TOTP second factor
- **RBAC** — five roles across sixteen resources and four actions
- **Tailwind CSS** with Radix UI primitives
- **Vitest** for unit tests, **Zod** for runtime validation

---

## Architecture

```
src/
  app/
    (marketing)/    # Public site: home, capabilities, contact, portal
    (auth)/         # Sign-in
    (app)/          # The application, behind auth
    api/            # Route handlers
  components/
    marketing/      # Public-site components and capability copy
    layout/         # Sidebar, mobile navigation
    ...             # Feature components
  lib/
    site-config.ts  # Site mode, branding, tenancy
    permissions.ts  # RBAC
    ...
prisma/
  schema.prisma          # 18 models
  migrations/            # Migration history
  bootstrap.ts           # First administrator for a new instance
  purge-horse-data.ts    # Irreversible deletion of all horse data
docs/
  DEPLOYMENT.md          # Railway, per-tenant
```

### Roles

| Role | Key capabilities |
|---|---|
| Admin | Everything, including user management and the audit log |
| Officer | Create horses, manage duties, exercise, moves, tack, inspections |
| Vet | Health events, medications, feeding plans, injury resolution |
| Farrier | Farrier records and the horses they cover |
| Trooper | View most records, raise injury reports, add attachments |

---

## Scripts

```bash
npm run dev           # Development server
npm run build         # Production build
npm run start         # Migrate, then serve
npm run typecheck     # tsc --noEmit
npm run test          # Vitest
npm run check         # Typecheck and tests
npm run bootstrap     # Create the first administrator (env-driven)
npm run purge         # Delete all horse data (guarded, irreversible)
npm run prisma:studio # Database browser
```

---

## API

All endpoints sit behind authentication and the same permission checks as the
interface, except `/api/health` (unauthenticated healthcheck) and
`/api/contact` (marketing mode only, rate-limited).

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Database connectivity and latency |
| POST | `/api/contact` | Marketing enquiries |
| GET/POST | `/api/horses` | List and create horses |
| GET/PATCH/DELETE | `/api/horses/[id]` | Horse record |
| GET | `/api/horses/export` | Spreadsheet export |
| GET/POST | `/api/injuries` | Injury reports |
| GET/POST | `/api/health-events` | Health scheduling |
| GET/POST | `/api/horse-moves` | Movements |
| GET/POST | `/api/exercise-assignments` | Exercise board |
| GET/POST | `/api/farrier-records` | Farriery |
| GET/POST | `/api/feeding-plans` | Feeding plans |
| GET/POST | `/api/medication-records` | Medication |
| GET/POST | `/api/tack/items`, `/api/tack/allocations` | Tack |
| GET/POST | `/api/inspections`, `/api/inspections/schedules` | Inspections |
| GET/POST | `/api/attachments` | File upload and download |
| GET/POST | `/api/admin/users` | User management |
| GET | `/api/admin/audit-logs` | Audit log |
| GET | `/api/locations` | Locations |

---

## Backup and restore

```bash
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql
psql "$DATABASE_URL" < backup_20260921.sql
```

## Customer demonstrations

See [docs/CUSTOMER-DEMOS.md](docs/CUSTOMER-DEMOS.md) for the two isolated demo environments, secure account invitations/recovery, persistent uploads and deployment acceptance checks.

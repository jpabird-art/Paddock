# HCMR Fleet Management System

Horse management system for the Household Cavalry Mounted Regiment. Tracks health schedules, injuries, movements, duty assignments, rider assignments, tack, inspections, feeding plans, and medications across the regiment's horse fleet.

---

## Demo Credentials

| Role    | Service Number | Password      |
|---------|---------------|---------------|
| Admin   | `ADMIN001`    | `password123` |
| Vet     | `VET001`      | `password123` |
| Officer | `OFF001`      | `password123` |
| Trooper | `TRP001`      | `password123` |
| Trooper | `TRP002`      | `password123` |

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- npm
- PostgreSQL database (local or hosted, e.g. [Neon](https://neon.tech))

### Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd hcmr-fleet

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL connection string and secrets

# 4. Set up database and seed demo data
npx prisma migrate dev
npm run prisma:seed

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with any demo credential above.

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Auth signing secret (min 32 chars). Generate with `openssl rand -base64 32` | Yes |
| `NEXTAUTH_URL` | Full URL where the app is running | No (defaults to `http://localhost:3000`) |
| `NODE_ENV` | `development`, `production`, or `test` | No |

---

## Tech Stack

- **Next.js 16** with App Router, Turbopack, React Server Components
- **PostgreSQL** via **Prisma 5** ORM (15 enums, 17 models)
- **NextAuth.js v4** with JWT strategy and credentials provider
- **RBAC** — 4 roles (Admin, Vet, Officer, Trooper) x 16 resources x 4 actions
- **Tailwind CSS** with Radix UI primitives
- **Vitest** for unit testing
- **Zod** for runtime validation with Prisma enum alignment

---

## Architecture

```
src/
  app/
    (app)/          # Authenticated app pages (dashboard, horses, injuries, moves, etc.)
    api/            # REST API routes (Next.js Route Handlers)
      admin/        # User management, audit logs
      attachments/  # File upload/download
      horses/       # Horse CRUD
      health-events/# Health scheduling
      injuries/     # Injury reporting
      horse-moves/  # Movement tracking
      ...
  components/       # React components (layout, horses, injuries, moves, etc.)
  lib/              # Shared utilities (auth, permissions, audit, prisma)
prisma/
  schema.prisma     # Database schema (17 models, 15 enums)
  seed.ts           # Demo data seeder
  migrations/       # Prisma migration history
uploads/            # Uploaded attachment files (gitignored)
```

### Key Models

- **Horse** — regimental number, squadron, duty station, health tracking
- **User** — role-based (Admin/Vet/Officer/Trooper), squadron assignment
- **InjuryReport** — severity levels, status workflow, resolution tracking
- **HorseMove** — location-to-location movement with driver/vehicle details
- **HealthEvent** — scheduled veterinary events (dental, farrier, vaccination, etc.)
- **DutyAssignment** — historical duty station tracking with transactional integrity
- **AuditLog** — before/after snapshots for critical operations

### Squadrons

Two squadrons: **The Life Guards** and **The Blues and Royals**. All users (except Vets) and all horses are assigned to a squadron.

### RBAC Summary

| Role | Key Capabilities |
|------|-----------------|
| Admin | Full access to all resources including user management |
| Officer | Create horses, manage duties/riders/moves/tack/inspections |
| Vet | Manage health events, medications, feeding plans, resolve injuries |
| Trooper | View most records, create injury reports and attachments |

---

## Available Scripts

```bash
npm run dev           # Start development server (Turbopack)
npm run build         # Build for production
npm run start         # Start production server
npm run test          # Run unit tests (Vitest)
npm run test:watch    # Run tests in watch mode
npm run check         # Build + test (quality gate)
npm run prisma:seed   # Seed demo data
npm run prisma:studio # Open Prisma Studio (DB browser)
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | None | Healthcheck (DB connectivity + latency) |
| GET/POST | `/api/horses` | Auth | List/create horses |
| GET/PATCH/DELETE | `/api/horses/[id]` | Auth | Horse CRUD |
| GET/POST | `/api/injuries` | Auth | List/create injury reports |
| PATCH | `/api/injuries/[id]` | Auth | Update injury status |
| GET/POST | `/api/horse-moves` | Auth | List/create moves |
| GET | `/api/health-events` | Auth | List health events |
| GET/POST | `/api/rider-assignments` | Auth | Rider-horse assignments |
| GET/POST | `/api/feeding-plans` | Auth | Feeding plans |
| GET/POST | `/api/medication-records` | Auth | Medication records |
| GET/POST | `/api/attachments` | Auth | File upload (multipart) |
| GET | `/api/attachments/[id]/download` | Auth | File download |
| GET/POST | `/api/tack/items` | Auth | Tack inventory |
| GET/POST | `/api/tack/allocations` | Auth | Tack allocations |
| GET/POST | `/api/inspections` | Auth | Inspections |
| GET/POST | `/api/inspections/schedules` | Auth | Inspection schedules |
| GET/POST | `/api/admin/users` | Admin | User management |
| PATCH | `/api/admin/users/[id]` | Admin | Update user |
| GET | `/api/admin/audit-logs` | Admin | Audit log viewer |
| GET | `/api/locations` | Auth | Location list |

---

## Backup & Restore

The database is PostgreSQL hosted on Neon. To back up:

```bash
# Export full database
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql

# Restore from backup
psql "$DATABASE_URL" < backup_20260321.sql
```

For a fresh start with demo data:

```bash
npx prisma migrate reset    # WARNING: drops all data
npm run prisma:seed
```

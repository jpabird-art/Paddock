# HCMR Fleet Management System

Horse management system for the Household Cavalry Mounted Regiment. Tracks health schedules, injuries, movements, and duty assignments across the regiment's horse fleet.

---

## Demo Credentials

| Role    | Service Number | Password   |
|---------|---------------|------------|
| Admin   | `00000001`    | `Admin1234!` |
| Vet     | `00000002`    | `Vet1234!`   |
| Officer | `00000003`    | `Officer1234!` |
| Trooper | `00000004`    | `Trooper1234!` |

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- npm

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/hcmr-fleet.git
cd hcmr-fleet

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

# 4. Set up database and seed demo data
npm run setup

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with any demo credential above.

---

## Intranet / Server Deployment (Docker)

### Prerequisites
- Docker and Docker Compose installed on the server

### Deploy

```bash
# 1. Clone the repo on the server
git clone https://github.com/YOUR_USERNAME/hcmr-fleet.git
cd hcmr-fleet

# 2. Create environment file
cp .env.example .env
```

Edit `.env`:
```env
# Generate a strong secret: openssl rand -base64 32
NEXTAUTH_SECRET=your-strong-secret-here

# Set to the server's IP or hostname on the intranet
NEXTAUTH_URL=http://192.168.1.50:3000
```

```bash
# 3. Build and start
docker compose up -d
```

The app will be available at `http://<server-ip>:3000` from any machine on the intranet.

**On first start**, the database is automatically migrated and seeded with demo data.

### Useful commands

```bash
# View logs
docker compose logs -f

# Stop
docker compose down

# Rebuild after code changes
docker compose up -d --build

# Reset database (destructive — deletes all data)
docker compose down -v
docker compose up -d
```

### Changing the port

Edit `docker-compose.yml` and change `"3000:3000"` to e.g. `"8080:3000"` to expose on port 8080.

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLite file path | `file:./prisma/dev.db` |
| `NEXTAUTH_SECRET` | Auth signing secret (min 32 chars) | — |
| `NEXTAUTH_URL` | Full URL where the app is running | `http://localhost:3000` |

---

## Tech Stack

- **Next.js 16** · React 18 · TypeScript
- **Prisma ORM** · SQLite
- **NextAuth** · Credentials authentication
- **Tailwind CSS** · Radix UI

---

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run setup        # Migrate DB + seed demo data (first-time setup)
npm run prisma:seed  # Seed demo data
npm run prisma:studio # Open Prisma Studio (DB browser)
```

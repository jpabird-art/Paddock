# Deploying Paddock on Railway

Paddock runs as one codebase in two roles, chosen by `PADDOCK_SITE_MODE`:

| Mode | What it serves | Typical domain |
|---|---|---|
| `marketing` | Public site: home, capabilities, contact, portal | `paddock.app` |
| `tenant` | A single customer's application, behind sign-in | `<customer>.paddock.app` |

A marketing deployment never exposes the application; a tenant deployment
redirects the public routes straight to `/dashboard`. One repository, one
image, different environment variables. There is no need to fork the code per
customer.

---

## 1. The marketing service

Create a Railway service from this repository. It needs no database of its own,
but `DATABASE_URL` is still validated at boot, so point it at any reachable
PostgreSQL instance (a small shared one is fine) or a throwaway Railway
Postgres.

```
PADDOCK_SITE_MODE=marketing
PADDOCK_PORTAL_DOMAIN=paddock.app
PADDOCK_CONTACT_EMAIL=hello@paddock.app
PADDOCK_CONTACT_PHONE=+44 20 7946 0000
PADDOCK_CONTACT_ADDRESS=London, United Kingdom
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://paddock.app
DATABASE_URL=<postgres connection string>
```

To send contact enquiries by email rather than returning a "please email us"
message, also set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and
`SMTP_FROM`.

Optionally publish a directory of customers on the portal page:

```
PADDOCK_TENANT_DIRECTORY=greenacre:Greenacre Stud,oakfield:Oakfield Equine
```

Or, for full control of each URL:

```
PADDOCK_TENANT_DIRECTORY=[{"slug":"greenacre","name":"Greenacre Stud","url":"https://greenacre.paddock.app/login"}]
```

Leave it empty and the portal still works: a customer types their short name
and is sent to `https://<slug>.paddock.app/login`.

---

## 2. A tenant service, per customer

For each customer, in a Railway project of their own:

1. **Add PostgreSQL.** Railway's plugin gives you `DATABASE_URL`.
2. **Add a service from this repository.** It builds from `Dockerfile`; the
   container runs `prisma migrate deploy` before starting, so the schema is
   created on first boot.
3. **Set the environment:**

   ```
   PADDOCK_SITE_MODE=tenant
   PADDOCK_ORG_NAME=Greenacre Stud
   NEXTAUTH_SECRET=<a fresh openssl rand -base64 32 per customer>
   NEXTAUTH_URL=https://greenacre.paddock.app
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

4. **Add the domain.** In Railway, add `greenacre.paddock.app` to the service
   and point a CNAME at the target Railway gives you. A wildcard
   `*.paddock.app` CNAME at the DNS level saves a step per customer.
5. **Create the first administrator:**

   ```
   BOOTSTRAP_ADMIN_NAME="Jane Smith" \
   BOOTSTRAP_ADMIN_SERVICE_NUMBER=ADMIN001 \
   BOOTSTRAP_ADMIN_EMAIL=jane@greenacre.example \
   BOOTSTRAP_ADMIN_PASSWORD='<a long random password>' \
   npm run bootstrap
   ```

   Run it from `railway run` against the service, or set the variables in
   Railway and run the command once from the service shell. The script refuses
   to run if users already exist, and refuses passwords under 12 characters.
   Everything else — staff accounts, locations, horses — is created inside the
   application.

Give every customer their own `NEXTAUTH_SECRET` and their own database. A
tenant service shares nothing with any other tenant except the image it was
built from.

---

## Why not one multi-tenant database?

The schema has no tenant column, and adding one would put the burden of
isolation on every query in the codebase. A deployment per customer gets
isolation from the infrastructure instead: a mistake in application code cannot
leak one yard's horses into another's. The cost is one Railway service and one
database per customer, plus a deploy to roll an upgrade out to each.

If the customer count grows past the point where that is comfortable, the move
to shared multi-tenancy is a schema migration plus query scoping, and the
portal, branding and site-mode plumbing here stay as they are.

---

## Upgrades

Tenant services deploy from the same branch. Roll a release out by redeploying
each tenant service; migrations run automatically at container start. Take a
database dump before any release that carries a destructive migration:

```bash
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql
```

---

## Deleting data

`npm run purge` permanently deletes every horse and all dependent records. It
requires an explicit confirmation string and, optionally, flags to extend the
purge to users, locations and tack:

```bash
PURGE_CONFIRM="DELETE ALL HORSE DATA" npm run purge

# also remove every user except one administrator
PURGE_CONFIRM="DELETE ALL HORSE DATA" PURGE_USERS=1 KEEP_SERVICE_NUMBER=ADMIN001 npm run purge
```

There is no undo. Take a dump first.

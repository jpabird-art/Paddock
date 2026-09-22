# Launch readiness

Status at 22 September 2026. These are fictional demonstration environments.

## Domain and deployment decisions

The owner controls `paddock-ltd.com` through GoDaddy. The public website is
`https://www.paddock-ltd.com`; customer applications use
`https://<customer>.paddock-ltd.com`. Each customer has a separate Railway
project, PostgreSQL database, upload volume and authentication secret, with
individual staff accounts inside that deployment. Keep one GitHub repository.

Cairnhead Racing Yard and Canswell Farm are deployed at their respective
`cairnhead` and `canswell` subdomains. Each has five fictional staff accounts,
four horses, three locations and sample activity. The public portal directory
points to both branded sign-in URLs. GoDaddy has the customer CNAME and
verification TXT records. A permanent root-domain redirect to the `www` site
is configured; provider DNS/SSL propagation can take time.

Live checks passed for ten staff logins, dashboards, role permissions,
cross-customer record rejection, forged cross-customer session rejection and
cross-customer file rejection. Uploaded test files are also checked across
releases. Credentials are delivered privately and never committed.

## Security maintenance

Upgrade Next.js and NextAuth within their current major versions, refresh the
lockfile, and move Docker and CI to Node.js 24 LTS. Remove the unused Prisma
authentication adapter, spreadsheet parser and React Vite plugin. At this
revision's local check, `npm audit` reports zero known vulnerabilities; CI
blocks high/critical advisories. This does not establish that the entire
application is free of security defects.

The application sends mail through Nodemailer 10. NextAuth is configured only
with the credentials provider, not its optional email provider. Its optional
Nodemailer peer is overridden to the application's version to avoid retaining
the vulnerable 7.x package. A local SMTP integration test checks actual message
delivery with the upgraded transport. File and URL content access are disabled.
Review this override if enabling NextAuth's email provider in future.

## Remaining acceptance work

- Choose and configure a real enquiry mailbox and email-delivery provider.
  Verify invitations and password recovery with approved recipients. Until
  then, the public site offers only configured contact methods and does not
  publish an invented mailbox or show an unusable enquiry form.
- Railway's backup schedule mutation returned `Not Authorized`. Scheduled
  backups have not been enabled by this change. The owner must resolve the
  account/plan permission and enable schedules for each database and upload
  volume. Verify retention and monitoring; do not treat persistence as a backup.
- Logical database/file recovery checks are separate from a full Railway
  project-loss or provider-volume restore drill. Complete that drill and retain
  an independent encrypted backup before real customer use.
- Establish uptime/error alerts, backup failure alerts, a spending budget and
  a staged pilot-release process. Automatic deployments remain enabled.
- Have the owner assess racing-yard/farm terminology, mobile workflows and
  concurrent editing beyond horse-record stale-edit detection.

## Commercial pilot

Before inviting a real organisation, agree a named pilot administrator, scope,
price, start/end dates, onboarding/import responsibilities and support
boundaries. Record adoption and support time during the pilot. Establish a
payment method and obtain an actual payment before marking first revenue.
Compare revenue with hosting, storage, email, payment and support costs before
claiming a profitable customer. No prices or customer commitments are implied
by these technical deployments.

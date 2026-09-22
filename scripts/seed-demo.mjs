import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';

const demos = {
  cairnhead: { name: 'Cairnhead Racing Yard', horses: ['Cairnhead Comet', 'Heather Sprint', 'Northern Promise', 'Silver Bracken'], locations: ['Main yard', 'Training gallop', 'Rest paddock'] },
  canswell: { name: 'Canswell Farm', horses: ['Canswell Willow', 'Meadow Fox', 'Orchard Belle', 'Amber Brook'], locations: ['Stable block', 'School', 'South paddock'] },
};
const slug = process.env.PADDOCK_TENANT_SLUG;
const demo = demos[slug];
const output = process.env.DEMO_CREDENTIAL_FILE;
if (!demo || process.env.PADDOCK_DEMO !== 'true' || process.env.PADDOCK_SITE_MODE !== 'tenant' || process.env.DEMO_SEED_CONFIRM !== `SEED ${slug}` || !output) {
  throw new Error('Requires tenant mode, PADDOCK_DEMO=true, a supported PADDOCK_TENANT_SLUG, DEMO_SEED_CONFIRM="SEED <slug>" and DEMO_CREDENTIAL_FILE. Only use a new demo database.');
}
if (process.env.PADDOCK_ORG_NAME !== demo.name) throw new Error('Organisation name must match the demo slug');
const destination = path.resolve(output);
const uploads = path.resolve(process.env.UPLOAD_DIR ?? 'uploads');
if (destination === uploads || destination.startsWith(uploads + path.sep) || destination.startsWith(path.resolve('public') + path.sep)) throw new Error('Credentials must be stored outside publicly accessible or uploaded files');
const prisma = new PrismaClient();
const roles = ['ADMIN', 'OFFICER', 'TROOPER', 'VET', 'FARRIER'];
const names = ['Alex Demo', 'Morgan Demo', 'Robin Demo', 'Sam Demo', 'Taylor Demo'];
const credentials = await Promise.all(roles.map(async (role, i) => {
  const password = randomBytes(24).toString('base64url');
  return { name: names[i], role, username: `${slug.toUpperCase()}-${role}`, email: `${role.toLowerCase()}@${slug}.example.invalid`, password, passwordHash: await bcrypt.hash(password, 12) };
}));
let fileCreated = false;
try {
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(72844903)`;
    const models = Object.entries(tx).filter(([name, value]) => name !== 'auditLog' && value && typeof value.count === 'function');
    for (const [, model] of models) if (await model.count() !== 0) throw new Error('Refusing to seed a non-empty database');
    // Visiting a fresh demo and trying to sign in can create anonymous failure
    // audits before accounts exist. Preserve these; all other history blocks seeding.
    const existingHistory = await tx.auditLog.count({ where: { NOT: { entityType: 'auth', action: 'login_failed', userId: null } } });
    if (existingHistory !== 0) throw new Error('Refusing to seed a database with existing application history');
    // Exclusive creation: never overwrite a credential file or print credentials in logs.
    await writeFile(destination, JSON.stringify({ organisation: demo.name, accounts: credentials.map(({ passwordHash, ...account }) => account) }, null, 2), { flag: 'wx', mode: 0o600 });
    fileCreated = true;
    const users = [];
    for (const { username, password, ...account } of credentials) users.push(await tx.user.create({ data: { ...account, serviceNumber: username } }));
    const locations = [];
    for (const [i, name] of demo.locations.entries()) locations.push(await tx.location.create({ data: { name, code: `${slug.toUpperCase()}-${i + 1}` } }));
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    for (const [i, name] of demo.horses.entries()) {
      const horse = await tx.horse.create({ data: { name, regimentalNumber: `${slug.toUpperCase()}-${i + 1}`, breed: slug === 'cairnhead' ? 'Thoroughbred' : 'Irish Sport Horse', colour: i % 2 ? 'Bay' : 'Chestnut', dateOfBirth: new Date('2020-04-10'), serviceEntryDate: today, heightHands: 16.1, weightKg: 520, maxRiderWeightKg: 85, currentLocationId: locations[i % locations.length].id, sex: i % 2 ? 'MARE' : 'GELDING' } });
      await tx.healthNote.create({ data: { horseId: horse.id, authorId: users[3].id, content: 'Fictional demonstration record. Replace with verified information before using this system for real horses.' } });
      await tx.healthEvent.create({ data: { horseId: horse.id, type: 'VET_CHECKUP', scheduledAt: new Date(today.getTime() + 7 * 86400000), status: 'SCHEDULED', notes: 'Demonstration appointment' } });
      await tx.exerciseAssignment.create({ data: { horseId: horse.id, riderId: users[2].id, assignedById: users[1].id, exerciseName: slug === 'cairnhead' ? 'Training session' : 'Schooling', date: today, timeSlot: `${String(8 + i).padStart(2, "0")}00`, duration: 30, notes: 'Fictional demo activity' } });
      await tx.farrierRecord.create({ data: { horseId: horse.id, createdById: users[4].id, serviceDate: today, farrierName: users[4].name, notes: 'Fictional demonstration entry' } });
    }
    await tx.auditLog.create({ data: { entityType: 'demo', entityId: slug, action: 'seed', metadata: { fictional: true } } });
  }, { timeout: 30000 });
  console.log(`Created ${demo.name}: 5 staff, 4 horses, 3 locations and demo activity. Credentials saved privately to the requested file. No emails sent.`);
} catch (error) {
  if (fileCreated) await unlink(destination);
  throw error;
} finally { await prisma.$disconnect(); }

import { prisma } from "@/lib/prisma";
import { sendEmail, emailEnabled } from "@/lib/email";
import { format } from "date-fns";

/**
 * Notify a rider about their exercise assignment.
 * Creates an in-app notification and sends an email if SMTP is configured.
 */
export async function notifyRider(exerciseAssignmentId: string): Promise<void> {
  const assignment = await prisma.exerciseAssignment.findUnique({
    where: { id: exerciseAssignmentId },
    include: {
      horse: { select: { name: true, regimentalNumber: true } },
      rider: { select: { id: true, email: true, name: true } },
      assignedBy: { select: { name: true, rank: true } },
    },
  });

  if (!assignment) return;

  // Create in-app notification
  await prisma.exerciseNotification.create({
    data: {
      exerciseAssignmentId,
      recipientId: assignment.rider.id,
    },
  });

  if (!emailEnabled) return;

  const dateStr = format(new Date(assignment.date), "dd MMM yyyy");
  const timeStr = `${assignment.timeSlot.slice(0, 2)}:${assignment.timeSlot.slice(2)}`;
  const assignedByName = assignment.assignedBy.rank
    ? `${assignment.assignedBy.rank} ${assignment.assignedBy.name}`
    : assignment.assignedBy.name;

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const boardUrl = `${appUrl}/riding-board?date=${format(new Date(assignment.date), "yyyy-MM-dd")}`;

  const subject = `[PADDOCK] Riding Assignment — ${assignment.horse.name} (${dateStr})`;

  const text = [
    `RIDING ASSIGNMENT — ${assignment.horse.name} (${assignment.horse.regimentalNumber})`,
    "",
    `Exercise: ${assignment.exerciseName}`,
    `Date: ${dateStr}`,
    `Time: ${timeStr}`,
    assignment.duration ? `Duration: ${assignment.duration} mins` : null,
    "",
    `Assigned by: ${assignedByName}`,
    assignment.notes ? `Notes: ${assignment.notes}` : null,
    "",
    `View Riding Board: ${boardUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: -apple-system, Arial, sans-serif; max-width: 600px;">
      <div style="background: #1a2744; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">Riding Assignment — ${assignment.horse.name}</h2>
        <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">${assignment.horse.regimentalNumber}</p>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 120px;">Exercise</td>
            <td style="padding: 8px 0; font-weight: 600;">${assignment.exerciseName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Date</td>
            <td style="padding: 8px 0;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Time</td>
            <td style="padding: 8px 0;">${timeStr}</td>
          </tr>
          ${assignment.duration ? `<tr><td style="padding: 8px 0; color: #6b7280;">Duration</td><td style="padding: 8px 0;">${assignment.duration} mins</td></tr>` : ""}
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Assigned by</td>
            <td style="padding: 8px 0;">${assignedByName}</td>
          </tr>
          ${assignment.notes ? `<tr><td style="padding: 8px 0; color: #6b7280;">Notes</td><td style="padding: 8px 0;">${assignment.notes}</td></tr>` : ""}
        </table>
        <div style="margin-top: 20px;">
          <a href="${boardUrl}" style="display: inline-block; background: #1a2744; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
            View Riding Board
          </a>
        </div>
      </div>
    </div>
  `.trim();

  await sendEmail({ to: assignment.rider.email, subject, text, html });
}

/**
 * Notify multiple riders about their exercise assignments (bulk).
 */
export async function notifyRiders(assignmentIds: string[]): Promise<void> {
  if (assignmentIds.length === 0) return;

  const assignments = await prisma.exerciseAssignment.findMany({
    where: { id: { in: assignmentIds } },
    include: {
      horse: { select: { name: true, regimentalNumber: true } },
      rider: { select: { id: true, email: true, name: true } },
      assignedBy: { select: { name: true, rank: true } },
    },
  });

  if (assignments.length === 0) return;

  // Create in-app notifications in bulk
  await prisma.exerciseNotification.createMany({
    data: assignments.map((a) => ({
      exerciseAssignmentId: a.id,
      recipientId: a.rider.id,
    })),
  });

  if (!emailEnabled) return;

  // Send individual emails
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  for (const assignment of assignments) {
    const dateStr = format(new Date(assignment.date), "dd MMM yyyy");
    const timeStr = `${assignment.timeSlot.slice(0, 2)}:${assignment.timeSlot.slice(2)}`;
    const boardUrl = `${appUrl}/riding-board?date=${format(new Date(assignment.date), "yyyy-MM-dd")}`;

    const subject = `[PADDOCK] Riding Assignment — ${assignment.horse.name} (${dateStr})`;
    const text = `You have been assigned to ride ${assignment.horse.name} (${assignment.horse.regimentalNumber}) for ${assignment.exerciseName} at ${timeStr} on ${dateStr}.\n\nView Riding Board: ${boardUrl}`;

    await sendEmail({ to: assignment.rider.email, subject, text });
  }
}

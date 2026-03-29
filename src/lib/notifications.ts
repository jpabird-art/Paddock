import { prisma } from "@/lib/prisma";
import { sendEmail, emailEnabled } from "@/lib/email";

export async function notifyVets(injuryReportId: string): Promise<void> {
  const recipients = await prisma.user.findMany({
    where: {
      role: { in: ["VET", "ADMIN"] },
      isActive: true,
    },
    select: { id: true, email: true, name: true },
  });

  if (recipients.length === 0) return;

  // Create in-app notification records
  await prisma.injuryNotification.createMany({
    data: recipients.map((user) => ({
      injuryReportId,
      recipientId: user.id,
    })),
  });

  // Send email notifications if SMTP is configured
  if (!emailEnabled) return;

  const injury = await prisma.injuryReport.findUnique({
    where: { id: injuryReportId },
    include: {
      horse: { select: { name: true, regimentalNumber: true } },
      reportedBy: { select: { name: true, rank: true } },
    },
  });

  if (!injury) return;

  const severityLabel = injury.severity.charAt(0) + injury.severity.slice(1).toLowerCase();
  const emails = recipients.map((r) => r.email).filter(Boolean);

  if (emails.length === 0) return;

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const injuryUrl = `${appUrl}/injuries/${injuryReportId}`;

  const subject = `[PADDOCK] ${severityLabel} Injury — ${injury.horse.name} (${injury.horse.regimentalNumber})`;

  const text = [
    `INJURY REPORT — ${injury.horse.name} (${injury.horse.regimentalNumber})`,
    "",
    `Severity: ${severityLabel}`,
    `Body Location: ${injury.bodyLocation}`,
    `Description: ${injury.description}`,
    "",
    `Reported by: ${injury.reportedBy.rank ? injury.reportedBy.rank + " " : ""}${injury.reportedBy.name}`,
    `Time: ${injury.reportedAt.toLocaleString("en-GB", { timeZone: "Europe/London" })}`,
    "",
    `View in Paddock: ${injuryUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family: -apple-system, Arial, sans-serif; max-width: 600px;">
      <div style="background: #1a2744; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">Injury Report — ${injury.horse.name}</h2>
        <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">${injury.horse.regimentalNumber}</p>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 120px;">Severity</td>
            <td style="padding: 8px 0; font-weight: 600; color: ${
              injury.severity === "SEVERE" ? "#dc2626" : injury.severity === "MODERATE" ? "#ea580c" : "#ca8a04"
            };">${severityLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Body Location</td>
            <td style="padding: 8px 0;">${injury.bodyLocation}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Description</td>
            <td style="padding: 8px 0;">${injury.description}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Reported by</td>
            <td style="padding: 8px 0;">${injury.reportedBy.rank ? injury.reportedBy.rank + " " : ""}${injury.reportedBy.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Time</td>
            <td style="padding: 8px 0;">${injury.reportedAt.toLocaleString("en-GB", { timeZone: "Europe/London" })}</td>
          </tr>
        </table>
        <div style="margin-top: 20px;">
          <a href="${injuryUrl}" style="display: inline-block; background: #1a2744; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
            View in Paddock
          </a>
        </div>
      </div>
    </div>
  `.trim();

  await sendEmail({ to: emails, subject, text, html });
}

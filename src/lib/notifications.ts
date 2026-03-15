import { prisma } from "@/lib/prisma";

export async function notifyVets(injuryReportId: string): Promise<void> {
  const recipients = await prisma.user.findMany({
    where: {
      role: { in: ["VET", "ADMIN"] },
      isActive: true,
    },
    select: { id: true },
  });

  if (recipients.length === 0) return;

  await prisma.injuryNotification.createMany({
    data: recipients.map((user) => ({
      injuryReportId,
      recipientId: user.id,
    })),
  });
}

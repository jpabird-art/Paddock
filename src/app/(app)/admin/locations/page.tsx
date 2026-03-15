import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LocationsClient } from "@/components/admin/LocationsClient";

export default async function LocationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "OFFICER"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });

  return <LocationsClient locations={locations} />;
}

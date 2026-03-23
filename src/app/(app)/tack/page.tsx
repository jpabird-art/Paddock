import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { TackItemsTable } from "@/components/tack/TackItemsTable";

export default async function TackPage() {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "tack_item", "view")) {
    redirect("/dashboard");
  }

  const role = session.user.role;
  const canCreate = can(role, "tack_item", "create");
  const canEdit = can(role, "tack_item", "update");
  const canDelete = can(role, "tack_item", "delete");

  const items = await prisma.tackItem.findMany({
    where: { isActive: true },
    include: {
      allocations: {
        where: { endDate: null },
        include: {
          horse: { select: { id: true, name: true, regimentalNumber: true } },
        },
        take: 1,
      },
    },
    orderBy: [{ type: "asc" }, { identifier: "asc" }],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tack & Equipment</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {items.length} item{items.length !== 1 ? "s" : ""} in inventory
        </p>
      </div>

      <TackItemsTable
        items={items.map((item) => ({
          id: item.id,
          type: item.type,
          identifier: item.identifier,
          brand: item.brand,
          condition: item.condition,
          notes: item.notes,
          allocations: item.allocations.map((a) => ({
            horse: a.horse,
          })),
        }))}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}

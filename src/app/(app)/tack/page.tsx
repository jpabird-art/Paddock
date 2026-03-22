import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";

const CONDITION_CLASSES: Record<string, string> = {
  SERVICEABLE: "bg-green-100 text-green-700 border-green-200",
  UNSERVICEABLE: "bg-red-100 text-red-700 border-red-200",
  REPAIR_NEEDED: "bg-amber-100 text-amber-700 border-amber-200",
};

export default async function TackPage() {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "tack_item", "view")) {
    redirect("/dashboard");
  }

  const canCreate = can(session.user.role, "tack_item", "create");

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tack & Equipment</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length} item{items.length !== 1 ? "s" : ""} in inventory
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Identifier</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Brand</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Condition</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Allocated To</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-10">
                  No tack items found.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const allocation = item.allocations[0];
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-gray-800">
                      {item.identifier}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.type.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.brand ?? "\u2014"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                          CONDITION_CLASSES[item.condition] ?? "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {item.condition.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {allocation ? (
                        <Link
                          href={`/horses/${allocation.horse.id}`}
                          className="text-[#1a2744] hover:underline font-medium text-xs"
                        >
                          {allocation.horse.name}
                          <span className="text-gray-400 font-mono ml-1">
                            {allocation.horse.regimentalNumber}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Unallocated</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

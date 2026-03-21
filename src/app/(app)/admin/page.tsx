import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { CreateUserForm } from "@/components/admin/CreateUserForm";
import { EditUserForm } from "@/components/admin/EditUserForm";
import { UserToggleActive } from "@/components/admin/UserToggleActive";
import { rankAbbreviation } from "@/lib/ranks";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  VET: "Veterinary",
  OFFICER: "Officer",
  TROOPER: "Trooper",
};

const ROLE_COLOURS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700 border-red-200",
  VET: "bg-emerald-100 text-emerald-700 border-emerald-200",
  OFFICER: "bg-blue-100 text-blue-700 border-blue-200",
  TROOPER: "bg-gray-100 text-gray-700 border-gray-200",
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      serviceNumber: true,
      email: true,
      role: true,
      rank: true,
      squadron: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            User management — {users.length} user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateUserForm />
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Rank</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Service No.</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">System Role</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Joined</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className={user.isActive ? "" : "opacity-50 bg-gray-50"}>
                <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                <td className="px-4 py-3">
                  {user.rank ? (
                    <span className="text-xs font-mono font-semibold text-[#1a2744] bg-[#1a2744]/8 px-2 py-0.5 rounded">
                      {rankAbbreviation(user.rank)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-sm text-gray-600">
                  {user.serviceNumber}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                      ROLE_COLOURS[user.role] ?? "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                      user.isActive
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {format(new Date(user.createdAt), "dd MMM yyyy")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <EditUserForm
                      user={{
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        rank: user.rank,
                        squadron: user.squadron,
                      }}
                    />
                    <UserToggleActive
                      userId={user.id}
                      isActive={user.isActive}
                      userName={user.name}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

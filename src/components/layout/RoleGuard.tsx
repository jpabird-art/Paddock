"use client";

import { useSession } from "next-auth/react";

interface RoleGuardProps {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { data: session } = useSession();

  if (!session?.user) return <>{fallback}</>;
  if (!roles.includes(session.user.role)) return <>{fallback}</>;

  return <>{children}</>;
}

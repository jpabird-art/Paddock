"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Shield,
  LayoutDashboard,
  Stethoscope,
  Calendar,
  AlertTriangle,
  Users,
  LogOut,
  Truck,
  MapPin,
  Wrench,
  ClipboardCheck,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  VET: "Veterinary",
  OFFICER: "Officer",
  TROOPER: "Trooper",
};

const ROLE_BADGE_COLOURS: Record<string, string> = {
  ADMIN: "bg-red-500 text-white",
  VET: "bg-emerald-500 text-white",
  OFFICER: "bg-blue-500 text-white",
  TROOPER: "bg-gray-500 text-white",
};

interface MobileNavProps {
  user: {
    name?: string | null;
    role: string;
    serviceNumber: string;
  };
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "VET", "OFFICER", "TROOPER"] },
  { href: "/horses", label: "Horses", icon: Stethoscope, roles: ["ADMIN", "VET", "OFFICER", "TROOPER"] },
  { href: "/health", label: "Health Schedule", icon: Calendar, roles: ["ADMIN", "VET", "OFFICER", "TROOPER"] },
  { href: "/injuries", label: "Injury Reports", icon: AlertTriangle, roles: ["ADMIN", "VET", "OFFICER", "TROOPER"] },
  { href: "/moves", label: "Moves", icon: Truck, roles: ["ADMIN", "VET", "OFFICER", "TROOPER"] },
  { href: "/tack", label: "Tack & Equipment", icon: Wrench, roles: ["ADMIN", "OFFICER", "TROOPER"] },
  { href: "/inspections", label: "Inspections", icon: ClipboardCheck, roles: ["ADMIN", "VET", "OFFICER", "TROOPER"] },
  { href: "/admin", label: "Administration", icon: Users, roles: ["ADMIN"] },
  { href: "/admin/locations", label: "Locations", icon: MapPin, roles: ["ADMIN", "OFFICER"] },
];

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="flex lg:hidden items-center justify-between bg-[#1a2744] px-4 py-3">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="text-white p-1 -ml-1" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
        </SheetTrigger>
        <SheetContent className="bg-[#1a2744] border-r-white/10 p-0 w-72">
          {/* Logo */}
          <div className="px-6 py-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="bg-amber-400 rounded-full p-1.5 shrink-0">
                <Shield className="h-5 w-5 text-[#1a2744]" />
              </div>
              <div>
                <div className="text-white font-bold text-sm tracking-wide">HCMR FLEET</div>
                <div className="text-blue-300 text-xs">Horse Management</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-white/15 text-white font-medium"
                      : "text-blue-200 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-amber-400" : "text-blue-300"
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-white/10 px-4 py-4 mt-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/10 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">
                  {user.name?.charAt(0) ?? "U"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white text-sm font-medium truncate">{user.name}</div>
                <div className="text-blue-300 text-xs font-mono">{user.serviceNumber}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  ROLE_BADGE_COLOURS[user.role] ?? "bg-gray-500 text-white"
                )}
              >
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-1.5 text-blue-300 hover:text-white transition-colors text-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Centre title */}
      <div className="flex items-center gap-2">
        <div className="bg-amber-400 rounded-full p-1 shrink-0">
          <Shield className="h-4 w-4 text-[#1a2744]" />
        </div>
        <span className="text-white font-bold text-sm tracking-wide">HCMR FLEET</span>
      </div>

      {/* Spacer to balance hamburger */}
      <div className="w-6" />
    </div>
  );
}

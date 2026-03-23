"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { navItems, ROLE_LABELS, ROLE_BADGE_COLOURS } from "@/lib/nav-config";

interface MobileNavProps {
  user: {
    name?: string | null;
    role?: string | null;
    serviceNumber?: string | null;
  };
}

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const role = user.role ?? "TROOPER";
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

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
              <img src="/hcmr-logo.webp" alt="HCMR" className="h-9 w-auto shrink-0" />
              <div>
                <div className="text-white font-bold text-sm tracking-wide">Paddock</div>
                <div className="text-blue-300 text-xs">HCMR&apos;s Paddock</div>
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
                <div className="text-blue-300 text-xs font-mono">{user.serviceNumber ?? ""}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  ROLE_BADGE_COLOURS[role] ?? "bg-gray-500 text-white"
                )}
              >
                {ROLE_LABELS[role] ?? role}
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
        <img src="/hcmr-logo.webp" alt="HCMR" className="h-7 w-auto shrink-0" />
        <span className="text-white font-bold text-sm tracking-wide">Paddock</span>
      </div>

      {/* Spacer to balance hamburger */}
      <div className="w-6" />
    </div>
  );
}

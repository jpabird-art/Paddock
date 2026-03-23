import {
  LayoutDashboard,
  Swords,
  Calendar,
  AlertTriangle,
  Users,
  Truck,
  MapPin,
  Wrench,
  ClipboardCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "VET", "OFFICER", "TROOPER"] },
  { href: "/horses", label: "Horses", icon: Swords, roles: ["ADMIN", "VET", "OFFICER", "TROOPER"] },
  { href: "/health", label: "Health Schedule", icon: Calendar, roles: ["ADMIN", "VET", "OFFICER", "TROOPER"] },
  { href: "/injuries", label: "Injury Reports", icon: AlertTriangle, roles: ["ADMIN", "VET", "OFFICER", "TROOPER"] },
  { href: "/moves", label: "Moves", icon: Truck, roles: ["ADMIN", "VET", "OFFICER", "TROOPER"] },
  { href: "/tack", label: "Tack & Equipment", icon: Wrench, roles: ["ADMIN", "OFFICER", "TROOPER"] },
  { href: "/inspections", label: "Inspections", icon: ClipboardCheck, roles: ["ADMIN", "VET", "OFFICER", "TROOPER"] },
  { href: "/admin", label: "Administration", icon: Users, roles: ["ADMIN"] },
  { href: "/admin/locations", label: "Locations", icon: MapPin, roles: ["ADMIN", "OFFICER"] },
];

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  VET: "Veterinary",
  OFFICER: "Officer",
  TROOPER: "Trooper",
};

export const ROLE_BADGE_COLOURS: Record<string, string> = {
  ADMIN: "bg-red-500 text-white",
  VET: "bg-emerald-500 text-white",
  OFFICER: "bg-blue-500 text-white",
  TROOPER: "bg-gray-500 text-white",
};

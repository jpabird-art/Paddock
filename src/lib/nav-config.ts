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
  FileUp,
  Shield,
  CalendarDays,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "VET", "FARRIER", "OFFICER", "TROOPER"] },
  { href: "/horses", label: "Horses", icon: Swords, roles: ["ADMIN", "VET", "FARRIER", "OFFICER", "TROOPER"] },
  { href: "/riding-board", label: "Riding Board", icon: CalendarDays, roles: ["ADMIN", "VET", "FARRIER", "OFFICER", "TROOPER"] },
  { href: "/health", label: "Health Schedule", icon: Calendar, roles: ["ADMIN", "VET", "FARRIER", "OFFICER", "TROOPER"] },
  { href: "/injuries", label: "Injury Reports", icon: AlertTriangle, roles: ["ADMIN", "VET", "FARRIER", "OFFICER", "TROOPER"] },
  { href: "/moves", label: "Moves", icon: Truck, roles: ["ADMIN", "VET", "FARRIER", "OFFICER", "TROOPER"] },
  { href: "/moves/planner", label: "Location Planner", icon: MapPin, roles: ["ADMIN", "VET", "FARRIER", "OFFICER"] },
  { href: "/tack", label: "Tack & Equipment", icon: Wrench, roles: ["ADMIN", "OFFICER", "TROOPER"] },
  { href: "/inspections", label: "Inspections", icon: ClipboardCheck, roles: ["ADMIN", "VET", "FARRIER", "OFFICER", "TROOPER"] },
  { href: "/admin", label: "Administration", icon: Users, roles: ["ADMIN"] },
  { href: "/admin/locations", label: "Locations", icon: MapPin, roles: ["ADMIN", "OFFICER"] },
  { href: "/admin/animana", label: "Animana Import", icon: FileUp, roles: ["ADMIN", "VET"] },
  { href: "/security", label: "Security", icon: Shield, roles: ["ADMIN", "VET", "FARRIER", "OFFICER", "TROOPER"] },
];

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  VET: "Veterinary",
  FARRIER: "Farrier",
  OFFICER: "Officer",
  TROOPER: "Trooper",
};

export const ROLE_BADGE_COLOURS: Record<string, string> = {
  ADMIN: "bg-red-500 text-white",
  VET: "bg-emerald-500 text-white",
  FARRIER: "bg-amber-600 text-white",
  OFFICER: "bg-blue-500 text-white",
  TROOPER: "bg-gray-500 text-white",
};

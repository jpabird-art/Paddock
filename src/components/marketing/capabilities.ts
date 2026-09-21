import {
  AlertTriangle,
  CalendarDays,
  ClipboardCheck,
  FileUp,
  HeartPulse,
  Hammer,
  ShieldCheck,
  Truck,
  Utensils,
  Wrench,
  IdCard,
  History,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Capability {
  title: string;
  summary: string;
  detail: string[];
  icon: LucideIcon;
}

/** The capabilities the application actually ships. */
export const capabilities: Capability[] = [
  {
    title: "Horse records",
    summary: "Every horse, with the history that explains its condition today.",
    detail: [
      "Identity, breeding, age, sex and role held on one profile.",
      "Task readiness recorded against each horse and surfaced on the dashboard.",
      "Photographs, documents and scanned paperwork attached to the record.",
      "Full export to spreadsheet for reporting outside the system.",
    ],
    icon: IdCard,
  },
  {
    title: "Health scheduling",
    summary: "Dental, vaccination, worming and veterinary visits planned ahead.",
    detail: [
      "Recurring events generated on a schedule, not remembered by hand.",
      "Overdue and upcoming work shown against each horse and across the yard.",
      "Clinical notes recorded by veterinary staff and kept with the horse.",
      "Completion captured with the date, the person and the outcome.",
    ],
    icon: HeartPulse,
  },
  {
    title: "Injury reporting",
    summary: "Report from the yard, track to resolution.",
    detail: [
      "Severity, site and circumstances recorded at the point of discovery.",
      "Status workflow from report through treatment to resolution.",
      "Notifications to the people who need to act.",
      "Resolution notes retained so patterns can be read later.",
    ],
    icon: AlertTriangle,
  },
  {
    title: "Movements",
    summary: "Know where every horse is and who moved it.",
    detail: [
      "Location-to-location moves with driver, vehicle and crew.",
      "Group moves planned and updated together.",
      "Projected occupancy by location before a move is committed.",
      "Duty station history retained for every horse.",
    ],
    icon: Truck,
  },
  {
    title: "Exercise board",
    summary: "The daily and weekly riding board, built once and visible to all.",
    detail: [
      "Assignments by time slot across the working day.",
      "Bulk allocation for routine sessions.",
      "Weekly view for planning, daily view for the yard.",
      "Riders notified of their allocation and able to acknowledge it.",
    ],
    icon: CalendarDays,
  },
  {
    title: "Farriery",
    summary: "Shoeing and foot care on a proper cycle.",
    detail: [
      "Farrier records held against the horse with date and work done.",
      "A dedicated farrier role with its own permissions.",
      "Shoeing history available when lameness is investigated.",
    ],
    icon: Hammer,
  },
  {
    title: "Feeding and medication",
    summary: "What each horse is given, and on whose authority.",
    detail: [
      "Feeding plans by feed type and frequency.",
      "Medication records with route, dose and administering staff.",
      "Veterinary control over what may be prescribed and changed.",
    ],
    icon: Utensils,
  },
  {
    title: "Tack",
    summary: "Inventory and allocation, condition tracked.",
    detail: [
      "Tack items held by type with condition grading.",
      "Allocation of items to horses, with history.",
      "Condition changes visible before equipment fails in use.",
    ],
    icon: Wrench,
  },
  {
    title: "Inspections",
    summary: "Scheduled checks, recorded results.",
    detail: [
      "Inspection schedules defined per requirement.",
      "Results captured with pass, fail or remedial outcome.",
      "Inspection history attached to the horse.",
    ],
    icon: ClipboardCheck,
  },
  {
    title: "Roles and permissions",
    summary: "People see what their job requires and no more.",
    detail: [
      "Distinct roles for administrators, veterinary staff, farriers, supervisors and yard staff.",
      "Permissions applied per resource and per action, enforced in the API.",
      "Group-level filtering so staff work within their own section.",
    ],
    icon: ShieldCheck,
  },
  {
    title: "Audit trail",
    summary: "Before-and-after snapshots of every consequential change.",
    detail: [
      "Critical operations logged with the actor, the time and the change.",
      "Audit log viewer for administrators.",
      "Evidence available when a decision is questioned months later.",
    ],
    icon: History,
  },
  {
    title: "Imports and integration",
    summary: "Bring existing paperwork in rather than retyping it.",
    detail: [
      "Veterinary consultation PDFs parsed into structured health notes.",
      "Spreadsheet export of the full horse roster.",
      "A REST API behind the same permissions as the interface.",
    ],
    icon: FileUp,
  },
];

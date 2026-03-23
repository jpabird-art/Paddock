/**
 * Paddock — Formal Role-Based Access Control
 *
 * Defines exactly what each role can do across every resource and action.
 *
 * TROOPER  — view most records, create injury reports + health notes, update own injury reports
 * VET      — manage clinical records (health events, notes, medications, feeding plans), resolve injuries, create moves
 * OFFICER  — assign duties, approve moves, manage locations, create horses, manage tack/inspections/feeding/health events
 * ADMIN    — full access: users, locations, system config, plus everything above
 */

export type Role = "ADMIN" | "VET" | "OFFICER" | "TROOPER";

export type Resource =
  | "horse"
  | "health_event"
  | "health_note"
  | "injury_report"
  | "horse_move"
  | "location"
  | "user"
  | "duty_assignment"
  | "rider_assignment"
  | "feeding_plan"
  | "medication_record"
  | "tack_item"
  | "tack_allocation"
  | "inspection_schedule"
  | "inspection"
  | "attachment";

export type Action = "view" | "create" | "update" | "delete";

type PermissionMatrix = Record<Role, Record<Resource, Action[]>>;

const PERMISSIONS: PermissionMatrix = {
  ADMIN: {
    horse:               ["view", "create", "update", "delete"],
    health_event:        ["view", "create", "update", "delete"],
    health_note:         ["view", "create", "update", "delete"],
    injury_report:       ["view", "create", "update", "delete"],
    horse_move:          ["view", "create", "update", "delete"],
    location:            ["view", "create", "update", "delete"],
    user:                ["view", "create", "update", "delete"],
    duty_assignment:     ["view", "create", "update", "delete"],
    rider_assignment:    ["view", "create", "update", "delete"],
    feeding_plan:        ["view", "create", "update", "delete"],
    medication_record:   ["view", "create", "update", "delete"],
    tack_item:           ["view", "create", "update", "delete"],
    tack_allocation:     ["view", "create", "update", "delete"],
    inspection_schedule: ["view", "create", "update", "delete"],
    inspection:          ["view", "create", "update", "delete"],
    attachment:          ["view", "create", "update", "delete"],
  },

  OFFICER: {
    horse:               ["view", "create", "update"],
    health_event:        ["view", "create", "update"],
    health_note:         ["view", "create"],
    injury_report:       ["view", "create", "update"],
    horse_move:          ["view", "create", "update"],
    location:            ["view", "create", "update"],
    user:                ["view"],
    duty_assignment:     ["view", "create", "update"],
    rider_assignment:    ["view", "create", "update"],
    feeding_plan:        ["view", "create", "update"],
    medication_record:   ["view"],
    tack_item:           ["view", "create", "update"],
    tack_allocation:     ["view", "create", "update"],
    inspection_schedule: ["view", "create", "update"],
    inspection:          ["view", "create", "update"],
    attachment:          ["view", "create", "delete"],
  },

  VET: {
    horse:               ["view", "update"],
    health_event:        ["view", "create", "update"],
    health_note:         ["view", "create"],
    injury_report:       ["view", "create", "update"],
    horse_move:          ["view", "create"],
    location:            ["view"],
    user:                [],
    duty_assignment:     ["view"],
    rider_assignment:    ["view"],
    feeding_plan:        ["view", "create", "update"],
    medication_record:   ["view", "create", "update"],
    tack_item:           ["view"],
    tack_allocation:     ["view"],
    inspection_schedule: ["view"],
    inspection:          ["view", "create", "update"],
    attachment:          ["view", "create"],
  },

  TROOPER: {
    horse:               ["view"],
    health_event:        ["view"],
    health_note:         ["view", "create"],
    injury_report:       ["view", "create", "update"],
    horse_move:          ["view"],
    location:            ["view"],
    user:                [],
    duty_assignment:     ["view"],
    rider_assignment:    ["view"],
    feeding_plan:        ["view"],
    medication_record:   ["view"],
    tack_item:           ["view"],
    tack_allocation:     ["view"],
    inspection_schedule: ["view"],
    inspection:          ["view"],
    attachment:          ["view", "create"],
  },
};

/**
 * Check whether a role has a specific permission.
 */
export function can(role: string, resource: Resource, action: Action): boolean {
  const r = role as Role;
  if (!PERMISSIONS[r]) return false;
  return PERMISSIONS[r][resource]?.includes(action) ?? false;
}

/**
 * Get all allowed actions for a role on a resource.
 */
export function allowedActions(role: string, resource: Resource): Action[] {
  const r = role as Role;
  return PERMISSIONS[r]?.[resource] ?? [];
}

/**
 * Express server-side auth check. Returns session or error response.
 * Replaces the old requireRole() helper with permission-aware checks.
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requirePermission(resource: Resource, action: Action) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      error: NextResponse.json({ error: "Unauthorised" }, { status: 401 }),
      session: null,
    };
  }

  if (!can(session.user.role, resource, action)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * Simple auth check (any authenticated user). For read endpoints
 * where all roles have view access.
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      error: NextResponse.json({ error: "Unauthorised" }, { status: 401 }),
      session: null,
    };
  }

  return { error: null, session };
}

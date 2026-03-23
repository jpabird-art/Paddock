import { MoveStatus } from "@prisma/client";

/**
 * Valid state transitions for horse moves.
 *
 * PLANNED     → IN_TRANSIT, COMPLETED, CANCELLED
 * IN_TRANSIT  → COMPLETED, CANCELLED
 * COMPLETED   → (terminal)
 * CANCELLED   → (terminal)
 */
const VALID_TRANSITIONS: Record<MoveStatus, MoveStatus[]> = {
  PLANNED: [MoveStatus.IN_TRANSIT, MoveStatus.COMPLETED, MoveStatus.CANCELLED],
  IN_TRANSIT: [MoveStatus.COMPLETED, MoveStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

export function isValidTransition(from: MoveStatus, to: MoveStatus): boolean {
  if (from === to) return true; // no-op is always allowed
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminal(status: MoveStatus): boolean {
  return VALID_TRANSITIONS[status]?.length === 0;
}

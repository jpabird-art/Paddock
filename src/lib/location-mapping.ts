import { DutyStation } from "@prisma/client";

/**
 * Maps Location codes to DutyStation enum values.
 *
 * Only locations that correspond to a true duty station are listed.
 * Locations like Bell Equine Hospital, Grass, Working Livery, and DATR
 * are physical locations a horse may be moved to but are NOT duty stations,
 * so they do not appear here. Moving a horse to one of those locations
 * updates currentLocationId but leaves dutyStation unchanged.
 */
const LOCATION_TO_DUTY_STATION: Record<string, DutyStation> = {
  HPB: DutyStation.HYDE_PARK_BARRACKS,
  HCTW: DutyStation.TRAINING_WING,
  WTT: DutyStation.WINTER_TRAINING,
};

/**
 * Given a Location code, returns the corresponding DutyStation if one exists.
 * Returns null for locations that are not duty stations.
 */
export function locationToDutyStation(locationCode: string): DutyStation | null {
  return LOCATION_TO_DUTY_STATION[locationCode] ?? null;
}

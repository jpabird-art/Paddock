export const HC_RANKS = [
  // Officers
  { code: "COLONEL",           label: "Colonel",                        abbreviation: "Col",    defaultRole: "OFFICER" },
  { code: "LIEUTENANT_COLONEL",label: "Lieutenant Colonel",             abbreviation: "Lt Col", defaultRole: "OFFICER" },
  { code: "MAJOR",             label: "Major",                          abbreviation: "Maj",    defaultRole: "OFFICER" },
  { code: "CAPTAIN",           label: "Captain",                        abbreviation: "Capt",   defaultRole: "OFFICER" },
  { code: "LIEUTENANT",        label: "Lieutenant",                     abbreviation: "Lt",     defaultRole: "OFFICER" },
  { code: "SECOND_LIEUTENANT", label: "Second Lieutenant",              abbreviation: "2Lt",    defaultRole: "OFFICER" },
  // Warrant Officers & Senior NCOs
  { code: "RCM",               label: "Regimental Corporal Major",      abbreviation: "RCM",    defaultRole: "OFFICER" },
  { code: "SCM",               label: "Squadron Corporal Major",        abbreviation: "SCM",    defaultRole: "OFFICER" },
  { code: "STAFF_CORPORAL",    label: "Staff Corporal",                 abbreviation: "SCpl",   defaultRole: "OFFICER" },
  { code: "COH",               label: "Corporal of Horse",              abbreviation: "CoH",    defaultRole: "OFFICER" },
  { code: "LCOH",              label: "Lance Corporal of Horse",        abbreviation: "LCoH",   defaultRole: "TROOPER" },
  { code: "LCPL",              label: "Lance Corporal",                 abbreviation: "LCpl",   defaultRole: "TROOPER" },
  { code: "TROOPER",           label: "Trooper",                        abbreviation: "Tpr",    defaultRole: "TROOPER" },
  // Farrier ranks
  { code: "FARRIER_SCPL",      label: "Farrier Staff Corporal",         abbreviation: "FSCpl",  defaultRole: "VET" },
  { code: "FARRIER_COH",       label: "Farrier Corporal of Horse",      abbreviation: "FCoH",   defaultRole: "VET" },
  { code: "FARRIER_LCOH",      label: "Farrier Lance Corporal of Horse",abbreviation: "FLCoH",  defaultRole: "VET" },
  { code: "FARRIER_LCPL",      label: "Farrier Lance Corporal",         abbreviation: "FLCpl",  defaultRole: "VET" },
] as const;

export type HCRankCode = (typeof HC_RANKS)[number]["code"];

export function getRank(code: string) {
  return HC_RANKS.find((r) => r.code === code);
}

export function rankLabel(code: string) {
  return getRank(code)?.label ?? code;
}

export function rankAbbreviation(code: string) {
  return getRank(code)?.abbreviation ?? code;
}

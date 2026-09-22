"use client";
import { createContext, useContext } from "react";
const MilitaryContext = createContext(false);
export function OrganisationProfile({ military, children }: { military: boolean; children: React.ReactNode }) {
  return <MilitaryContext.Provider value={military}>{children}</MilitaryContext.Provider>;
}
export function useMilitaryProfile() { return useContext(MilitaryContext); }
export function LegacyFields({ children }: { children: React.ReactNode }) {
  return useContext(MilitaryContext) ? <>{children}</> : null;
}

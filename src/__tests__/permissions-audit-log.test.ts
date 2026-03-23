import { describe, it, expect } from "vitest";
import { can } from "@/lib/permissions";

describe("audit_log permissions", () => {
  it("ADMIN can view audit logs", () => {
    expect(can("ADMIN", "audit_log", "view")).toBe(true);
  });

  it("OFFICER cannot view audit logs", () => {
    expect(can("OFFICER", "audit_log", "view")).toBe(false);
  });

  it("VET cannot view audit logs", () => {
    expect(can("VET", "audit_log", "view")).toBe(false);
  });

  it("TROOPER cannot view audit logs", () => {
    expect(can("TROOPER", "audit_log", "view")).toBe(false);
  });

  it("no role can create/update/delete audit logs", () => {
    for (const role of ["ADMIN", "OFFICER", "VET", "TROOPER"] as const) {
      expect(can(role, "audit_log", "create")).toBe(false);
      expect(can(role, "audit_log", "update")).toBe(false);
      expect(can(role, "audit_log", "delete")).toBe(false);
    }
  });
});

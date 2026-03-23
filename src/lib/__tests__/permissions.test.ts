import { describe, it, expect } from "vitest";
import { can, allowedActions } from "../permissions";

describe("can()", () => {
  it("ADMIN has full access to all resources", () => {
    expect(can("ADMIN", "horse", "view")).toBe(true);
    expect(can("ADMIN", "horse", "create")).toBe(true);
    expect(can("ADMIN", "horse", "update")).toBe(true);
    expect(can("ADMIN", "horse", "delete")).toBe(true);
    expect(can("ADMIN", "user", "create")).toBe(true);
  });

  it("TROOPER can view horses but not create", () => {
    expect(can("TROOPER", "horse", "view")).toBe(true);
    expect(can("TROOPER", "horse", "create")).toBe(false);
    expect(can("TROOPER", "horse", "update")).toBe(false);
    expect(can("TROOPER", "horse", "delete")).toBe(false);
  });

  it("TROOPER can create and update injury reports", () => {
    expect(can("TROOPER", "injury_report", "view")).toBe(true);
    expect(can("TROOPER", "injury_report", "create")).toBe(true);
    expect(can("TROOPER", "injury_report", "update")).toBe(true);
    expect(can("TROOPER", "injury_report", "delete")).toBe(false);
  });

  it("VET can manage health events and medications", () => {
    expect(can("VET", "health_event", "create")).toBe(true);
    expect(can("VET", "health_event", "update")).toBe(true);
    expect(can("VET", "medication_record", "create")).toBe(true);
    expect(can("VET", "feeding_plan", "create")).toBe(true);
  });

  it("VET cannot manage users", () => {
    expect(can("VET", "user", "view")).toBe(false);
    expect(can("VET", "user", "create")).toBe(false);
  });

  it("OFFICER can create horses and manage duty assignments", () => {
    expect(can("OFFICER", "horse", "create")).toBe(true);
    expect(can("OFFICER", "duty_assignment", "create")).toBe(true);
    expect(can("OFFICER", "rider_assignment", "create")).toBe(true);
  });

  it("OFFICER cannot delete horses", () => {
    expect(can("OFFICER", "horse", "delete")).toBe(false);
  });

  it("returns false for unknown role", () => {
    expect(can("UNKNOWN", "horse", "view")).toBe(false);
  });

  it("TROOPER can view and create attachments", () => {
    expect(can("TROOPER", "attachment", "view")).toBe(true);
    expect(can("TROOPER", "attachment", "create")).toBe(true);
    expect(can("TROOPER", "attachment", "delete")).toBe(false);
  });
});

describe("allowedActions()", () => {
  it("returns all actions for ADMIN on any resource", () => {
    expect(allowedActions("ADMIN", "horse")).toEqual(["view", "create", "update", "delete"]);
  });

  it("returns view-only for TROOPER on horses", () => {
    expect(allowedActions("TROOPER", "horse")).toEqual(["view"]);
  });

  it("returns empty array for unknown role", () => {
    expect(allowedActions("UNKNOWN", "horse")).toEqual([]);
  });
});

import { describe, it, expect } from "vitest";
import { isValidTransition, isTerminal } from "@/lib/move-transitions";

describe("move state transitions", () => {
  it("PLANNED → IN_TRANSIT is valid", () => {
    expect(isValidTransition("PLANNED", "IN_TRANSIT")).toBe(true);
  });

  it("PLANNED → COMPLETED is valid", () => {
    expect(isValidTransition("PLANNED", "COMPLETED")).toBe(true);
  });

  it("PLANNED → CANCELLED is valid", () => {
    expect(isValidTransition("PLANNED", "CANCELLED")).toBe(true);
  });

  it("IN_TRANSIT → COMPLETED is valid", () => {
    expect(isValidTransition("IN_TRANSIT", "COMPLETED")).toBe(true);
  });

  it("IN_TRANSIT → CANCELLED is valid", () => {
    expect(isValidTransition("IN_TRANSIT", "CANCELLED")).toBe(true);
  });

  it("COMPLETED → anything is invalid (terminal)", () => {
    expect(isValidTransition("COMPLETED", "PLANNED")).toBe(false);
    expect(isValidTransition("COMPLETED", "IN_TRANSIT")).toBe(false);
    expect(isValidTransition("COMPLETED", "CANCELLED")).toBe(false);
  });

  it("CANCELLED → anything is invalid (terminal)", () => {
    expect(isValidTransition("CANCELLED", "PLANNED")).toBe(false);
    expect(isValidTransition("CANCELLED", "IN_TRANSIT")).toBe(false);
    expect(isValidTransition("CANCELLED", "COMPLETED")).toBe(false);
  });

  it("same-status no-op is always valid", () => {
    expect(isValidTransition("PLANNED", "PLANNED")).toBe(true);
    expect(isValidTransition("COMPLETED", "COMPLETED")).toBe(true);
    expect(isValidTransition("CANCELLED", "CANCELLED")).toBe(true);
  });

  it("IN_TRANSIT → PLANNED is invalid (no going back)", () => {
    expect(isValidTransition("IN_TRANSIT", "PLANNED")).toBe(false);
  });

  it("COMPLETED and CANCELLED are terminal", () => {
    expect(isTerminal("COMPLETED")).toBe(true);
    expect(isTerminal("CANCELLED")).toBe(true);
    expect(isTerminal("PLANNED")).toBe(false);
    expect(isTerminal("IN_TRANSIT")).toBe(false);
  });
});

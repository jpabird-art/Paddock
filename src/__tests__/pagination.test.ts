import { describe, it, expect } from "vitest";
import { parsePagination, paginationMeta } from "@/lib/pagination";

describe("parsePagination", () => {
  it("defaults to page 1, size 25", () => {
    const result = parsePagination({});
    expect(result).toEqual({ page: 1, pageSize: 25, skip: 0, take: 25 });
  });

  it("parses page and pageSize from strings", () => {
    const result = parsePagination({ page: "3", pageSize: "10" });
    expect(result).toEqual({ page: 3, pageSize: 10, skip: 20, take: 10 });
  });

  it("clamps page to minimum 1", () => {
    const result = parsePagination({ page: "0" });
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  it("clamps pageSize to max 100", () => {
    const result = parsePagination({ pageSize: "500" });
    expect(result.pageSize).toBe(100);
    expect(result.take).toBe(100);
  });

  it("uses custom default size", () => {
    const result = parsePagination({}, 50);
    expect(result.pageSize).toBe(50);
  });

  it("handles non-numeric values gracefully", () => {
    const result = parsePagination({ page: "abc", pageSize: "xyz" });
    expect(result).toEqual({ page: 1, pageSize: 25, skip: 0, take: 25 });
  });
});

describe("paginationMeta", () => {
  it("computes totalPages correctly", () => {
    const meta = paginationMeta({ page: 1, pageSize: 25 }, 73);
    expect(meta).toEqual({ page: 1, pageSize: 25, totalItems: 73, totalPages: 3 });
  });

  it("returns totalPages 1 for zero items", () => {
    const meta = paginationMeta({ page: 1, pageSize: 25 }, 0);
    expect(meta.totalPages).toBe(1);
  });

  it("returns totalPages 1 for exact fit", () => {
    const meta = paginationMeta({ page: 1, pageSize: 25 }, 25);
    expect(meta.totalPages).toBe(1);
  });
});

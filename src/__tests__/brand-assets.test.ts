import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");
const paths = (svg: string) => Array.from(svg.matchAll(/\bd="([^"]+)"/g), (match) => match[1]);

describe("Paddock brand assets", () => {
  const component = read("src/components/marketing/PaddockLogo.tsx");
  const primary = read("public/brand/paddock-logo.svg");

  it("keeps the inline mark and all standalone variants on the same vector geometry", () => {
    expect(paths(primary)).toHaveLength(2);
    for (const source of [
      component,
      read("public/brand/paddock-logo-reversed.svg"),
      read("public/brand/paddock-app-icon.svg"),
      read("public/paddock-mark.svg"),
    ]) {
      expect(paths(source)).toEqual(paths(primary));
    }
  });

  it("uses the approved forest/sage palette and cream reversed mark", () => {
    expect(primary).toContain('fill="#0F3D2E"');
    expect(primary).toContain('fill="#7FB28A"');
    expect(read("public/brand/paddock-logo-reversed.svg")).toContain('fill="#F8F7F2"');
    const theme = read("tailwind.config.ts");
    for (const color of ["#0F3D2E", "#7FB28A", "#0F172A", "#F8F7F2"]) {
      expect(theme).toContain(color);
    }
  });

  it("provides valid-sized PNGs for Apple touch and app use", () => {
    for (const [file, size] of [
      ["public/apple-touch-icon.png", 180],
      ["public/brand/paddock-app-icon-512.png", 512],
    ] as const) {
      const png = readFileSync(resolve(process.cwd(), file));
      expect(png.subarray(1, 4).toString()).toBe("PNG");
      expect(png.readUInt32BE(16)).toBe(size);
      expect(png.readUInt32BE(20)).toBe(size);
    }
  });
});

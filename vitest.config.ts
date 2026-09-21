import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    // The env module fails fast on missing secrets; tests never open a
    // connection, so placeholders are enough to import modules under test.
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "test-secret-at-least-32-characters-long",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "contract",
          include: ["tests/contract/**/*.test.ts"],
          environment: "node",
          testTimeout: 120_000,
          hookTimeout: 120_000,
          setupFiles: ["./tests/setup-contract.ts"],
          pool: "forks",
        },
      },
    ],
  },
});

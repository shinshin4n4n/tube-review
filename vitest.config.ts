import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/tests/**", // Exclude all Playwright tests
      "**/__tests__/e2e/**", // Exclude E2E tests
      "**/.next/**",
      "**/.claude/**",
      "**/*.spec.ts", // Exclude Playwright spec files
      "app/api/auth/magic-link/__tests__/**", // Exclude route tests (need env vars)
      "lib/youtube/__tests__/rate-limiter.test.ts", // Exclude (needs env vars)
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/e2e/",
        "vitest.setup.ts",
        "**/*.config.ts",
        "**/*.d.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});

import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // bcrypt at salt rounds 12 is deliberately slow (~1s/hash); allow headroom
    // so password tests don't time out when all files run in parallel.
    testTimeout: 20000,
    // Prevent accidental real DB connections in unit tests; DB-touching
    // modules are mocked within each test file.
    pool: "forks",
    server: {
      deps: {
        // next / next-auth use package "exports" that the default resolver
        // mis-handles; inlining lets Vite resolve them correctly.
        inline: ["next", "next-auth"],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});

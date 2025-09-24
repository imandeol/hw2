import path from "node:path";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vitest/config";
import {
  defineWorkersConfig,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config";

const migrations = await readD1Migrations(path.join(process.cwd(), "drizzle"));

export default defineConfig({
  plugins: [react(), cloudflare()],
  test: {
    reporters: ["verbose"],
    projects: [
      // ---- React (web) project ----
      {
        test: {
          name: "web",
          environment: "jsdom",
          globals: true,
          include: ["test/**/*.test.tsx"],
          exclude: ["test/**/server.test.ts"],
          setupFiles: ["./test/setup-tests.ts"],
          environmentOptions: { jsdom: { url: "http://localhost/" } },
        },
      },

      // ---- Cloudflare Worker (Hono) project ----
      defineWorkersConfig({
        test: {
          name: "worker",
          include: ["test/**/server.test.ts"],
          setupFiles: ["./test/apply-migrations.ts"],
          poolOptions: {
            workers: {
              wrangler: { configPath: "./wrangler.json" },
              miniflare: { bindings: { TEST_MIGRATIONS: migrations } },
            },
          },
        },
      }) as any,
    ],
  },
});

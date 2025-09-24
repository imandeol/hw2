import { env, applyD1Migrations } from "cloudflare:test";

await applyD1Migrations(env.DB, (env as any).TEST_MIGRATIONS);

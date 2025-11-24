import { faker } from "@faker-js/faker";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CONFIG = process.env.WRANGLER_CONFIG || "wrangler.json";

// Read DB name from wrangler.json (fallback to env or "test-db")
let DB_NAME = "test-db";
try {
  const cfg = JSON.parse(fs.readFileSync(CONFIG, "utf8"));
  DB_NAME =
    process.env.D1_DB_NAME ||
    cfg?.d1_databases?.[0]?.database_name ||
    "test-db";
} catch {
  DB_NAME = process.env.D1_DB_NAME || "test-db";
}

const ROWS = 35;

function run(cmd, ...args) {
  return execFileSync(cmd, args, { encoding: "utf8" }).trim();
}

// 1) Make sure migrations are applied locally so the table exists
try {
  console.log(`[seed] Applying migrations for ${DB_NAME} (local)...`);
  run(
    "npx",
    "wrangler",
    "d1",
    "migrations",
    "apply",
    DB_NAME,
    "--local",
    "--config",
    CONFIG
  );
} catch (e) {
  console.log("[seed] No migrations to apply or apply failed (continuing).");
}

// 2) Check if expenses already has rows
function countRows() {
  try {
    const out = run(
      "npx",
      "wrangler",
      "d1",
      "execute",
      DB_NAME,
      "--local",
      "--config",
      CONFIG,
      "--command",
      "SELECT COUNT(*) AS cnt FROM expenses;",
      "--json"
    );
    const j = JSON.parse(out);
    const result = j?.result?.[0]?.results?.[0];
    const cnt = Number(result?.cnt ?? Object.values(result ?? {})[0] ?? 0);
    return Number.isFinite(cnt) ? cnt : 0;
  } catch {
    console.log(
      "[seed] 'expenses' table not found; did the migration create it?"
    );
    return -1;
  }
}

const existing = countRows();
if (existing === -1) process.exit(0);
if (existing > 0) {
  console.log(`[seed] Found ${existing} expenses; skipping seed.`);
  process.exit(0);
}

// 3) Generate rows
faker.seed(42);
const now = new Date();
const past = new Date(now);
past.setMonth(now.getMonth() - 1);

const rows = Array.from({ length: ROWS }, () => ({
  description: faker.commerce.productName().replaceAll("'", "''"),
  date: faker.date.between({ from: past, to: now }).toISOString().slice(0, 10),
  cost: Number(
    faker.number.float({ min: 2, max: 400, multipleOf: 0.01 }).toFixed(2)
  ),
}));

// 4) Build SQL (chunked inserts)
let sql = "BEGIN TRANSACTION;\n";
const chunkSize = 100;
for (let i = 0; i < rows.length; i += chunkSize) {
  const chunk = rows.slice(i, i + chunkSize);
  const values = chunk
    .map((r) => `('${r.description}','${r.date}',${r.cost})`)
    .join(",\n");
  sql += `INSERT INTO expenses (description, date, cost) VALUES\n${values};\n`;
}
sql += "COMMIT;";

const outDir = ".cache";
fs.mkdirSync(outDir, { recursive: true });
const file = path.join(outDir, "seed.sql");
fs.writeFileSync(file, sql, "utf8");

// 5) Execute against local D1
console.log(`[seed] Seeding ${ROWS} rows into ${DB_NAME} via ${file}...`);
try {
  const out = run(
    "npx",
    "wrangler",
    "d1",
    "execute",
    DB_NAME,
    "--local",
    "--config",
    CONFIG,
    "--file",
    file
  );
  console.log(out);
} catch (e) {
  console.error(
    "[seed] Failed to execute seed:",
    e?.stdout?.toString?.() || e.message
  );
  process.exit(1);
}

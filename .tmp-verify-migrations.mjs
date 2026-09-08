import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import mysql from "mysql2/promise";

const envText = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
const databaseLine = envText
  .split(/\r?\n/)
  .find((line) => line.trimStart().startsWith("DATABASE_URL="));
if (!databaseLine) throw new Error("DATABASE_URL is missing from .env");

let sourceUrl = databaseLine.slice(databaseLine.indexOf("=") + 1).trim();
if (
  (sourceUrl.startsWith('"') && sourceUrl.endsWith('"')) ||
  (sourceUrl.startsWith("'") && sourceUrl.endsWith("'"))
) {
  sourceUrl = sourceUrl.slice(1, -1);
}

const databaseName = `roboeq_migration_check_${crypto.randomBytes(6).toString("hex")}`;
if (!/^roboeq_migration_check_[a-f0-9]{12}$/.test(databaseName)) {
  throw new Error("Unsafe verification database name");
}

const adminUrl = new URL(sourceUrl);
adminUrl.pathname = "/mysql";
const testUrl = new URL(sourceUrl);
testUrl.pathname = `/${databaseName}`;
const admin = await mysql.createConnection(adminUrl.toString());

try {
  await admin.query(`CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  const prismaCli = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
  const migration = spawnSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: testUrl.toString() },
    encoding: "utf8",
  });
  process.stdout.write(migration.stdout || "");
  process.stderr.write(migration.stderr || "");
  if (migration.status !== 0) throw new Error(`Migration deploy exited with ${migration.status}`);

  const verification = await mysql.createConnection(testUrl.toString());
  try {
    const [[migrationCount]] = await verification.query(
      "SELECT COUNT(*) AS count FROM `_prisma_migrations` WHERE `finished_at` IS NOT NULL AND `rolled_back_at` IS NULL",
    );
    const [[contactTable]] = await verification.query(
      "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'ContactRequest'",
      [databaseName],
    );
    const [[termsColumns]] = await verification.query(
      "SELECT COUNT(*) AS count FROM information_schema.columns WHERE table_schema = ? AND table_name = 'Order' AND column_name IN ('termsVersion', 'termsAcceptedAt', 'completedAt')",
      [databaseName],
    );
    if (Number(migrationCount.count) !== 7 || Number(contactTable.count) !== 1 || Number(termsColumns.count) !== 3) {
      throw new Error("Migration verification did not produce the expected schema");
    }
    console.log(`Verified ${migrationCount.count} migrations on an isolated MySQL database.`);
  } finally {
    await verification.end();
  }
} finally {
  await admin.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
  await admin.end();
}

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import mysql from "mysql2/promise";

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) throw new Error("DATABASE_URL is not configured");
  const line = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((candidate) => candidate.trimStart().startsWith("DATABASE_URL="));
  if (!line) throw new Error("DATABASE_URL is not configured");
  let value = line.slice(line.indexOf("=") + 1).trim();
  if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
  return value;
}

function runPrisma(arguments_, environment) {
  const prismaCli = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
  const result = spawnSync(process.execPath, [prismaCli, ...arguments_], {
    cwd: process.cwd(),
    env: environment,
    encoding: "utf8",
  });
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  return result.status;
}

const sourceUrl = new URL(readDatabaseUrl());
if (sourceUrl.protocol !== "mysql:") throw new Error("Migration verification requires MySQL");

const databaseName = `roboeq_migration_check_${crypto.randomBytes(6).toString("hex")}`;
if (!/^roboeq_migration_check_[a-f0-9]{12}$/.test(databaseName)) {
  throw new Error("Unsafe verification database name");
}
const adminUrl = new URL(sourceUrl);
adminUrl.pathname = "/mysql";
const testUrl = new URL(sourceUrl);
testUrl.pathname = `/${databaseName}`;
const expectedMigrationCount = fs
  .readdirSync(path.join(process.cwd(), "prisma", "migrations"), {
    withFileTypes: true,
  })
  .filter((entry) => entry.isDirectory()).length;

const admin = await mysql.createConnection(adminUrl.toString());
try {
  await admin.query(
    `CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );

  const environment = { ...process.env, DATABASE_URL: testUrl.toString() };
  const deployStatus = runPrisma(["migrate", "deploy"], environment);
  if (deployStatus !== 0) throw new Error(`Migration deploy exited with ${deployStatus}`);

  const verification = await mysql.createConnection(testUrl.toString());
  try {
    const [[migrationCount]] = await verification.query(
      "SELECT COUNT(*) AS count FROM `_prisma_migrations` WHERE `finished_at` IS NOT NULL AND `rolled_back_at` IS NULL",
    );
    if (Number(migrationCount.count) !== expectedMigrationCount) {
      throw new Error(
        `Expected ${expectedMigrationCount} completed migrations, found ${migrationCount.count}`,
      );
    }
  } finally {
    await verification.end();
  }

  const driftStatus = runPrisma(
    [
      "migrate",
      "diff",
      "--exit-code",
      "--from-url",
      testUrl.toString(),
      "--to-schema-datamodel",
      "prisma/schema.prisma",
    ],
    environment,
  );
  if (driftStatus !== 0) throw new Error(`Schema drift check exited with ${driftStatus}`);
  console.log(
    `Verified ${expectedMigrationCount} migrations on isolated MySQL; no schema drift detected.`,
  );
} finally {
  await admin.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
  await admin.end();
}

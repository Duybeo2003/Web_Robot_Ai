import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const CONFIRMATION = "CREATE_INITIAL_ADMIN";

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function main() {
  if (process.argv.includes("--help")) {
    console.log(
      "Creates the first active administrator. Required environment: " +
        "BOOTSTRAP_ADMIN_CONFIRM, BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD.",
    );
    return;
  }

  if (process.env.BOOTSTRAP_ADMIN_CONFIRM !== CONFIRMATION) {
    throw new Error(
      `Set BOOTSTRAP_ADMIN_CONFIRM=${CONFIRMATION} to acknowledge this one-time operation.`,
    );
  }

  const email = requiredEnvironment("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const password = requiredEnvironment("BOOTSTRAP_ADMIN_PASSWORD");
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Quản trị viên";

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL must be a valid email address.");
  }
  if (password.length < 16 || password.length > 128) {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD must contain 16 to 128 characters.");
  }
  if (name.length < 2 || name.length > 100) {
    throw new Error("BOOTSTRAP_ADMIN_NAME must contain 2 to 100 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const administrator = await prisma.$transaction(
    async (tx) => {
      const activeAdministrator = await tx.user.findFirst({
        where: { role: "ADMIN", deletedAt: null },
        select: { id: true },
      });
      if (activeAdministrator) {
        throw new Error(
          "An active administrator already exists. Create further staff accounts in the admin console.",
        );
      }

      const existing = await tx.user.findUnique({ where: { email } });
      const user = existing
        ? await tx.user.update({
            where: { id: existing.id },
            data: {
              name,
              password: passwordHash,
              role: "ADMIN",
              deletedAt: null,
            },
            select: { id: true, email: true },
          })
        : await tx.user.create({
            data: { name, email, password: passwordHash, role: "ADMIN" },
            select: { id: true, email: true },
          });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "system.initial_admin_bootstrap",
          model: "User",
          recordId: user.id,
          after: { email: user.email, role: "ADMIN" },
        },
      });
      return user;
    },
    { isolationLevel: "Serializable", timeout: 10_000 },
  );

  console.log(`Initial administrator created: ${administrator.email}`);
  console.log("Remove the BOOTSTRAP_ADMIN_* environment values now.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Admin bootstrap failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

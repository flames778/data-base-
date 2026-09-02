/**
 * One-off script to create your first real login account (e.g. CEO/admin),
 * for use once in production since the dev seed accounts are intentionally
 * skipped there.
 *
 * Usage (never hardcode your password in this file or in chat):
 *   FIRST_USER_EMAIL="you@example.com" \
 *   FIRST_USER_NAME="Your Name" \
 *   FIRST_USER_ROLE="CEO" \
 *   FIRST_USER_PASSWORD="a-strong-password" \
 *   npx tsx prisma/create-first-user.ts
 *
 * Run this with DATABASE_URL/DIRECT_URL pointed at your real (Supabase)
 * database — e.g. by having a local .env with those values set, or by
 * exporting them in the same shell command.
 *
 * Delete this file (or just don't run it again) once you're done — it's a
 * bootstrap tool, not something that should run automatically.
 */
import { PrismaClient, RoleName } from "@prisma/client";
import { hashPassword } from "../src/lib/passwords";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.FIRST_USER_EMAIL?.trim().toLowerCase();
  const name = process.env.FIRST_USER_NAME?.trim();
  const roleName = (process.env.FIRST_USER_ROLE?.trim() || "CEO") as RoleName;
  const password = process.env.FIRST_USER_PASSWORD;

  if (!email || !name || !password) {
    console.error(
      "Missing required env vars. Set FIRST_USER_EMAIL, FIRST_USER_NAME, and FIRST_USER_PASSWORD."
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("FIRST_USER_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    console.error(
      `Role "${roleName}" not found. Run "npx prisma db seed" first to create system roles/permissions.`
    );
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`A user with email ${email} already exists (id: ${existing.id}).`);
    process.exit(1);
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      roleId: role.id,
      passwordHash: await hashPassword(password),
      mustChangePassword: false,
      status: "ACTIVE",
    },
  });

  console.log(`Created user ${user.email} (${roleName}). You can now log in.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

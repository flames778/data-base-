import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/passwords";
import type { RoleName } from "@prisma/client";

/**
 * ONE-TIME bootstrap endpoint to create the first production user when
 * local machines can't reach the database directly but Vercel's servers
 * can. Protected by BOOTSTRAP_SECRET so it can't be abused if left in
 * place; still, delete this route (and the BOOTSTRAP_SECRET env var) once
 * you've created your account.
 *
 * Usage, after setting BOOTSTRAP_SECRET in Vercel env vars and redeploying:
 *
 *   curl -X POST https://your-app.vercel.app/api/bootstrap-user \
 *     -H "Content-Type: application/json" \
 *     -H "x-bootstrap-secret: <your BOOTSTRAP_SECRET value>" \
 *     -d '{"email":"you@example.com","name":"Your Name","password":"a-strong-password","role":"CEO"}'
 */
export async function POST(request: NextRequest) {
  const expected = process.env.BOOTSTRAP_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "BOOTSTRAP_SECRET is not set. Set it in Vercel env vars and redeploy first." },
      { status: 503 }
    );
  }

  const provided = request.headers.get("x-bootstrap-secret");
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingUserCount = await prisma.user.count();
  if (existingUserCount > 0) {
    return NextResponse.json(
      {
        error:
          "Refusing to run: this database already has users. This endpoint is only for bootstrapping an empty database.",
      },
      { status: 409 }
    );
  }

  const body = await request.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  const name = body?.name?.trim();
  const password = body?.password;
  const roleName = (body?.role?.trim() || "CEO") as RoleName;

  if (!email || !name || !password) {
    return NextResponse.json(
      { error: "email, name, and password are required." },
      { status: 400 }
    );
  }

  const strength = validatePasswordStrength(password);
  if (!strength.ok) {
    return NextResponse.json({ error: strength.error }, { status: 400 });
  }

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    return NextResponse.json(
      {
        error: `Role "${roleName}" not found. Run "prisma db seed" (or migrate deploy, which runs it) first to create system roles.`,
      },
      { status: 400 }
    );
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

  return NextResponse.json({
    ok: true,
    message: `Created ${user.email} as ${roleName}. You can now log in. Delete this route and BOOTSTRAP_SECRET now.`,
  });
}

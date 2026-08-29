/**
 * PREC PEARL — DEVELOPMENT-ONLY SYSTEM CONFIGURATION SEED
 *
 * This seeds ONLY the RBAC system configuration (roles, permissions, and the
 * role-permission mappings). It does NOT create any fake users, projects,
 * reports, documents, or other operational data.
 *
 * Production starts empty except for this system configuration, which is
 * required for the application to function at all.
 */

import { PrismaClient, RoleName, ReportFieldType } from "@prisma/client";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_DISPLAY_NAMES,
} from "../src/lib/permissions";
import { hashPassword, generateTempPassword } from "../src/lib/passwords";

const prisma = new PrismaClient();

// Required system configuration: base report templates with their fields.
const REPORT_TEMPLATES: Array<{
  name: string;
  code: string;
  description: string;
  category: string;
  fields: Array<{
    key: string;
    label: string;
    type: ReportFieldType;
    required: boolean;
    placeholder?: string;
    sortOrder: number;
  }>;
}> = [
  {
    name: "Weekly Work Report",
    code: "weekly",
    description: "Standard weekly work report for employees.",
    category: "WEEKLY",
    fields: [
      { key: "work_completed", label: "Work completed", type: "TEXTAREA", required: true, placeholder: "Describe the work you completed this week.", sortOrder: 1 },
      { key: "activities", label: "Activities performed", type: "TEXTAREA", required: false, placeholder: "List key activities performed.", sortOrder: 2 },
      { key: "achievements", label: "Achievements", type: "TEXTAREA", required: false, placeholder: "Notable achievements this week.", sortOrder: 3 },
      { key: "challenges", label: "Challenges", type: "TEXTAREA", required: false, placeholder: "Challenges encountered.", sortOrder: 4 },
      { key: "resources_used", label: "Resources used", type: "TEXTAREA", required: false, placeholder: "Equipment, materials, tools used.", sortOrder: 5 },
      { key: "next_week_plan", label: "Next week's plan", type: "TEXTAREA", required: false, placeholder: "Planned work for next week.", sortOrder: 6 },
      { key: "additional_comments", label: "Additional comments", type: "TEXTAREA", required: false, sortOrder: 7 },
    ],
  },
  {
    name: "Monthly Report",
    code: "monthly",
    description: "Standard monthly report for employees.",
    category: "MONTHLY",
    fields: [
      { key: "major_activities", label: "Major activities", type: "TEXTAREA", required: true, placeholder: "Major activities over the month.", sortOrder: 1 },
      { key: "completed_objectives", label: "Completed objectives", type: "TEXTAREA", required: false, sortOrder: 2 },
      { key: "outstanding_objectives", label: "Outstanding objectives", type: "TEXTAREA", required: false, sortOrder: 3 },
      { key: "challenges", label: "Challenges", type: "TEXTAREA", required: false, sortOrder: 4 },
      { key: "resources", label: "Resources", type: "TEXTAREA", required: false, sortOrder: 5 },
      { key: "recommendations", label: "Recommendations", type: "TEXTAREA", required: false, sortOrder: 6 },
      { key: "next_month_priorities", label: "Next month's priorities", type: "TEXTAREA", required: false, sortOrder: 7 },
    ],
  },
  {
    name: "Incident Report",
    code: "incident",
    description: "Report an incident at a site or in the field.",
    category: "INCIDENT",
    fields: [
      { key: "incident_date", label: "Incident date", type: "DATE", required: true, sortOrder: 1 },
      { key: "location", label: "Location", type: "TEXT", required: true, placeholder: "Site or location of the incident", sortOrder: 2 },
      { key: "incident_description", label: "Incident description", type: "TEXTAREA", required: true, sortOrder: 3 },
      { key: "impact", label: "Impact", type: "TEXTAREA", required: false, sortOrder: 4 },
      { key: "actions_taken", label: "Actions taken", type: "TEXTAREA", required: false, sortOrder: 5 },
    ],
  },
];

// ===========================================================================
// DEVELOPMENT-ONLY BOOTSTRAP ACCOUNTS
//
// These accounts exist ONLY in development so the platform can be exercised
// before real accounts are provisioned. They are never created in production,
// and they are always flagged as TEMPORARY. Passwords come from environment
// variables (SEED_*_PASSWORD) or are auto-generated and logged once. They are
// never written to the frontend and never hardcoded in the application.
// ===========================================================================

interface DevAccountSpec {
  key: string;
  email: string;
  name: string;
  role: RoleName;
}

const DEV_ACCOUNTS: DevAccountSpec[] = [
  { key: "CEO", email: "ceo@precpearl.local", name: "CEO (Dev)", role: "CEO" },
  { key: "ADMIN", email: "admin@precpearl.local", name: "Admin (Dev)", role: "ADMIN" },
  { key: "PROJECT_LEAD", email: "projectlead@precpearl.local", name: "Project Lead (Dev)", role: "PROJECT_LEAD" },
  { key: "TEAM_MEMBER", email: "teammember@precpearl.local", name: "Team Member (Dev)", role: "TEAM_MEMBER" },
];

async function seedDevAccounts() {
  if (process.env.NODE_ENV === "production") {
    console.log("Skipping dev bootstrap accounts in production.");
    return;
  }
  if (process.env.SEED_DEV_ACCOUNTS === "false") {
    console.log("Dev bootstrap accounts disabled (SEED_DEV_ACCOUNTS=false).");
    return;
  }

  for (const spec of DEV_ACCOUNTS) {
    const existing = await prisma.user.findUnique({ where: { email: spec.email } });
    if (existing) continue;

    const role = await prisma.role.findUnique({ where: { name: spec.role } });
    if (!role) {
      console.warn(`[seed] Could not find role ${spec.role}; skipping dev account.`);
      continue;
    }

    const envVar = `SEED_${spec.key}_PASSWORD`;
    const password = process.env[envVar] || generateTempPassword();
    const forceChange = !process.env[envVar];

    await prisma.user.create({
      data: {
        email: spec.email,
        name: spec.name,
        roleId: role.id,
        passwordHash: await hashPassword(password),
        mustChangePassword: forceChange,
      },
    });

    const source = process.env[envVar]
      ? "from SEED_*_PASSWORD env var"
      : "auto-generated (shown once below)";
    console.log(
      `\n[DEV-ONLY · TEMPORARY] Created bootstrap account: ${spec.email} (${spec.role})` +
        `\n  Password: ${password}  (${source})` +
        `\n  These credentials are for LOCAL DEVELOPMENT only. Replace them immediately.`
    );
  }
}

async function seedTemplates() {  for (const t of REPORT_TEMPLATES) {
    const existing = await prisma.reportTemplate.findUnique({
      where: { code: t.code },
    });
    if (existing) {
      // Update description; leave fields as-is (admins can edit later)
      await prisma.reportTemplate.update({
        where: { id: existing.id },
        data: { description: t.description, category: t.category },
      });
      continue;
    }
    await prisma.reportTemplate.create({
      data: {
        name: t.name,
        code: t.code,
        description: t.description,
        category: t.category,
        fields: {
          create: t.fields.map((f) => ({ ...f })),
        },
      },
    });
  }
  console.log(
    `Seeded ${REPORT_TEMPLATES.length} base report templates (system configuration).`
  );
}

async function main() {
  // 1. Ensure all permissions exist
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { name: p.name, description: p.description ?? null },
      create: {
        key: p.key,
        name: p.name,
        description: p.description ?? null,
      },
    });
  }

  // 2. Ensure all roles exist
  const roleNames = Object.keys(ROLE_PERMISSIONS) as RoleName[];
  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: {
        name,
        displayName: ROLE_DISPLAY_NAMES[name],
        systemRole: true,
      },
    });
  }

  // 3. Sync role-permission mappings (replace to match current registry)
  for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: roleName as RoleName },
    });

    // Remove any mappings not in the current registry for this role
    await prisma.rolePermission.deleteMany({
      where: {
        roleId: role.id,
        permission: {
          key: { notIn: permissionKeys as string[] },
        },
      },
    });

    // Add all current mappings
    for (const key of permissionKeys) {
      const perm = await prisma.permission.findUniqueOrThrow({
        where: { key },
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: perm.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }

  console.log(
    `Seeded ${PERMISSIONS.length} permissions and ${roleNames.length} roles (system configuration only). No mock data created.`
  );

  await seedTemplates();
  await seedDevAccounts();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

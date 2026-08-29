import { describe, it, expect } from "vitest";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  PermissionKey,
  ROLE_DISPLAY_ORDER,
} from "@/lib/permissions";
import type { RoleName } from "@prisma/client";

const ALL_PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

describe("RBAC permission registry", () => {
  it("declares every PERMISSION key exactly once", () => {
    const seen = new Set<string>();
    for (const k of ALL_PERMISSION_KEYS) {
      expect(seen.has(k)).toBe(false);
      seen.add(k);
    }
    expect(ALL_PERMISSION_KEYS.length).toBeGreaterThan(0);
  });

  it("ROLE_PERMISSIONS only references declared PermissionKeys", () => {
    const declared = new Set<string>(ALL_PERMISSION_KEYS);
    for (const role of Object.keys(ROLE_PERMISSIONS) as RoleName[]) {
      for (const perm of ROLE_PERMISSIONS[role]) {
        expect(declared.has(perm)).toBe(true);
      }
    }
  });

  it("covers every RoleName in ROLE_DISPLAY_ORDER", () => {
    for (const role of ROLE_DISPLAY_ORDER) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
    }
  });

  it("CEO has full oversight permissions", () => {
    const ceo = ROLE_PERMISSIONS.CEO;
    expect(ceo).toContain("reports.view_all" as PermissionKey);
    expect(ceo).toContain("dashboard.ceo" as PermissionKey);
    expect(ceo).toContain("permissions.manage" as PermissionKey);
    expect(ceo).toContain("users.view_all" as PermissionKey);
  });

  it("ADMIN has user + permission management and admin dashboard", () => {
    const admin = ROLE_PERMISSIONS.ADMIN;
    expect(admin).toContain("users.manage" as PermissionKey);
    expect(admin).toContain("dashboard.admin" as PermissionKey);
    expect(admin).toContain("audit.view" as PermissionKey);
  });

  it("PROJECT_LEAD can review/approve but is not a full manager", () => {
    const lead = ROLE_PERMISSIONS.PROJECT_LEAD;
    expect(lead).toContain("reports.approve" as PermissionKey);
    expect(lead).toContain("dashboard.project_lead" as PermissionKey);
    expect(lead).not.toContain("users.manage" as PermissionKey);
    expect(lead).not.toContain("permissions.manage" as PermissionKey);
  });

  it("TEAM_MEMBER can submit reports but cannot approve", () => {
    const member = ROLE_PERMISSIONS.TEAM_MEMBER;
    expect(member).toContain("reports.submit" as PermissionKey);
    expect(member).not.toContain("reports.approve" as PermissionKey);
    expect(member).not.toContain("reports.view_all" as PermissionKey);
  });

  it("INTERN has a restricted permission set (no document upload)", () => {
    const intern = ROLE_PERMISSIONS.INTERN;
    expect(intern).toContain("reports.submit" as PermissionKey);
    expect(intern).not.toContain("documents.upload" as PermissionKey);
    expect(intern).not.toContain("documents.download" as PermissionKey);
  });

  it("FIELD_STAFF has the same permissions as TEAM_MEMBER", () => {
    expect(ROLE_PERMISSIONS.FIELD_STAFF).toEqual(ROLE_PERMISSIONS.TEAM_MEMBER);
  });
});

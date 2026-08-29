/**
 * Centralized RBAC permission registry.
 *
 * All application permissions are declared here. Roles are mapped to
 * permissions here as well. The database roles/permissions are seeded from
 * this registry (see prisma/seed.ts).
 *
 * Authorization is ALWAYS enforced server-side using `requirePermission`.
 * The frontend only uses this for UI visibility, never for security.
 */

import type { RoleName } from "@prisma/client";

export type PermissionKey =
  // Reports
  | "reports.view"
  | "reports.submit"
  | "reports.edit_own"
  | "reports.review"
  | "reports.approve"
  | "reports.view_all"
  | "reports.manage"
  | "reports.manage_templates"
  // Documents
  | "documents.view"
  | "documents.upload"
  | "documents.edit"
  | "documents.delete"
  | "documents.download"
  | "documents.manage"
  | "documents.view_vital"
  // Projects
  | "projects.view"
  | "projects.manage"
  // Teams
  | "teams.manage"
  // Users
  | "users.manage"
  | "users.view_all"
  // Permissions
  | "permissions.manage"
  // Audit
  | "audit.view"
  // Staff hub
  | "forum.create"
  | "forum.comment"
  | "forum.moderate"
  // Issues / Challenges
  | "issues.create"
  | "issues.manage"
  | "issues.assign"
  // Claims / Requests
  | "claims.create"
  | "claims.review"
  | "claims.manage"
  // Dashboard visibility
  | "dashboard.ceo"
  | "dashboard.admin"
  | "dashboard.project_lead";

export interface PermissionDef {
  key: PermissionKey;
  name: string;
  description?: string;
}

export const PERMISSIONS: PermissionDef[] = [
  // Reports
  { key: "reports.view", name: "View reports (own, or permitted)" },
  { key: "reports.submit", name: "Submit reports" },
  { key: "reports.edit_own", name: "Edit own reports" },
  { key: "reports.review", name: "Review reports" },
  { key: "reports.approve", name: "Approve reports" },
  { key: "reports.view_all", name: "View all reports" },
  { key: "reports.manage", name: "Manage reports" },
  { key: "reports.manage_templates", name: "Manage report templates" },

  // Documents
  { key: "documents.view", name: "View documents" },
  { key: "documents.upload", name: "Upload documents" },
  { key: "documents.edit", name: "Edit documents" },
  { key: "documents.delete", name: "Delete documents" },
  { key: "documents.download", name: "Download documents" },
  { key: "documents.view_vital", name: "View vital documents" },

  // Projects
  { key: "projects.view", name: "View projects" },
  { key: "projects.manage", name: "Manage projects" },

  // Teams
  { key: "teams.manage", name: "Manage teams" },

  // Users
  { key: "users.manage", name: "Manage users" },
  { key: "users.view_all", name: "View all users" },

  // Permissions
  { key: "permissions.manage", name: "Manage permissions" },

  // Audit
  { key: "audit.view", name: "View audit logs" },

  // Staff hub
  { key: "forum.create", name: "Create forum posts" },
  { key: "forum.comment", name: "Comment on posts/items" },
  { key: "forum.moderate", name: "Moderate forum" },

  // Issues
  { key: "issues.create", name: "Create issues/challenges" },
  { key: "issues.manage", name: "Manage issues" },
  { key: "issues.assign", name: "Assign issues" },

  // Claims
  { key: "claims.create", name: "Create claims/requests" },
  { key: "claims.review", name: "Review claims" },
  { key: "claims.manage", name: "Manage claims" },

  // Dashboard visibility
  { key: "dashboard.ceo", name: "CEO executive dashboard" },
  { key: "dashboard.admin", name: "Admin dashboard" },
  { key: "dashboard.project_lead", name: "Project lead dashboard" },
];

export const ROLE_PERMISSIONS: Record<RoleName, PermissionKey[]> = {
  CEO: [
    "reports.view",
    "reports.view_all",
    "reports.manage_templates",
    "documents.view",
    "documents.upload",
    "documents.download",
    "documents.view_vital",
    "projects.view",
    "projects.manage",
    "users.manage",
    "users.view_all",
    "permissions.manage",
    "audit.view",
    "forum.create",
    "forum.comment",
    "forum.moderate",
    "issues.create",
    "issues.manage",
    "issues.assign",
    "claims.create",
    "claims.manage",
    "dashboard.ceo",
  ],
  ADMIN: [
    "reports.view",
    "reports.view_all",
    "reports.manage",
    "reports.manage_templates",
    "documents.view",
    "documents.upload",
    "documents.edit",
    "documents.delete",
    "documents.download",
    "documents.view_vital",
    "projects.view",
    "projects.manage",
    "teams.manage",
    "users.manage",
    "users.view_all",
    "audit.view",
    "forum.create",
    "forum.comment",
    "forum.moderate",
    "issues.create",
    "issues.manage",
    "issues.assign",
    "claims.create",
    "claims.review",
    "claims.manage",
    "dashboard.admin",
  ],
  PROJECT_LEAD: [
    "reports.view",
    "reports.review",
    "reports.approve",
    "documents.view",
    "documents.upload",
    "documents.download",
    "projects.view",
    "forum.create",
    "forum.comment",
    "issues.create",
    "issues.manage",
    "issues.assign",
    "claims.create",
    "claims.review",
    "dashboard.project_lead",
  ],
  TEAM_MEMBER: [
    "reports.view",
    "reports.submit",
    "reports.edit_own",
    "documents.view",
    "documents.upload",
    "documents.download",
    "projects.view",
    "forum.create",
    "forum.comment",
    "issues.create",
    "claims.create",
  ],
  FIELD_STAFF: [
    "reports.view",
    "reports.submit",
    "reports.edit_own",
    "documents.view",
    "documents.upload",
    "documents.download",
    "projects.view",
    "forum.create",
    "forum.comment",
    "issues.create",
    "claims.create",
  ],
  INTERN: [
    "reports.view",
    "reports.submit",
    "reports.edit_own",
    "documents.view",
    "projects.view",
    "forum.create",
    "forum.comment",
    "issues.create",
    "claims.create",
  ],
};

// Roles ordered for display
export const ROLE_DISPLAY_ORDER: RoleName[] = [
  "CEO",
  "ADMIN",
  "PROJECT_LEAD",
  "TEAM_MEMBER",
  "FIELD_STAFF",
  "INTERN",
];

export const ROLE_DISPLAY_NAMES: Record<RoleName, string> = {
  CEO: "Chief Executive Officer",
  ADMIN: "Administrator",
  PROJECT_LEAD: "Project Lead",
  TEAM_MEMBER: "Team Member",
  FIELD_STAFF: "Field Staff",
  INTERN: "Intern",
};

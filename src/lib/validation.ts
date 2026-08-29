import { z } from "zod";
import { ReportStatus, ReportFieldType } from "@prisma/client";

// --- Report submission ---
export const reportSubmitSchema = z.object({
  templateId: z.string().min(1),
  projectId: z.string().nullable().optional(),
  title: z.string().min(1).max(200),
  reportingPeriod: z.string().nullable().optional(),
  reportingMonth: z.string().nullable().optional(),
  fields: z.record(z.string(), z.string().nullable()).optional(),
  submit: z.boolean().default(false),
});

export type ReportSubmitInput = z.infer<typeof reportSubmitSchema>;

// --- Report review ---
export const reportReviewSchema = z.object({
  action: z.enum(["approve", "reject", "request_revision", "archive"]),
  note: z.string().max(2000).optional(),
});

// --- Project ---
export const projectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  client: z.string().max(200).optional(),
  leadId: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

// --- User management ---
export const userUpdateSchema = z.object({
  roleId: z.string().optional(),
  department: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export const createUserSchema = z.object({
  email: z.string().email().min(1),
  name: z.string().min(1).max(200),
  roleId: z.string().min(1),
  jobTitle: z.string().max(200).nullable().optional(),
  department: z.string().max(200).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  teamIds: z.array(z.string()).optional(),
  tempPassword: z.string().min(8).max(200).optional(),
});

export const adminPasswordResetSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(8).max(200).optional(),
});

export const changeOwnPasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email().min(1),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export const setTeamMembershipSchema = z.object({
  userId: z.string().min(1),
  teamIds: z.array(z.string()),
});

// --- Forum post ---
export const forumPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(20000),
  category: z.enum([
    "CHALLENGES",
    "CLAIMS",
    "SUGGESTIONS",
    "TECHNICAL_ISSUES",
    "QUESTIONS",
    "ANNOUNCEMENTS",
  ]),
  projectId: z.string().nullable().optional(),
  announce: z.boolean().default(false),
});

// --- Comment ---
export const commentSchema = z.object({
  content: z.string().min(1).max(4000),
});

// --- Issue ---
export const issueSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(20000),
  category: z
    .enum(["CHALLENGES", "CLAIMS", "SUGGESTIONS", "TECHNICAL_ISSUES", "QUESTIONS", "ANNOUNCEMENTS"])
    .default("TECHNICAL_ISSUES"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  visibility: z.enum(["TEAM", "PROJECT", "MANAGEMENT", "PRIVATE"]).default("PROJECT"),
  projectId: z.string().nullable().optional(),
});

export const issueUpdateSchema = z.object({
  action: z.enum(["review", "assign", "start", "resolve", "close", "reopen"]),
  assigneeId: z.string().nullable().optional(),
  resolution: z.string().max(20000).optional(),
  note: z.string().max(2000).optional(),
});

// --- Claim ---
export const claimSchema = z.object({
  claimType: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(20000),
  amount: z.number().nullable().optional(),
  projectId: z.string().nullable().optional(),
});

export const claimReviewSchema = z.object({
  action: z.enum(["approve", "reject", "resolve", "close"]),
  note: z.string().max(2000).optional(),
  resolution: z.string().max(20000).optional(),
});

// --- Document (metadata only; file bytes go to MinIO object storage) ---
export const documentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  category: z.string().max(100).optional(),
  projectId: z.string().nullable().optional(),
  classification: z.enum(["INTERNAL", "CONFIDENTIAL", "RESTRICTED"]).default("INTERNAL"),
  isVital: z.boolean().default(false),
  vitalCategory: z
    .enum([
      "LEGAL", "CONTRACTS", "LICENSES", "CERTIFICATIONS", "INSURANCE",
      "CORPORATE", "SENSITIVE_ENGINEERING", "POLICIES", "OTHER",
    ])
    .nullable()
    .optional(),
});

// --- Search query ---
export const searchSchema = z.object({
  q: z.string().min(1).max(200),
  type: z
    .enum(["all", "reports", "projects", "documents", "issues", "claims", "posts"])
    .default("all"),
});

// --- Audit query ---
export const auditQuerySchema = z.object({
  action: z.string().optional(),
  resource: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

// Export reuse for report field types (not needed but kept for clarity)
export { ReportStatus, ReportFieldType };

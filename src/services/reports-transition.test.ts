import { describe, it, expect, vi } from "vitest";

// Prevent any real DB client from being constructed when reports.ts is imported.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/dashboard", () => ({ getProjectIdsForUser: vi.fn() }));

import { canTransition, ALLOWED_TRANSITIONS } from "@/services/reports";

describe("Report status transitions", () => {
  it("allows DRAFT -> SUBMITTED", () => {
    expect(canTransition("DRAFT", "SUBMITTED")).toBe(true);
  });

  it("allows DRAFT -> ARCHIVED", () => {
    expect(canTransition("DRAFT", "ARCHIVED")).toBe(true);
  });

  it("forbids DRAFT -> APPROVED (must be submitted first)", () => {
    expect(canTransition("DRAFT", "APPROVED")).toBe(false);
  });

  it("allows SUBMITTED -> UNDER_REVIEW / APPROVED / REVISION_REQUESTED", () => {
    expect(canTransition("SUBMITTED", "UNDER_REVIEW")).toBe(true);
    expect(canTransition("SUBMITTED", "APPROVED")).toBe(true);
    expect(canTransition("SUBMITTED", "REVISION_REQUESTED")).toBe(true);
  });

  it("allows REVISION_REQUESTED -> SUBMITTED (resubmit)", () => {
    expect(canTransition("REVISION_REQUESTED", "SUBMITTED")).toBe(true);
  });

  it("forbids REVISION_REQUESTED -> APPROVED", () => {
    expect(canTransition("REVISION_REQUESTED", "APPROVED")).toBe(false);
  });

  it("only allows APPROVED -> ARCHIVED", () => {
    expect(canTransition("APPROVED", "ARCHIVED")).toBe(true);
    expect(canTransition("APPROVED", "SUBMITTED")).toBe(false);
  });

  it("ARCHIVED is terminal", () => {
    expect(ALLOWED_TRANSITIONS.ARCHIVED).toEqual([]);
    expect(canTransition("ARCHIVED", "DRAFT")).toBe(false);
  });
});

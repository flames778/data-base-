import { describe, it, expect, vi, beforeEach } from "vitest";

const getProjectIdsForUser = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/dashboard", () => ({
  getProjectIdsForUser: (...args: unknown[]) => getProjectIdsForUser(...args),
}));

import { canViewReport } from "@/services/reports";

describe("Report visibility", () => {
  beforeEach(() => getProjectIdsForUser.mockReset());

  it("author can always view their own report", async () => {
    expect(await canViewReport("u1", { authorId: "u1", projectId: "p1" }, [])).toBe(true);
  });

  it("user with reports.view_all can view any report", async () => {
    expect(
      await canViewReport("u2", { authorId: "u1", projectId: "p1" }, ["reports.view_all"])
    ).toBe(true);
  });

  it("reviewer can view a report in a project they belong to", async () => {
    getProjectIdsForUser.mockResolvedValue(["p1"]);
    expect(
      await canViewReport("u2", { authorId: "u1", projectId: "p1" }, ["reports.review"])
    ).toBe(true);
  });

  it("reviewer cannot view a report in a project they do NOT belong to", async () => {
    getProjectIdsForUser.mockResolvedValue(["p2"]);
    expect(
      await canViewReport("u2", { authorId: "u1", projectId: "p1" }, ["reports.review"])
    ).toBe(false);
  });

  it("ordinary member cannot view another user's report outside their projects", async () => {
    getProjectIdsForUser.mockResolvedValue([]);
    expect(
      await canViewReport("u2", { authorId: "u1", projectId: null }, ["reports.view"])
    ).toBe(false);
  });
});

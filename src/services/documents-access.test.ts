import { describe, it, expect, vi, beforeEach } from "vitest";

const getProjectIdsForUser = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/dashboard", () => ({
  getProjectIdsForUser: (...args: unknown[]) => getProjectIdsForUser(...args),
}));

import { canAccessDocument } from "@/services/documents";
import type { Session } from "next-auth";

function makeSession(over: Partial<{ role: string; permissions: string[] }> = {}): Session {
  return {
    user: {
      id: "u1",
      name: "Tester",
      email: "t@example.com",
      role: (over.role ?? "TEAM_MEMBER") as never,
      permissions: (over.permissions ?? ["documents.view"]) as never,
    },
    expires: "2099-01-01T00:00:00.000Z",
  } as unknown as Session;
}

const vitalDoc = { projectId: null, isVital: true, classification: "RESTRICTED" };
const normalDoc = { projectId: null, isVital: false, classification: "INTERNAL" };
const projectDoc = { projectId: "p1", isVital: false, classification: "INTERNAL" };

describe("Document access control", () => {
  beforeEach(() => getProjectIdsForUser.mockReset());

  it("manager (CEO) can access vital documents", async () => {
    const s = makeSession({ role: "CEO", permissions: ["documents.view", "documents.view_vital", "documents.manage"] });
    expect(await canAccessDocument(s, vitalDoc)).toBe(true);
  });

  it("non-manager without view_vital cannot access vital documents", async () => {
    const s = makeSession({ permissions: ["documents.view"] });
    expect(await canAccessDocument(s, vitalDoc)).toBe(false);
  });

  it("user with view_vital (but not manager) can access vital documents", async () => {
    const s = makeSession({ permissions: ["documents.view", "documents.view_vital"] });
    expect(await canAccessDocument(s, vitalDoc)).toBe(true);
  });

  it("any viewer can access a non-vital, non-project document", async () => {
    const s = makeSession();
    expect(await canAccessDocument(s, normalDoc)).toBe(true);
  });

  it("project member can access non-vital project document", async () => {
    getProjectIdsForUser.mockResolvedValue(["p1"]);
    const s = makeSession();
    expect(await canAccessDocument(s, projectDoc)).toBe(true);
  });

  it("non-member cannot access non-vital project document", async () => {
    getProjectIdsForUser.mockResolvedValue(["p2"]);
    const s = makeSession();
    expect(await canAccessDocument(s, projectDoc)).toBe(false);
  });

  it("denies access when user lacks documents.view entirely", async () => {
    const s = makeSession({ permissions: [] });
    expect(await canAccessDocument(s, normalDoc)).toBe(false);
  });
});

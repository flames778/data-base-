import { describe, it, expect, vi, beforeEach } from "vitest";

// Keep the real error classes but replace the guard functions so we can
// simulate authenticated / unauthenticated / unauthorized callers.
vi.mock("@/lib/authz", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/authz")>();
  return {
    ...actual,
    requireAuth: vi.fn(),
    requirePermission: vi.fn(),
  };
});

import {
  requireAuth,
  requirePermission,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/authz";
import { POST } from "@/app/api/documents/upload/route";
import { GET } from "@/app/api/documents/[id]/download/route";

const postReq = () =>
  new Request("http://localhost/api/documents/upload", { method: "POST" });

describe("Documents API authorization (spec §49)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u1", permissions: ["documents.view"] },
    });
  });

  it("returns 401 when the caller is not authenticated", async () => {
    (requireAuth as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new UnauthorizedError()
    );
    const res = await POST(postReq());
    expect(res.status).toBe(401);
  });

  it("returns 403 when the caller lacks documents.upload", async () => {
    (requirePermission as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new ForbiddenError()
    );
    const res = await POST(postReq());
    expect(res.status).toBe(403);
  });

  it("download route returns 401 when not authenticated", async () => {
    (requireAuth as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new UnauthorizedError()
    );
    const res = await GET(new Request("http://localhost/api/documents/x/download"), {
      params: Promise.resolve({ id: "x" }),
    } as never);
    expect(res.status).toBe(401);
  });
});

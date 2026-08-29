import { NextResponse } from "next/server";
import {
  AuthError,
  ForbiddenError,
  UnauthorizedError,
  NotFoundError,
} from "@/lib/authz";

/**
 * Convert an error thrown by server-side guards / services into a proper
 * HTTP response. Authorization and not-found errors are mapped to their
 * correct status codes instead of leaking as 500s.
 *
 * This is the single place API route handlers translate domain errors into
 * HTTP, keeping status semantics consistent across the app.
 */
export function toErrorResponse(e: unknown): NextResponse {
  if (e instanceof ForbiddenError) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
  if (e instanceof UnauthorizedError) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
  if (e instanceof NotFoundError) {
    return NextResponse.json({ error: e.message }, { status: 404 });
  }
  if (e instanceof AuthError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  console.error("Unhandled API error:", e);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}

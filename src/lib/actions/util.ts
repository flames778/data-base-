/**
 * Shared error handling for server actions.
 */
export function errorResult(e: unknown): {
  ok: false;
  error: string;
} {
  // Never leak internal stack traces to the user.
  if (e instanceof Error) {
    // Known application errors provide friendly messages
    if ("status" in e === false) {
      // Zod validation errors
      if ("issues" in (e as never)) {
        const z = (e as { issues?: Array<{ message: string }> }).issues;
        if (z?.length) {
          return { ok: false, error: z[0].message };
        }
      }
      if (e.message === "Resource not found." || e.message === "You do not have permission to access this resource.") {
        return { ok: false, error: e.message };
      }
    }
  }
  console.error("Action error:", e);
  return { ok: false, error: "Something went wrong. Please try again." };
}

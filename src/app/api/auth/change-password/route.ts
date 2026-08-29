import { NextResponse } from "next/server";
import { changeOwnPassword } from "@/lib/actions/accounts";
import { toErrorResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const result = await changeOwnPassword({
      currentPassword: body?.currentPassword,
      newPassword: body?.newPassword,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}

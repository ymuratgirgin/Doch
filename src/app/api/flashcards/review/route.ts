import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordReview } from "@/lib/flashcards";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { progressId, knew } = await req.json().catch(() => ({}));
  if (typeof progressId !== "string" || typeof knew !== "boolean") {
    return NextResponse.json({ error: "progressId and knew are required" }, { status: 400 });
  }

  try {
    await recordReview(user.id, progressId, knew);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStudyQueue } from "@/lib/flashcards";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const queue = await getStudyQueue(user.id);
  return NextResponse.json(queue);
}

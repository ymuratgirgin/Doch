import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { synthesizeGermanSpeech } from "@/lib/tts";

// Generation can take a few seconds for a longer Hörverstehen Teil 2
// script split into multiple chunks — comfortably under Vercel's default
// limits, but stated explicitly since the exam-generate route needs the
// same treatment for a similar reason.
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  if (!process.env.GOOGLE_TTS_API_KEY) {
    return NextResponse.json(
      { error: "Text-to-speech is not configured on the server." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  try {
    const audio = await synthesizeGermanSpeech(text);
    return new NextResponse(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    // The client only shows a generic fallback message when this fails
    // (see ListeningPlayer) — log the real reason server-side so a 502
    // here is actually diagnosable from Vercel's runtime logs instead of
    // just showing up as an opaque status code.
    console.error(`[tts] synthesis failed: ${reason}`);
    return NextResponse.json({ error: `Speech synthesis failed: ${reason}` }, { status: 502 });
  }
}

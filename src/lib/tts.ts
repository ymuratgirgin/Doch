// Server-side wrapper around Google Cloud Text-to-Speech's REST API, used
// to give Hörverstehen scripts real, natural-sounding audio instead of
// relying on the learner's browser's built-in (often robotic) voice.
//
// Google's REST endpoint caps each request's input at 5000 bytes of UTF-8
// text — a Hörverstehen Teil 2 interview script (~450-600 words) can get
// close to that, so long text is split into sentence-aligned chunks under
// the cap and the resulting MP3s are concatenated. Raw MP3 frames
// concatenate cleanly and play back as one continuous stream in a
// standard <audio> element.

const MAX_CHUNK_BYTES = 4500; // headroom under Google's 5000-byte cap
const VOICE_NAME = "de-DE-Neural2-B";

function utf8ByteLength(text: string): number {
  return Buffer.byteLength(text, "utf-8");
}

function splitIntoChunks(text: string): string[] {
  if (utf8ByteLength(text) <= MAX_CHUNK_BYTES) return [text];

  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (current && utf8ByteLength(candidate) > MAX_CHUNK_BYTES) {
      chunks.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function synthesizeChunk(text: string, apiKey: string): Promise<Buffer> {
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "de-DE", name: VOICE_NAME },
        audioConfig: { audioEncoding: "MP3", speakingRate: 0.95 },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google TTS request failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { audioContent: string };
  return Buffer.from(data.audioContent, "base64");
}

export async function synthesizeGermanSpeech(text: string): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_TTS_API_KEY is not configured");

  const chunks = splitIntoChunks(text);
  const buffers = await Promise.all(chunks.map((chunk) => synthesizeChunk(chunk, apiKey)));
  return Buffer.concat(buffers);
}

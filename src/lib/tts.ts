// Server-side wrapper around Google Cloud Text-to-Speech's REST API, used
// to give Hörverstehen scripts real, natural-sounding audio instead of
// relying on the learner's browser's built-in (often robotic) voice.
//
// Google's REST endpoint caps each request's input at 5000 bytes of UTF-8
// text — a Hörverstehen Teil 2 interview script (~450-600 words) can get
// close to that, so long text is split into sentence-aligned chunks under
// the cap. The real telc exam uses multiple speakers (Teil 1's 5 different
// people, Teil 2's interviewer/interviewee dialogue) — per spec §3.6 the
// model labels each speaker "Herr <Name>:"/"Frau <Name>:", which is parsed
// here into ordered turns, each synthesized with a voice matching that
// speaker's gender (a distinct voice per person, not just per gender, and
// with no fixed pairing — two speakers can be the same gender). All the
// resulting MP3s are concatenated in order; raw MP3 frames concatenate
// cleanly and play back as one continuous stream in a standard <audio>
// element.

const MAX_CHUNK_BYTES = 4500; // headroom under Google's 5000-byte cap
const DEFAULT_VOICE = "de-DE-Neural2-B";
const MALE_VOICES = ["de-DE-Neural2-B", "de-DE-Neural2-D"];
const FEMALE_VOICES = ["de-DE-Neural2-A", "de-DE-Neural2-C", "de-DE-Neural2-F"];

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

// Hesitation interjections ("ähm", "äh", "hm") are natural in human speech
// but Google's voices don't recognize them as filled pauses — they read the
// letters as a mispronounced word instead. The spec tells the model to
// avoid these, but per this app's usual pattern of not fully trusting
// prompt compliance for anything checkable, strip any that slip through
// before synthesis rather than relying on it.
const FILLER_WORD = /^(ä?hm+|ä+h+|ehm+)[,.:;…]*$/i;

function stripFillerWords(text: string): string {
  return text
    .split(/\s+/)
    .filter((token) => !FILLER_WORD.test(token))
    .join(" ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/,(\s*,)+/g, ",")
    .trim();
}

type SpeakerTurn = { voice: string; text: string };

// Matches a speaker label at the start of a line, e.g. "Frau Keller:" or
// "Herr Bauer:" (per spec §3.6). Only the gender title is meaningful here —
// the name just distinguishes one "Herr" from another so each gets their
// own voice rather than collapsing onto a single shared male/female voice.
//
// The name portion is "whatever non-colon text follows Herr/Frau up to the
// next colon" (bounded to a sane length), not a single capitalized word —
// a title or a first+last name ("Frau Dr. Seiffert:", "Herr Klaus Mayer:")
// wouldn't match a stricter pattern at all, and when that happens the whole
// line — literal label included — falls through into the plain-text branch
// below and gets synthesized as spoken audio, so the TTS ends up reading
// the person's name/title out loud instead of it being parsed as a label.
// examSchema.ts's neutralizeSpeakerNames and ListeningPlayer.tsx's
// cleanScript use the identical shape for the same reason.
const SPEAKER_LABEL = /^(Herr|Frau)\s+[^\n:]{1,60}:\s*/;

function splitIntoSpeakerTurns(text: string): SpeakerTurn[] {
  // Replacing "(Pause)" with a period made sense when the whole script was
  // one continuous single-voice clip (it just added a natural mid-speech
  // beat) — but a pause marker almost always sits between two speakers'
  // turns, and now that each turn is synthesized separately, that period
  // ends up dangling alone at the end of a turn with nothing around it
  // (e.g. "...gefällt.\n\n."). Google reads an isolated period like that
  // literally as the word "Punkt". A pause between two separately
  // synthesized clips needs no marker at all, so just drop it.
  const withoutPauseMarkers = text.replace(/\(Pause\)/gi, " ");

  // Split right before each speaker-label line, keeping the label attached
  // to the text that follows it up to the next label (or end of script).
  const segments = withoutPauseMarkers.split(/(?=^(?:Herr|Frau)\s+[^\n:]{1,60}:)/m);

  const voiceByLabel = new Map<string, string>();
  let nextMaleIndex = 0;
  let nextFemaleIndex = 0;

  function voiceFor(label: string, gender: "Herr" | "Frau"): string {
    const existing = voiceByLabel.get(label);
    if (existing) return existing;
    const voice =
      gender === "Herr"
        ? MALE_VOICES[nextMaleIndex++ % MALE_VOICES.length]
        : FEMALE_VOICES[nextFemaleIndex++ % FEMALE_VOICES.length];
    voiceByLabel.set(label, voice);
    return voice;
  }

  const turns: SpeakerTurn[] = [];
  for (const segment of segments) {
    const match = segment.match(SPEAKER_LABEL);
    if (match) {
      const gender = match[1] as "Herr" | "Frau";
      const spokenText = stripFillerWords(segment.slice(match[0].length).trim());
      if (spokenText) turns.push({ voice: voiceFor(match[0], gender), text: spokenText });
    } else if (segment.trim()) {
      // No speaker label (Teil 3's impersonal announcements, or content
      // generated before this convention existed) — one flat default voice.
      const spokenText = stripFillerWords(segment.trim());
      if (spokenText) turns.push({ voice: DEFAULT_VOICE, text: spokenText });
    }
  }
  return turns.length > 0
    ? turns
    : [{ voice: DEFAULT_VOICE, text: stripFillerWords(withoutPauseMarkers.trim()) }];
}

async function synthesizeChunk(text: string, apiKey: string, voice: string): Promise<Buffer> {
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "de-DE", name: voice },
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

  const turns = splitIntoSpeakerTurns(text);
  const turnBuffers = await Promise.all(
    turns.map(async (turn) => {
      const chunks = splitIntoChunks(turn.text);
      const chunkBuffers = await Promise.all(
        chunks.map((chunk) => synthesizeChunk(chunk, apiKey, turn.voice))
      );
      return Buffer.concat(chunkBuffers);
    })
  );
  return Buffer.concat(turnBuffers);
}

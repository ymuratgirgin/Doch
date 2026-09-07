// Schreiben task prompts describe an intro sentence followed by the four
// Leitpunkte the reply must cover. Newer generations put each point on its
// own "\n- " line (per EXAM_JSON_INSTRUCTIONS); older exams — and occasional
// model variance — inline them instead ("... ein: - Punkt1 - Punkt2 ...").
// Normalize either shape into an intro plus a bullet list so the UI never
// has to guess at render time.
export function parseWritingPrompt(prompt: string): { intro: string; points: string[] } {
  const hasLineBullets = /\n\s*-\s+/.test(prompt);
  const normalized = hasLineBullets
    ? prompt
    : prompt.replace(/\s-\s+(?=[A-ZÄÖÜ])/g, "\n- ");
  const lines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const [intro, ...rest] = lines;
  const points = rest.map((l) => l.replace(/^-\s*/, ""));
  return points.length > 0 ? { intro: intro ?? "", points } : { intro: prompt, points: [] };
}

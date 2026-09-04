"use client";

import { useEffect, useRef, useState } from "react";

// Per spec §3.6: Hörverstehen Teil 1 is played once, Teil 2 and 3 twice.
function maxPlaysForTeil(teilLabel: string | null): number {
  if (teilLabel?.includes("Teil 1")) return 1;
  return 2;
}

export default function ListeningPlayer({
  script,
  teilLabel,
}: {
  script: string;
  teilLabel: string | null;
}) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [playing, setPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [supported] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window
  );
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const maxPlays = maxPlaysForTeil(teilLabel);

  useEffect(() => {
    if (!supported) return;
    function loadVoices() {
      setVoices(window.speechSynthesis.getVoices());
    }
    // Defer the initial read so it happens as a callback, not synchronously
    // within the effect body (voice lists also often aren't ready yet).
    const timer = setTimeout(loadVoices, 0);
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      clearTimeout(timer);
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  function play() {
    if (!supported || playCount >= maxPlays) return;
    const germanVoice =
      voices.find((v) => v.lang.startsWith("de")) ?? voices[0] ?? null;

    // Strip "(Pause)" markers and segment labels — those are for a real
    // TTS workflow's clip boundaries, not meant to be read aloud.
    const cleanText = script
      .replace(/\(Pause\)/gi, ". ")
      .replace(/^Text \d+:?/gim, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (germanVoice) utterance.voice = germanVoice;
    utterance.lang = germanVoice?.lang ?? "de-DE";
    utterance.rate = 0.95;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    utteranceRef.current = utterance;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
    setPlayCount((c) => c + 1);
  }

  function stop() {
    window.speechSynthesis.cancel();
    setPlaying(false);
  }

  if (!supported) {
    return (
      <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Your browser doesn&apos;t support built-in speech synthesis. You can
        still read the script below, or paste it into an external TTS tool.
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={playing ? stop : play}
          disabled={!playing && playCount >= maxPlays}
          className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {playing ? "Stop" : playCount >= maxPlays ? "No plays left" : "▶ Play"}
        </button>
        <span className="text-xs text-neutral-500">
          Played {playCount}/{maxPlays} time{maxPlays === 1 ? "" : "s"} — per
          the real exam, this Teil is played {maxPlays === 1 ? "once" : "twice"}.
        </span>
      </div>
    </div>
  );
}

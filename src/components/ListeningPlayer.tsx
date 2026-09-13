"use client";

import { useEffect, useRef, useState } from "react";

// Per spec §3.6: Hörverstehen Teil 1 is played once, Teil 2 and 3 twice.
function maxPlaysForTeil(teilLabel: string | null): number {
  if (teilLabel?.includes("Teil 1")) return 1;
  return 2;
}

// Strip "(Pause)" markers and segment labels — those are for a real TTS
// workflow's clip boundaries, not meant to be read/spoken aloud.
function cleanScript(script: string): string {
  return script
    .replace(/\(Pause\)/gi, ". ")
    .replace(/^Text \d+:?/gim, "")
    .trim();
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
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [serverError, setServerError] = useState(false);
  const [speechSupported] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window
  );
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const maxPlays = maxPlaysForTeil(teilLabel);

  useEffect(() => {
    if (!speechSupported) return;
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
  }, [speechSupported]);

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioElRef.current?.pause();
    };
  }, []);

  function playWithBrowserSpeech() {
    if (!speechSupported) return false;
    const germanVoice = voices.find((v) => v.lang.startsWith("de")) ?? voices[0] ?? null;

    const utterance = new SpeechSynthesisUtterance(cleanScript(script));
    if (germanVoice) utterance.voice = germanVoice;
    utterance.lang = germanVoice?.lang ?? "de-DE";
    utterance.rate = 0.95;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    utteranceRef.current = utterance;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  }

  function playCachedAudio(url: string) {
    const audio = new Audio(url);
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    audioElRef.current = audio;
    void audio.play();
  }

  async function play() {
    if (playCount >= maxPlays || loadingAudio) return;

    if (audioUrlRef.current) {
      setPlaying(true);
      setPlayCount((c) => c + 1);
      playCachedAudio(audioUrlRef.current);
      return;
    }

    if (!serverError) {
      setLoadingAudio(true);
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cleanScript(script) }),
        });
        if (!res.ok) throw new Error("tts request failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        setLoadingAudio(false);
        setPlaying(true);
        setPlayCount((c) => c + 1);
        playCachedAudio(url);
        return;
      } catch {
        // Server TTS isn't configured/reachable — remember that for this
        // card so we don't retry it on every play, and fall back below.
        setServerError(true);
        setLoadingAudio(false);
      }
    }

    if (playWithBrowserSpeech()) {
      setPlaying(true);
      setPlayCount((c) => c + 1);
    }
  }

  function stop() {
    audioElRef.current?.pause();
    window.speechSynthesis?.cancel();
    setPlaying(false);
  }

  if (!speechSupported && serverError) {
    return (
      <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Playback isn&apos;t available right now. You can still read the
        script below, or download it to use with an external TTS tool.
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={playing ? stop : play}
          disabled={loadingAudio || (!playing && playCount >= maxPlays)}
          className="rounded-md bg-orange-300 px-3 py-1.5 text-sm font-medium text-orange-950 hover:bg-orange-400 disabled:opacity-50"
        >
          {loadingAudio
            ? "Loading…"
            : playing
              ? "Stop"
              : playCount >= maxPlays
                ? "No plays left"
                : "▶ Play"}
        </button>
        <span className="text-xs text-neutral-500">
          Played {playCount}/{maxPlays} time{maxPlays === 1 ? "" : "s"} — per
          the real exam, this Teil is played {maxPlays === 1 ? "once" : "twice"}.
        </span>
      </div>
    </div>
  );
}

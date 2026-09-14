"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/LanguageProvider";

// Per spec §3.6: Hörverstehen Teil 1 is played once, Teil 2 and 3 twice.
function maxPlaysForTeil(teilLabel: string | null): number {
  if (teilLabel?.includes("Teil 1")) return 1;
  return 2;
}

// Strip "(Pause)" markers, segment labels, and "Herr/Frau Name:" speaker
// labels — those are script directions for splitting into per-speaker TTS
// clips (see src/lib/tts.ts), not meant to be read aloud. Only used for the
// single-voice browser-speech fallback; the server TTS path needs the raw
// script (speaker labels intact) to assign each person their own voice.
//
// The name portion matches up to the next colon rather than a single
// capitalized word, so a title or first+last name ("Frau Dr. Seiffert:")
// still gets recognized and stripped instead of leaking into the spoken
// text — see the matching comment in src/lib/tts.ts's SPEAKER_LABEL.
function cleanScript(script: string): string {
  return script
    .replace(/\(Pause\)/gi, ". ")
    .replace(/^Text \d+:?/gim, "")
    .replace(/^(Herr|Frau)\s+[^\n:]{1,60}:\s*/gim, "")
    .trim();
}

export default function ListeningPlayer({
  script,
  teilLabel,
  unlimited = false,
}: {
  script: string;
  teilLabel: string | null;
  // For post-exam review: the real exam only lets you hear each Teil once
  // or twice, but once the exam is over there's no reason to keep enforcing
  // that — allow unlimited fresh listens too. Pausing and resuming (see
  // below) is always free in both modes, exam or review.
  unlimited?: boolean;
}) {
  const { t } = useI18n();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [playing, setPlaying] = useState(false);
  // True once a listen has been paused mid-way (not finished, not fresh) —
  // resuming it is free and doesn't touch playCount, unlike starting a new
  // listen from the very beginning.
  const [paused, setPaused] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [serverError, setServerError] = useState(false);
  const [speechSupported] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window
  );
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const maxPlays = unlimited ? Infinity : maxPlaysForTeil(teilLabel);

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
    utterance.onend = () => {
      setPlaying(false);
      setPaused(false);
    };
    utterance.onerror = () => {
      setPlaying(false);
      setPaused(false);
    };
    utteranceRef.current = utterance;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  }

  // Always a fresh listen from the start — used whenever play() decides
  // this isn't a resume (see there). A new element each time keeps this
  // simple and avoids any lingering state from a previous listen.
  function playFreshCachedAudio(url: string) {
    const audio = new Audio(url);
    audio.onended = () => {
      setPlaying(false);
      setPaused(false);
    };
    audio.onerror = () => {
      setPlaying(false);
      setPaused(false);
    };
    audioElRef.current = audio;
    void audio.play();
  }

  async function play() {
    if (loadingAudio) return;

    // Resume a paused, not-yet-finished listen in place — this is always
    // free (doesn't touch playCount) in both exam and review mode, since
    // it's the same listen continuing, not a new one.
    if (audioElRef.current && !audioElRef.current.ended && audioElRef.current.currentTime > 0) {
      setPlaying(true);
      setPaused(false);
      void audioElRef.current.play();
      return;
    }
    if (speechSupported && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPlaying(true);
      setPaused(false);
      return;
    }

    // Anything past this point starts a brand-new listen from the
    // beginning, which is what the once/twice cap actually limits.
    if (playCount >= maxPlays) return;

    if (audioUrlRef.current) {
      setPlaying(true);
      setPlayCount((c) => c + 1);
      playFreshCachedAudio(audioUrlRef.current);
      return;
    }

    if (!serverError) {
      setLoadingAudio(true);
      try {
        // Send the raw script, not cleanScript(script) — the server needs
        // the "Herr/Frau Name:" speaker labels intact to assign each
        // person a distinct voice (see splitIntoSpeakerTurns in
        // src/lib/tts.ts). It strips its own pause/label markers.
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: script }),
        });
        if (!res.ok) throw new Error("tts request failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        setLoadingAudio(false);
        setPlaying(true);
        setPlayCount((c) => c + 1);
        playFreshCachedAudio(url);
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

  // Pauses in place — never a full stop. Resuming (see play() above) picks
  // up right where this left off and doesn't cost another play.
  function pause() {
    audioElRef.current?.pause();
    if (speechSupported) window.speechSynthesis.pause();
    setPlaying(false);
    setPaused(true);
  }

  if (!speechSupported && serverError) {
    return (
      <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        {t.listening.playbackUnavailable}
      </p>
    );
  }

  const outOfPlays = !paused && playCount >= maxPlays;

  return (
    <div className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={playing ? pause : play}
          disabled={loadingAudio || (!playing && outOfPlays)}
          className="rounded-md bg-orange-300 px-3 py-1.5 text-sm font-medium text-orange-950 hover:bg-orange-400 disabled:opacity-50"
        >
          {loadingAudio
            ? t.listening.loading
            : playing
              ? t.listening.pause
              : outOfPlays
                ? t.listening.noPlaysLeft
                : t.listening.play}
        </button>
        {!unlimited && (
          <span className="text-xs text-neutral-500">{t.listening.playedTimes(playCount, maxPlays)}</span>
        )}
      </div>
    </div>
  );
}

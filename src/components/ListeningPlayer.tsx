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
  // or twice and never lets you pause, but once the exam is over there's no
  // reason to keep enforcing that — allow unlimited replays with a real
  // pause/resume (not just stop-and-restart) for the learner's convenience.
  unlimited?: boolean;
}) {
  const { t } = useI18n();
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
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    utteranceRef.current = utterance;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  }

  function playCachedAudio(url: string) {
    // In unlimited/review mode, reuse the same <audio> element when it's
    // already loaded with this url so pressing play after pause resumes
    // from where it left off instead of restarting. During the timed exam
    // (unlimited=false) each explicit play() is a fresh, fully-counted
    // listen, so that case keeps creating a new element every time.
    if (unlimited && audioElRef.current && audioElRef.current.src === url) {
      void audioElRef.current.play();
      return;
    }
    const audio = new Audio(url);
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    audioElRef.current = audio;
    void audio.play();
  }

  async function play() {
    if (!unlimited && (playCount >= maxPlays || loadingAudio)) return;
    if (unlimited && loadingAudio) return;

    if (audioUrlRef.current) {
      setPlaying(true);
      if (!unlimited) setPlayCount((c) => c + 1);
      playCachedAudio(audioUrlRef.current);
      return;
    }

    // Resume a paused browser-speech utterance in place rather than
    // restarting it from the beginning.
    if (unlimited && speechSupported && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPlaying(true);
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
        if (!unlimited) setPlayCount((c) => c + 1);
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
      if (!unlimited) setPlayCount((c) => c + 1);
    }
  }

  // Timed-exam mode: fully abandon playback (can't resume — each play() is
  // a separate counted listen anyway).
  function stop() {
    audioElRef.current?.pause();
    window.speechSynthesis?.cancel();
    setPlaying(false);
  }

  // Review mode: pause in place, keeping position for a true resume.
  function pause() {
    audioElRef.current?.pause();
    if (speechSupported) window.speechSynthesis.pause();
    setPlaying(false);
  }

  if (!speechSupported && serverError) {
    return (
      <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        {t.listening.playbackUnavailable}
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={playing ? (unlimited ? pause : stop) : play}
          disabled={loadingAudio || (!unlimited && !playing && playCount >= maxPlays)}
          className="rounded-md bg-orange-300 px-3 py-1.5 text-sm font-medium text-orange-950 hover:bg-orange-400 disabled:opacity-50"
        >
          {loadingAudio
            ? t.listening.loading
            : playing
              ? unlimited
                ? t.listening.pause
                : t.listening.stop
              : !unlimited && playCount >= maxPlays
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

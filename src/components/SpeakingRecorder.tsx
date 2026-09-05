"use client";

import { useEffect, useRef, useState } from "react";

// Minimal ambient shape for the Web Speech "SpeechRecognition" API — not
// part of the standard TS DOM lib, and shipped prefixed in some browsers.
interface SpeechRecognitionResultLike {
  [index: number]: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function SpeakingRecorder({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [supported] = useState(() => getSpeechRecognitionConstructor() !== null);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const baseTextRef = useRef("");
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function start() {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = true;
    baseTextRef.current = valueRef.current ? valueRef.current + " " : "";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onChange((baseTextRef.current + transcript).trim());
    };
    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  function stop() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="space-y-2">
      {supported ? (
        <button
          type="button"
          onClick={recording ? stop : start}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            recording
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-orange-300 text-orange-950 hover:bg-orange-400"
          }`}
        >
          {recording ? "⏹ Stop recording" : "🎤 Record your answer (Deutsch)"}
        </button>
      ) : (
        <p className="text-xs text-amber-700">
          Speech-to-text isn&apos;t supported in this browser — type your
          answer instead.
        </p>
      )}
      <textarea
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your spoken answer appears here as text — review and edit before submitting."
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

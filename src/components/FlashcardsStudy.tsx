"use client";

import { useEffect, useState } from "react";

type FlashCard = {
  progressId: string;
  word: string;
  wordType: string | null;
  article: string | null;
  exampleSentence: string | null;
  status: string;
  boxLevel: number;
  reason: string;
};

export default function FlashcardsStudy() {
  const [cards, setCards] = useState<FlashCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function loadQueue() {
    const res = await fetch("/api/flashcards/queue");
    const data = await res.json();
    setCards(data);
    setIndex(0);
    setFlipped(false);
  }

  useEffect(() => {
    // loadQueue's setState calls all happen after an awaited fetch, not
    // synchronously within this effect — safe despite the lint heuristic.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadQueue();
  }, []);

  async function review(knew: boolean) {
    const card = cards?.[index];
    if (!card) return;
    await fetch("/api/flashcards/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progressId: card.progressId, knew }),
    });
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  async function addWord(e: React.FormEvent) {
    e.preventDefault();
    if (!newWord.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch("/api/vocab/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: newWord.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add word");
      setNewWord("");
      await loadQueue();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Flashcards</h1>
          <p className="mt-1 text-neutral-600">
            Prioritized from words you&apos;ve used incorrectly, words due
            for review, and words you&apos;ve added yourself.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm((s) => !s)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
        >
          {showAddForm ? "Close" : "+ Add word"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={addWord} className="flex gap-2 rounded-md border border-neutral-200 bg-white p-3">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Type a German word…"
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={adding || !newWord.trim()}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add"}
          </button>
        </form>
      )}
      {addError && <p className="text-sm text-red-600">{addError}</p>}

      {cards === null ? (
        <p className="text-neutral-500">Loading…</p>
      ) : cards.length === 0 ? (
        <p className="rounded-md border border-neutral-200 bg-white px-4 py-6 text-center text-neutral-500">
          No words in your bank yet. Take a writing exam or add a word above
          to get started.
        </p>
      ) : index >= cards.length ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-6 text-center text-green-900">
          <p className="font-medium">Session complete — nice work!</p>
          <button
            onClick={loadQueue}
            className="mt-3 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Start another session
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">
            Card {index + 1} of {cards.length}
          </p>
          <div
            onClick={() => setFlipped((f) => !f)}
            className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-white p-8 text-center"
          >
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
              {cards[index].reason}
            </span>
            <p className="text-2xl font-semibold">
              {[cards[index].article, cards[index].word].filter(Boolean).join(" ")}
            </p>
            {flipped ? (
              <div className="space-y-2">
                {cards[index].exampleSentence ? (
                  <p className="text-lg italic text-neutral-700">
                    {cards[index].exampleSentence}
                  </p>
                ) : (
                  <p className="text-sm text-neutral-400">No example yet</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-neutral-400">Click to reveal</p>
            )}
          </div>

          {flipped && (
            <div className="flex justify-center gap-3">
              <button
                onClick={() => review(false)}
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Nochmal (didn&apos;t know)
              </button>
              <button
                onClick={() => review(true)}
                className="rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
              >
                Kannte ich (knew it)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

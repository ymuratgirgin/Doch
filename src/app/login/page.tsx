"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [existingUsers, setExistingUsers] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/users")
      .then((res) => res.json())
      .then(setExistingUsers)
      .catch(() => {});
  }, []);

  async function login(chosenName: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: chosenName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Doch!</h1>
        <p className="mt-1 text-neutral-600">
          Enter your name to continue. No password — this is a lightweight
          login for a small group of testers.
        </p>
      </div>

      {existingUsers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-700">
            Continue as:
          </p>
          <div className="flex flex-wrap gap-2">
            {existingUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => login(u.name)}
                disabled={loading}
                className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:opacity-50"
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          login(name);
        }}
        className="space-y-2"
      >
        <label className="block text-sm font-medium text-neutral-700">
          {existingUsers.length > 0 ? "Or use a new name" : "Your name"}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ayşe"
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="rounded-md bg-orange-300 px-4 py-2 text-sm font-medium text-orange-950 hover:bg-orange-400 disabled:opacity-50"
          >
            {loading ? "…" : "Continue"}
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

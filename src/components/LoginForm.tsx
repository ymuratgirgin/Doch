"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
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
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6 rounded-2xl border border-blue-100 bg-blue-50 p-6">
      <p className="text-center text-sm text-neutral-600">
        Enter your name to continue. No password — this is a lightweight
        login for a small group of testers.
      </p>

      {existingUsers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-700">Continue as:</p>
          <div className="flex flex-wrap gap-2">
            {existingUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => login(u.name)}
                disabled={loading}
                className="rounded-md border border-blue-200 bg-white px-3 py-1.5 text-sm hover:bg-blue-100 disabled:opacity-50"
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
            className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-base"
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="shrink-0 rounded-md bg-orange-300 px-4 py-2 text-sm font-medium text-orange-950 hover:bg-orange-400 disabled:opacity-50"
          >
            {loading ? "…" : "Continue"}
          </button>
        </div>
      </form>

      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}

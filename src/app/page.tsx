import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { computeStreak } from "@/lib/streak";
import LoginForm from "@/components/LoginForm";

const SECTIONS: { href: string; emoji: string; title: string; description: string }[] = [
  {
    href: "/exams",
    emoji: "📝",
    title: "Mock Exam",
    description: "Generate a fresh telc B1 practice exam and take it",
  },
  {
    href: "/flashcards",
    emoji: "🗂️",
    title: "Flashcards",
    description: "Review vocabulary, prioritized by what you need most",
  },
  {
    href: "/mistakes",
    emoji: "💡",
    title: "Learn from Mistakes",
    description: "Grouped explanations with fresh examples",
  },
  {
    href: "/progress",
    emoji: "📊",
    title: "Statistics",
    description: "Scores, streaks, and vocabulary growth over time",
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const streak = user ? await computeStreak(user.id) : 0;

  return (
    <div className="space-y-10">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-bold text-blue-900">Doch!</h1>
        {user ? (
          <p className="text-neutral-500">Willkommen, {user.name}</p>
        ) : (
          <p className="text-neutral-500">
            Practice for the telc B1 German exam with fresh, LLM-generated
            mock exams and instant feedback.
          </p>
        )}
        {user && streak > 0 && (
          <div className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-800">
            🔥 {streak} day{streak === 1 ? "" : "s"} streak
          </div>
        )}
      </div>

      {!user && <LoginForm />}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {SECTIONS.map((s) =>
          user ? (
            <Link
              key={s.href}
              href={s.href}
              className="flex flex-col items-start gap-2 rounded-2xl border border-blue-200 bg-blue-50 p-6 transition hover:border-blue-300 hover:bg-blue-100 hover:shadow-md"
            >
              <span className="text-3xl">{s.emoji}</span>
              <span className="text-lg font-semibold text-neutral-900">{s.title}</span>
              <span className="text-sm text-neutral-600">{s.description}</span>
            </Link>
          ) : (
            <div
              key={s.href}
              className="flex flex-col items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50/50 p-6 opacity-60"
            >
              <span className="text-3xl">{s.emoji}</span>
              <span className="text-lg font-semibold text-neutral-900">{s.title}</span>
              <span className="text-sm text-neutral-600">{s.description}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

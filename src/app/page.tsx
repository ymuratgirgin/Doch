import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { computeStreak } from "@/lib/streak";

const SECTIONS: {
  href: string;
  emoji: string;
  title: string;
  description: string;
  tone: "orange" | "blue";
}[] = [
  {
    href: "/exams",
    emoji: "📝",
    title: "Mock Exam",
    description: "Generate a fresh telc B1 practice exam and take it",
    tone: "orange",
  },
  {
    href: "/flashcards",
    emoji: "🗂️",
    title: "Flashcards",
    description: "Review vocabulary, prioritized by what you need most",
    tone: "blue",
  },
  {
    href: "/mistakes",
    emoji: "💡",
    title: "Learn from Mistakes",
    description: "Grouped explanations with fresh examples",
    tone: "orange",
  },
  {
    href: "/progress",
    emoji: "📊",
    title: "Statistics",
    description: "Scores, streaks, and vocabulary growth over time",
    tone: "blue",
  },
];

const TONE_CLASSES: Record<"orange" | "blue", string> = {
  orange: "border-orange-200 bg-orange-50 hover:border-orange-300 hover:bg-orange-100",
  blue: "border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100",
};

export default async function HomePage() {
  const user = await requireUser();
  const streak = await computeStreak(user.id);

  return (
    <div className="space-y-10">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-bold text-blue-900">Doch!</h1>
        <p className="text-neutral-500">Willkommen, {user.name}</p>
        {streak > 0 && (
          <div className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-800">
            🔥 {streak} day{streak === 1 ? "" : "s"} streak
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`flex flex-col items-start gap-2 rounded-2xl border p-6 transition hover:shadow-md ${TONE_CLASSES[s.tone]}`}
          >
            <span className="text-3xl">{s.emoji}</span>
            <span className="text-lg font-semibold text-neutral-900">{s.title}</span>
            <span className="text-sm text-neutral-600">{s.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

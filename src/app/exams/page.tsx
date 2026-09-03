import Link from "next/link";
import { prisma } from "@/lib/prisma";
import GenerateExamButton from "@/components/GenerateExamButton";

export default async function ExamsPage() {
  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { parts: true, attempts: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Exams</h1>
          <p className="mt-1 text-neutral-600">
            Generate a new Telc B1 mock exam or resume one below.
          </p>
        </div>
        <GenerateExamButton />
      </div>

      {exams.length === 0 ? (
        <p className="rounded-md border border-neutral-200 bg-white px-4 py-6 text-center text-neutral-500">
          No exams yet. Generate one to get started.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
          {exams.map((exam) => (
            <li key={exam.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <Link href={`/exams/${exam.id}`} className="font-medium hover:underline">
                  {exam.title}
                </Link>
                <div className="text-sm text-neutral-500">
                  Level {exam.level} · {exam._count.parts} parts ·{" "}
                  {exam._count.attempts} attempt
                  {exam._count.attempts === 1 ? "" : "s"}
                </div>
              </div>
              <Link
                href={`/exams/${exam.id}`}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
              >
                Open
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

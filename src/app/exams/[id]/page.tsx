import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExamTaker from "@/components/ExamTaker";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      parts: {
        orderBy: { order: "asc" },
        include: { questions: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!exam) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{exam.title}</h1>
        <p className="mt-1 text-neutral-600">Level {exam.level}</p>
      </div>
      <ExamTaker exam={exam} />
    </div>
  );
}

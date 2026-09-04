import { prisma } from "@/lib/prisma";

export default async function VocabPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string }>;
}) {
  const { q, level } = await searchParams;

  const words = await prisma.vocabWord.findMany({
    where: {
      level: level || undefined,
      ...(q ? { word: { contains: q } } : {}),
    },
    orderBy: { word: "asc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Vocabulary</h1>
        <p className="mt-1 text-neutral-600">
          {words.length} word{words.length === 1 ? "" : "s"} shown (max 200).
        </p>
      </div>

      <form className="flex gap-2" action="/vocab">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search word…"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          Search
        </button>
      </form>

      {words.length === 0 ? (
        <p className="rounded-md border border-neutral-200 bg-white px-4 py-6 text-center text-neutral-500">
          No vocabulary loaded yet. Seed the database from your Telc/Goethe
          B1 word list (see <code>prisma/seed.ts</code>).
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-600">
              <tr>
                <th className="px-4 py-2">Word</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Example</th>
                <th className="px-4 py-2">Topic</th>
              </tr>
            </thead>
            <tbody>
              {words.map((w) => (
                <tr key={w.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 font-medium">
                    {[w.article, w.word].filter(Boolean).join(" ")}
                  </td>
                  <td className="px-4 py-2 text-neutral-500">{w.wordType}</td>
                  <td className="px-4 py-2 italic text-neutral-600">{w.exampleSentence}</td>
                  <td className="px-4 py-2 text-neutral-500">{w.topic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

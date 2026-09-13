import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/getLocale";
import { dictionaries } from "@/lib/i18n";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default async function VocabPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string; letter?: string }>;
}) {
  const { q, level, letter } = await searchParams;
  const locale = await getLocale();
  const t = dictionaries[locale];

  const wordFilter =
    q || letter
      ? {
          ...(q ? { contains: q } : {}),
          ...(letter ? { startsWith: letter, mode: "insensitive" as const } : {}),
        }
      : undefined;

  const words = await prisma.vocabWord.findMany({
    where: {
      level: level || undefined,
      ...(wordFilter ? { word: wordFilter } : {}),
    },
  });

  // German nouns are capitalized and everything else isn't, so a plain SQL
  // ORDER BY (byte/collation order, uppercase before lowercase) clusters all
  // nouns before every other word type instead of a true A-Z listing. Sort
  // case-insensitively with German collation rules instead.
  words.sort((a, b) => a.word.localeCompare(b.word, "de", { sensitivity: "accent" }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.vocabPage.title}</h1>
        <p className="mt-1 text-neutral-600">{t.vocabPage.wordCount(words.length)}</p>
      </div>

      <form className="flex gap-2" action="/vocab">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder={t.vocabPage.searchPlaceholder}
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-orange-300 px-4 py-2 text-sm font-medium text-orange-950 hover:bg-orange-400"
        >
          {t.vocabPage.searchBtn}
        </button>
      </form>

      <div className="flex flex-wrap gap-1 text-sm">
        <Link
          href="/vocab"
          className={`rounded-md px-2 py-1 ${
            !letter ? "bg-blue-200 font-semibold text-blue-900" : "text-blue-700 hover:bg-blue-50"
          }`}
        >
          {t.vocabPage.all}
        </Link>
        {ALPHABET.map((l) => (
          <Link
            key={l}
            href={`/vocab?letter=${l}`}
            className={`rounded-md px-2 py-1 ${
              letter?.toUpperCase() === l
                ? "bg-blue-200 font-semibold text-blue-900"
                : "text-blue-700 hover:bg-blue-50"
            }`}
          >
            {l}
          </Link>
        ))}
      </div>

      {words.length === 0 ? (
        <p className="rounded-md border border-neutral-200 bg-white px-4 py-6 text-center text-neutral-500">
          {t.vocabPage.noVocab}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-600">
              <tr>
                <th className="px-4 py-2">{t.vocabPage.colWord}</th>
                <th className="px-4 py-2">{t.vocabPage.colType}</th>
                <th className="px-4 py-2">{t.vocabPage.colTurkish}</th>
                <th className="px-4 py-2">{t.vocabPage.colExamples}</th>
              </tr>
            </thead>
            <tbody>
              {words.map((w) => (
                <tr key={w.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 font-medium">
                    {[w.article, w.word].filter(Boolean).join(" ")}
                  </td>
                  <td className="px-4 py-2 text-neutral-500">{w.wordType}</td>
                  <td className="px-4 py-2 text-blue-700">{w.translationTr}</td>
                  <td className="px-4 py-2 italic text-neutral-600">
                    {w.exampleSentences.map((s, i) => (
                      <p key={i}>{s}</p>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

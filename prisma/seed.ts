// Seeds the VocabWord table from the user's Telc/Goethe B1 word list.
//
// This is a placeholder: point SOURCE_FILE at the vocabulary export once
// it's available (CSV or JSON with columns/fields: word, wordType, article,
// translation, exampleSentence, topic) and adjust the parsing below to
// match its actual shape.

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(
    "No vocabulary source wired up yet. Add your Telc/Goethe B1 word " +
      "list under data/ and implement the import here."
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

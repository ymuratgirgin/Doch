import { requireUser } from "@/lib/auth";
import FlashcardsStudy from "@/components/FlashcardsStudy";

export default async function FlashcardsPage() {
  await requireUser();
  return <FlashcardsStudy />;
}

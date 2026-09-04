import "server-only";
import { cookies } from "next/headers";

// Deliberately simple: the cookie just holds the user's id. This is
// appropriate for a handful of trusted testers on a private deployment,
// not for public use — swap in a real auth library before that.
const COOKIE_NAME = "session_user_id";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME };

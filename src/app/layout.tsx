import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import ActivityHeartbeat from "@/components/ActivityHeartbeat";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Telc B1 Trainer",
  description: "Mock exam generator and evaluator for the Telc B1 German exam",
};

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/exams", label: "Exams" },
  { href: "/vocab", label: "Vocabulary" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/mistakes", label: "Mistakes" },
  { href: "/progress", label: "Progress" },
];

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        {user && <ActivityHeartbeat />}
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
            <span className="font-semibold">Telc B1 Trainer</span>
            {user && (
              <nav className="flex flex-1 gap-4 text-sm">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-neutral-600 hover:text-neutral-900"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
            {user && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-neutral-500">{user.name}</span>
                <LogoutButton />
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}

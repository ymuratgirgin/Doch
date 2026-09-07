import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import MobileNav from "@/components/MobileNav";
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
  title: "Doch!",
  description: "Mock exam generator and evaluator for the Telc B1 German exam",
};

const navLinks = [
  { href: "/exams", label: "Mock Exam" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/mistakes", label: "Learn from Mistakes" },
  { href: "/progress", label: "Statistics" },
];

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        {user && <ActivityHeartbeat />}
        <header className="relative border-b border-blue-100 bg-blue-50">
          <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
            <Link href="/" className="text-lg font-bold text-blue-900 hover:text-orange-500">
              Doch!
            </Link>
            {user && (
              <nav className="hidden flex-1 gap-5 text-sm sm:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-blue-700 hover:text-blue-900"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
            {user && (
              <div className="ml-auto flex items-center gap-3 text-sm">
                <div className="hidden items-center gap-3 sm:flex">
                  <span className="text-blue-700">{user.name}</span>
                  <LogoutButton />
                </div>
                <MobileNav navLinks={navLinks} userName={user.name} />
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

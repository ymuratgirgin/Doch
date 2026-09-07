"use client";

import Link from "next/link";
import { useState } from "react";
import LogoutButton from "@/components/LogoutButton";

export default function MobileNav({
  navLinks,
  userName,
}: {
  navLinks: { href: string; label: string }[];
  userName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-md text-blue-900"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-20 border-b border-blue-100 bg-blue-50 px-4 py-3 shadow-sm">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center rounded-md px-2 text-base text-blue-700 hover:bg-blue-100 hover:text-blue-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 flex items-center justify-between border-t border-blue-100 px-2 pt-3 text-sm">
            <span className="text-blue-700">{userName}</span>
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}

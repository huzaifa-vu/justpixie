"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-transparent border-t border-[var(--border)] py-16 px-6 relative z-10">
      <div className="max-w-5xl ml-auto mr-auto grid grid-cols-1 md:grid-cols-4 gap-10 items-start">
        {/* Branding Column */}
        <div className="flex flex-col gap-4 md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[var(--gentle-lilac)] to-[var(--mint-green)] flex items-center justify-center">
              <Sparkles className="h-4.5 w-4.5 text-neutral-900" />
            </div>
            <span className="font-extrabold text-base text-[var(--foreground)] tracking-tight">
              Just<span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--pixie-teal)] to-[var(--gentle-lilac)]">Pixie</span>
            </span>
          </div>
          <p className="text-[var(--text-muted)] text-xs leading-relaxed max-w-sm font-sans font-medium">
            Tell Pixie what you need. We find the right tool and process your files locally — no uploads, no accounts, no limits.
          </p>
        </div>

        {/* Links Column 1 */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] font-sans">Spells</h4>
          <ul className="flex flex-col gap-2 p-0 m-0 list-none font-sans font-semibold">
            <li>
              <Link href="/dashboard/image" className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors text-decoration-none">
                Image Spells
              </Link>
            </li>
            <li>
              <Link href="/dashboard/pdf" className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors text-decoration-none">
                PDF Spells
              </Link>
            </li>
            <li>
              <Link href="/dashboard/video" className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors text-decoration-none">
                Video Alchemy
              </Link>
            </li>
            <li>
              <Link href="/dashboard/dev" className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors text-decoration-none">
                Dev Utilities
              </Link>
            </li>
            <li>
              <Link href="/dashboard/text" className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors text-decoration-none">
                Text & Data Spells
              </Link>
            </li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] font-sans">Legal</h4>
          <ul className="flex flex-col gap-2 p-0 m-0 list-none font-sans font-semibold">
            <li>
              <Link href="#" className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors text-decoration-none">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="#" className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors text-decoration-none">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-5xl ml-auto mr-auto border-t border-[var(--border)] mt-12 pt-8 flex items-center justify-between text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider font-sans">
        <span>&copy; {new Date().getFullYear()} Pixie Magic. All rights reserved.</span>
        <span>Made with Local WASM</span>
      </div>
    </footer>
  );
}

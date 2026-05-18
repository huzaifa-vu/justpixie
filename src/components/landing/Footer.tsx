"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import Image from "next/image";

export default function Footer() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="w-full bg-transparent border-t border-[var(--border)] py-16 px-6 relative z-10">
      <div className="max-w-5xl ml-auto mr-auto grid grid-cols-1 md:grid-cols-4 gap-10 items-start">
        {/* Branding Column */}
        <div className="flex flex-col gap-4 md:col-span-2">
          <div className="flex items-center gap-2">
            <Image 
              src={mounted && (theme === "dark" || resolvedTheme === "dark") ? "/logo-full-dark.png" : "/logo-full.png"}
              alt="Pixie Logo" 
              width={120} 
              height={47} 
              className="h-8 w-auto object-contain"
            />
          </div>
          <p className="text-[var(--text-muted)] text-xs leading-relaxed max-w-sm font-sans font-medium">
            Tell Pixie what you want to do. We find the right tool instantly. Everything runs safely on your computer — no uploads, no sign ups.
          </p>
        </div>

        {/* Links Column 1 */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] font-sans">All Tools</h4>
          <ul className="flex flex-col gap-2 p-0 m-0 list-none font-sans font-semibold">
            <li>
              <Link href="/dashboard/image" className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors text-decoration-none">
                Image Tools
              </Link>
            </li>
            <li>
              <Link href="/dashboard/pdf" className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors text-decoration-none">
                PDF Tools
              </Link>
            </li>
            <li>
              <Link href="/dashboard/video" className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors text-decoration-none">
                Video Tools
              </Link>
            </li>
            <li>
              <Link href="/dashboard/dev" className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors text-decoration-none">
                Developer Tools
              </Link>
            </li>
            <li>
              <Link href="/dashboard/text" className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors text-decoration-none">
                Text & List Tools
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
        <span>&copy; {new Date().getFullYear()} Pixie. All rights reserved.</span>
        <span>Runs safely on your computer</span>
      </div>
    </footer>
  );
}

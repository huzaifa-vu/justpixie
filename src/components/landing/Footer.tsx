"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#030303] border-t border-white/5 py-16 px-6 relative z-10">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 items-start">
        {/* Branding Column */}
        <div className="flex flex-col gap-4 md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-teal-500 flex items-center justify-center">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-extrabold text-base text-white tracking-tight">
              Just<span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-400">Pixie</span>
            </span>
          </div>
          <p className="text-neutral-500 text-xs leading-relaxed max-w-sm">
            Effortless, local, and magical file transformation power inside your browser. No server uploads. 100% private.
          </p>
        </div>

        {/* Links Column 1 */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Spells</h4>
          <ul className="flex flex-col gap-2 p-0 m-0 list-none">
            <li>
              <Link href="/dashboard/image" className="text-xs text-neutral-500 hover:text-white transition-colors text-decoration-none">
                Image Spells
              </Link>
            </li>
            <li>
              <Link href="/dashboard/pdf" className="text-xs text-neutral-500 hover:text-white transition-colors text-decoration-none">
                PDF Alchemy
              </Link>
            </li>
            <li>
              <Link href="/dashboard/video" className="text-xs text-neutral-500 hover:text-white transition-colors text-decoration-none">
                Video Alchemy
              </Link>
            </li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Legal</h4>
          <ul className="flex flex-col gap-2 p-0 m-0 list-none">
            <li>
              <Link href="#" className="text-xs text-neutral-500 hover:text-white transition-colors text-decoration-none">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="#" className="text-xs text-neutral-500 hover:text-white transition-colors text-decoration-none">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-5xl mx-auto border-t border-white/5 mt-12 pt-8 flex items-center justify-between text-neutral-600 text-[10px] uppercase font-bold tracking-wider">
        <span>&copy; {new Date().getFullYear()} Pixie Magic. All rights reserved.</span>
        <span>Made with Local WASM</span>
      </div>
    </footer>
  );
}

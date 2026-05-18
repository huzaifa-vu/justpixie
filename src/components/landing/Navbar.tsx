"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, LayoutDashboard, LogIn } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function Navbar() {
  const [session, setSession] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    fetchSession();
  }, []);

  return (
    <header className="fixed top-4 left-0 right-0 z-50 max-w-5xl mx-auto px-4">
      <div className="w-full h-16 rounded-full border border-white/10 bg-[#0a0a0a]/60 backdrop-blur-xl px-6 flex items-center justify-between shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer text-decoration-none">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-lg text-white tracking-tight font-sans">
            Just<span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-400">Pixie</span>
          </span>
        </Link>

        {/* Navigation Links (Hidden on small screens for premium cleanliness) */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="#features" className="text-xs font-semibold text-neutral-400 hover:text-white px-4 py-2 rounded-full hover:bg-white/[0.03] transition-all duration-200 text-decoration-none">
            Features
          </Link>
          <a href="#how-it-works" className="text-xs font-semibold text-neutral-400 hover:text-white px-4 py-2 rounded-full hover:bg-white/[0.03] transition-all duration-200 text-decoration-none">
            How it works
          </a>
          <Link href="/pricing" className="text-xs font-semibold text-neutral-400 hover:text-white px-4 py-2 rounded-full hover:bg-white/[0.03] transition-all duration-200 text-decoration-none">
            Pricing
          </Link>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {mounted && session ? (
            <Link href="/dashboard" className="text-decoration-none">
              <button className="flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black hover:bg-neutral-200 font-bold text-xs transition-all duration-200 cursor-pointer shadow-lg shadow-white/5">
                <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
              </button>
            </Link>
          ) : (
            <Link href="/login" className="text-decoration-none">
              <button className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-400 hover:to-teal-400 text-white font-bold text-xs transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-500/20">
                <LogIn className="h-3.5 w-3.5" /> Get Started
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

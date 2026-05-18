"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, LogIn, Menu, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useTheme } from "next-themes";
import Image from "next/image";

export default function Navbar() {
  const { theme, resolvedTheme } = useTheme();
  const [session, setSession] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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
    <header className="fixed top-4 left-0 right-0 z-50 max-w-5xl ml-auto mr-auto px-4">
      <div className="w-full h-16 rounded-[24px] border border-[var(--border)] bg-[var(--pure-white)]/60 backdrop-blur-xl px-6 flex items-center justify-between shadow-[var(--shadow-bento)] transition-all duration-300">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer text-decoration-none">
          <Image 
            src={mounted && (theme === "dark" || resolvedTheme === "dark") ? "/logo-full-dark.png" : "/logo-full.png"}
            alt="Pixie Logo" 
            width={120} 
            height={47} 
            priority 
            className="h-8 w-auto object-contain"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="#features" className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] px-4 py-2 rounded-full hover:bg-[var(--foreground)]/[0.04] transition-all duration-200 text-decoration-none">
            Features
          </Link>
          <a href="#how-it-works" className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] px-4 py-2 rounded-full hover:bg-[var(--foreground)]/[0.04] transition-all duration-200 text-decoration-none">
            How it works
          </a>
          <Link href="/pricing" className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] px-4 py-2 rounded-full hover:bg-[var(--foreground)]/[0.04] transition-all duration-200 text-decoration-none">
            Pricing
          </Link>
        </nav>

        {/* Action Button & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            {mounted && session ? (
              <Link href="/dashboard" className="text-decoration-none">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--foreground)] text-[var(--pure-white)] hover:opacity-90 font-bold text-xs transition-all duration-200 cursor-pointer shadow-sm">
                  <LayoutDashboard className="h-3.5 w-3.5" /> Go to Workspace
                </button>
              </Link>
            ) : (
              <Link href="/login" className="text-decoration-none">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--mint-green)] text-neutral-900 hover:opacity-90 font-bold text-xs transition-all duration-200 cursor-pointer shadow-sm shadow-[var(--mint-green)]/20">
                  <LogIn className="h-3.5 w-3.5" /> Get Started
                </button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-xl border border-[var(--border)] bg-[var(--pure-white)]/40 hover:bg-[var(--foreground)]/[0.04] cursor-pointer transition-colors"
          >
            {isOpen ? <X className="h-5 w-5 text-[var(--foreground)]" /> : <Menu className="h-5 w-5 text-[var(--foreground)]" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {isOpen && (
        <div className="absolute top-20 left-4 right-4 p-5 rounded-[24px] border border-[var(--border)] bg-[var(--pure-white)]/95 backdrop-blur-xl shadow-2xl md:hidden flex flex-col gap-4 animate-in fade-in slide-in-from-top-5 duration-200">
          <Link 
            href="#features" 
            onClick={() => setIsOpen(false)}
            className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] py-2 text-decoration-none"
          >
            Features
          </Link>
          <a 
            href="#how-it-works" 
            onClick={() => setIsOpen(false)}
            className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] py-2 text-decoration-none"
          >
            How it works
          </a>
          <Link 
            href="/pricing" 
            onClick={() => setIsOpen(false)}
            className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] py-2 text-decoration-none"
          >
            Pricing
          </Link>
          <div className="h-[1px] bg-[var(--border)] w-full my-1" />
          {mounted && session ? (
            <Link href="/dashboard" onClick={() => setIsOpen(false)} className="text-decoration-none">
              <button className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full bg-[var(--foreground)] text-[var(--pure-white)] font-bold text-sm transition-all duration-200 cursor-pointer shadow-sm">
                <LayoutDashboard className="h-4 w-4" /> Go to Workspace
              </button>
            </Link>
          ) : (
            <Link href="/login" onClick={() => setIsOpen(false)} className="text-decoration-none">
              <button className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full bg-[var(--mint-green)] text-neutral-900 font-bold text-sm transition-all duration-200 cursor-pointer shadow-sm">
                <LogIn className="h-4 w-4" /> Get Started
              </button>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

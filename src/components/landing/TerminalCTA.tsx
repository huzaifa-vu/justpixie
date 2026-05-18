"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function TerminalCTA() {
  const router = useRouter();

  const handleStart = () => {
    router.push("/dashboard");
  };

  return (
    <section className="relative w-full max-w-4xl ml-auto mr-auto px-6 py-24 flex flex-col items-center z-10 bg-transparent">
      {/* Soft gradient ambient blurs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-[var(--pixie-teal)] opacity-[0.08] blur-[100px] pointer-events-none" />

      {/* Premium Glass Conversion Card */}
      <div className="relative w-full rounded-[48px] border border-[var(--border)] bg-[var(--pure-white)]/80 p-12 text-center shadow-[var(--shadow-bento)] overflow-hidden transition-all duration-300">
        
        {/* Subtle decorative mesh overlay */}
        <div className="absolute -top-1/2 -left-1/4 h-[300px] w-[300px] rounded-full bg-[var(--gentle-lilac)] opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-1/2 -right-1/4 h-[300px] w-[300px] rounded-full bg-[var(--mint-green)] opacity-10 blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[var(--mint-green)]/35 border border-[var(--border)] text-xs text-[#166534] font-extrabold tracking-wide uppercase shadow-sm">
            <Zap className="h-3.5 w-3.5" /> 100% Free to Use
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[var(--foreground)] tracking-tight leading-tight font-sans">
            Start working on your files now.
          </h2>
          
          <p className="text-[var(--text-muted)] text-base font-semibold leading-relaxed font-sans">
            No sign up needed. No waiting lines. No payments. Access over 50 free tools right inside your internet browser window.
          </p>

          {/* Action button */}
          <button 
            onClick={handleStart}
            className="group flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[var(--foreground)] hover:opacity-90 text-[var(--pure-white)] font-extrabold text-sm transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
          >
            Open Free Workspace <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Helper items */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-xs font-bold text-[var(--text-muted)] font-sans">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[var(--pixie-teal)]" />
              <span>100% Safe on your computer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-[var(--gentle-lilac)]" />
              <span>No sign up or login needed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

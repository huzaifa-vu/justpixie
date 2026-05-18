"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Terminal, ArrowRight } from "lucide-react";

export default function TerminalCTA() {
  const router = useRouter();
  const [inputVal, setInputVal] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "pixie --version 1.0.0",
    "status: Local WebAssembly compilation loaded.",
    "Type 'start' to initialize dashboard..."
  ]);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCmd = inputVal.trim().toLowerCase();
    
    if (cleanCmd === "start") {
      setTerminalHistory(prev => [...prev, `> ${inputVal}`, "Initializing local dashboard session...", "Spells authorized. Redirecting..."]);
      setInputVal("");
      setIsSuccess(true);
      
      // Trigger navigation after short delay for immersive feeling
      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
    } else if (cleanCmd === "help") {
      setTerminalHistory(prev => [...prev, `> ${inputVal}`, "Available: 'start', 'help', 'clear'."]);
      setInputVal("");
    } else if (cleanCmd === "clear") {
      setTerminalHistory([]);
      setInputVal("");
    } else if (cleanCmd !== "") {
      setTerminalHistory(prev => [...prev, `> ${inputVal}`, `Command not found: '${cleanCmd}'`]);
      setInputVal("");
    }
  };

  const handleTerminalClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleDirectClick = () => {
    setIsSuccess(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 400);
  };

  return (
    <section className="relative w-full max-w-4xl ml-auto mr-auto px-6 py-24 flex flex-col items-center z-10 bg-transparent">
      {/* Background soft ambient blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-[var(--gentle-lilac)] opacity-10 blur-3xl pointer-events-none" />

      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-5xl font-extrabold text-[var(--foreground)] tracking-tight font-sans">
          Ready to Cast Spells?
        </h2>
        <p className="text-[var(--text-muted)] mt-4 text-sm font-medium font-sans">
          No cloud limits. No subscriptions. Run standard alchemical tools in seconds.
        </p>
      </div>

      {/* Interactive Squircle Terminal Panel */}
      <div 
        onClick={handleTerminalClick}
        className="relative w-full max-w-2xl rounded-[36px] border border-[var(--border)] bg-[var(--pure-white)]/80 dark:bg-[var(--surface-card)]/80 p-6 font-mono text-xs md:text-sm text-[var(--foreground)] shadow-[var(--shadow-bento)] cursor-text overflow-hidden transition-all duration-300"
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[var(--pixie-teal)]" />
            <span className="text-[var(--text-muted)] text-[10px] uppercase font-extrabold tracking-wider font-sans">
              Spells Shell
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/50" />
          </div>
        </div>

        {/* Terminal Output history */}
        <div className="flex flex-col gap-2 min-h-[120px] select-none text-[var(--text-muted)] font-medium">
          {terminalHistory.map((line, idx) => (
            <p 
              key={idx} 
              className={
                line.startsWith(">") 
                  ? "text-[var(--pixie-teal)] font-bold" 
                  : line.includes("Redirecting") || line.includes("authorized") 
                    ? "text-[var(--pixie-teal)] font-bold" 
                    : "text-[var(--foreground)]/80"
              }
            >
              {line}
            </p>
          ))}
        </div>

        {/* Terminal Input prompt */}
        <form onSubmit={handleCommandSubmit} className="flex items-center mt-3 border-t border-[var(--border)] pt-3">
          <span className="text-[var(--pixie-teal)] mr-2 font-bold">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isSuccess}
            placeholder="type 'start'..."
            className="flex-1 bg-transparent border-none outline-none text-[var(--foreground)] font-mono placeholder-[var(--text-muted)]/50"
            autoComplete="off"
            autoCapitalize="off"
          />
        </form>

        {/* Full-terminal success flash effect */}
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            className="absolute inset-0 bg-[var(--pixie-teal)] pointer-events-none"
          />
        )}
      </div>

      {/* Fallback Standard Mint CTA Button */}
      <div className="mt-8">
        <button 
          onClick={handleDirectClick}
          className="group flex items-center gap-2 px-6 py-3.5 rounded-full bg-[var(--mint-green)] hover:opacity-90 text-neutral-900 font-extrabold text-xs transition-all duration-300 cursor-pointer shadow-md shadow-[var(--mint-green)]/20"
        >
          Initialize Dashboard <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
}

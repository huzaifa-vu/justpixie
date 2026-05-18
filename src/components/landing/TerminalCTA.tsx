"use client";

import React, { useState, useRef, useEffect } from "react";
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
      setTerminalHistory(prev => [...prev, `> ${inputVal}`, "Available commands: 'start' (opens dashboard), 'help' (shows this), 'clear' (clears screen)."]);
      setInputVal("");
    } else if (cleanCmd === "clear") {
      setTerminalHistory([]);
      setInputVal("");
    } else if (cleanCmd !== "") {
      setTerminalHistory(prev => [...prev, `> ${inputVal}`, `Command not found: '${cleanCmd}'. Try typing 'start'.`]);
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
    <section className="relative w-full max-w-4xl mx-auto px-6 py-24 flex flex-col items-center">
      {/* Background radial accent glow behind the terminal */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Ready to Cast Spells?</h2>
        <p className="text-neutral-400 mt-3 text-sm">
          No cloud limits. No subscriptions. Run standard alchemical tools in seconds.
        </p>
      </div>

      {/* Interactive Terminal Panel */}
      <div 
        onClick={handleTerminalClick}
        className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#070707]/90 p-5 font-mono text-xs md:text-sm text-neutral-300 shadow-2xl shadow-indigo-500/5 cursor-text overflow-hidden"
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-indigo-400" />
            <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider font-sans">Spells Shell</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          </div>
        </div>

        {/* Terminal Output history */}
        <div className="flex flex-col gap-1.5 min-h-[120px] select-none">
          {terminalHistory.map((line, idx) => (
            <p key={idx} className={line.startsWith(">") ? "text-indigo-400" : line.includes("Redirecting") || line.includes("Spells authorized") ? "text-teal-400 font-bold" : "text-neutral-400"}>
              {line}
            </p>
          ))}
        </div>

        {/* Terminal Input prompt */}
        <form onSubmit={handleCommandSubmit} className="flex items-center mt-3 border-t border-white/5 pt-3">
          <span className="text-teal-400 mr-2 font-bold">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isSuccess}
            placeholder="type 'start'..."
            className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder-neutral-700"
            autoComplete="off"
            autoCapitalize="off"
          />
        </form>

        {/* Dynamic Full-terminal success flash effect */}
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            className="absolute inset-0 bg-white pointer-events-none"
          />
        )}
      </div>

      {/* Fallback Standard CTA Button for Mobile/Non-Terminal Users */}
      <div className="mt-8">
        <button 
          onClick={handleDirectClick}
          className="group flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-400 hover:to-teal-400 text-white font-bold text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-500/20"
        >
          Initialize Dashboard <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
}

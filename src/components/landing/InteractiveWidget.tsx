"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Video, 
  Sparkles, 
  ArrowRight,
  ImageIcon,
  Wand2,
  Code,
  ShieldAlert,
  Terminal
} from "lucide-react";

interface IntentType {
  id: string;
  prompt: string;
  toolName: string;
  category: string;
  route: string;
  icon: React.ReactNode;
  color: string;
  badgeBg: string;
  badgeText: string;
}

export default function InteractiveWidget() {
  const [activeIntent, setActiveIntent] = useState<IntentType | null>(null);
  const [routing, setRouting] = useState(false);
  const [matchedTool, setMatchedTool] = useState<IntentType | null>(null);
  const [currentCycleIndex, setCurrentCycleIndex] = useState(0);
  const [inputText, setInputText] = useState("");
  const autoCycleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const sampleIntents: IntentType[] = [
    {
      id: "img",
      prompt: "remove background from raw_photo.png",
      toolName: "Background Remover",
      category: "Image Magic",
      route: "/dashboard/image/bg-remove",
      icon: <ImageIcon className="h-6 w-6 text-[var(--pixie-teal)]" />,
      color: "var(--pixie-teal)",
      badgeBg: "rgba(20, 184, 166, 0.15)",
      badgeText: "var(--pixie-teal)"
    },
    {
      id: "pdf",
      prompt: "merge my unsigned_contract.pdf invoice bundle",
      toolName: "PDF Merge Spells",
      category: "PDF Spells",
      route: "/dashboard/pdf/merge",
      icon: <FileText className="h-6 w-6 text-[var(--gentle-lilac)]" />,
      color: "var(--gentle-lilac)",
      badgeBg: "rgba(168, 85, 247, 0.15)",
      badgeText: "var(--gentle-lilac)"
    },
    {
      id: "vid",
      prompt: "compress raw_footage.mov to web MP4 format",
      toolName: "Video Compressor",
      category: "Video Alchemy",
      route: "/dashboard/video/compress",
      icon: <Video className="h-6 w-6 text-rose-500" />,
      color: "#f43f5e",
      badgeBg: "rgba(244, 63, 94, 0.15)",
      badgeText: "#f43f5e"
    },
    {
      id: "csv",
      prompt: "format messy CSV invoice data to clean JSON",
      toolName: "CSV to JSON Parser",
      category: "Text & Data",
      route: "/dashboard/text/csv",
      icon: <Code className="h-6 w-6 text-[var(--mint-green)]" />,
      color: "var(--mint-green)",
      badgeBg: "rgba(74, 222, 128, 0.25)",
      badgeText: "#166534"
    }
  ];

  // Simulated typewriter typing effect
  const typePrompt = (text: string, callback: () => void) => {
    let currentIdx = 0;
    setInputText("");
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);

    typingTimerRef.current = setInterval(() => {
      if (currentIdx <= text.length) {
        setInputText(text.slice(0, currentIdx));
        currentIdx++;
      } else {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        callback();
      }
    }, 45);
  };

  // Run auto-cycles if user does not interact
  const startAutoCycle = () => {
    if (autoCycleTimerRef.current) clearTimeout(autoCycleTimerRef.current);
    autoCycleTimerRef.current = setTimeout(() => {
      const nextIndex = (currentCycleIndex + 1) % sampleIntents.length;
      setCurrentCycleIndex(nextIndex);
      triggerSimulation(sampleIntents[nextIndex]);
    }, 5000);
  };

  const triggerSimulation = (intent: IntentType) => {
    if (autoCycleTimerRef.current) clearTimeout(autoCycleTimerRef.current);
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);

    setActiveIntent(intent);
    setMatchedTool(null);
    setRouting(true);

    typePrompt(intent.prompt, () => {
      // Simulate Pixie semantic router parsing delay
      setTimeout(() => {
        setRouting(false);
        setMatchedTool(intent);
        startAutoCycle();
      }, 1200);
    });
  };

  // Start initial auto cycle on mount
  useEffect(() => {
    triggerSimulation(sampleIntents[0]);
    return () => {
      if (autoCycleTimerRef.current) clearTimeout(autoCycleTimerRef.current);
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  return (
    <div className="relative ml-auto mr-auto w-full max-w-3xl rounded-[48px] border border-[var(--border)] bg-[var(--pure-white)]/80 p-8 md:p-10 backdrop-blur-xl shadow-[var(--shadow-bento)] transition-all duration-300">
      {/* Organic ambient inner glow */}
      <div className="absolute -inset-px rounded-[48px] bg-gradient-to-r from-[var(--gentle-lilac)]/5 to-[var(--mint-green)]/5 opacity-40 blur-sm pointer-events-none" />

      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left side: Intelligent Command Center */}
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--pixie-teal)]">Step 1</span>
            <h3 className="text-2xl font-extrabold text-[var(--foreground)] mt-1 font-sans">Type Your Request</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1 font-sans">
              Click a sample intent below to test how Pixie semantically routes your files.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {sampleIntents.map((intent) => {
              const isSelected = activeIntent?.id === intent.id;
              return (
                <button
                  key={intent.id}
                  onClick={() => triggerSimulation(intent)}
                  className={`flex items-center justify-between p-4 rounded-[24px] border text-left transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? "border-[var(--pixie-teal)] bg-[var(--pixie-teal)]/10 shadow-[0_8px_32px_0_rgba(20,184,166,0.05)]"
                      : "border-[var(--border)] bg-[var(--foreground)]/[0.01] hover:bg-[var(--foreground)]/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-[16px] bg-[var(--pure-white)] border border-[var(--border)] shadow-sm">
                      {intent.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--foreground)] font-sans">{intent.toolName}</p>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold font-sans">
                        {intent.category}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                    isSelected ? "bg-[var(--pixie-teal)]/20 text-[var(--pixie-teal)]" : "bg-[var(--foreground)]/[0.05] text-[var(--text-muted)]"
                  }`}>
                    Test
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side: The Live AI Router Demonstration */}
        <div className="flex flex-col items-center justify-center p-8 rounded-[32px] bg-[var(--foreground)]/[0.01] border border-[var(--border)] min-h-[340px] transition-all duration-300 relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            {routing ? (
              <motion.div
                key="routing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center flex flex-col items-center gap-4 w-full"
              >
                {/* Router Prompt Shell Visual */}
                <div className="w-full bg-[var(--pure-white)] border border-[var(--border)] rounded-[20px] p-3 text-left font-mono text-xs flex items-center gap-2 mb-2 shadow-sm">
                  <Terminal className="h-3.5 w-3.5 text-[var(--pixie-teal)] flex-shrink-0" />
                  <span className="text-[var(--foreground)] truncate">{inputText}</span>
                  <span className="w-2 h-4 bg-[var(--pixie-teal)] animate-pulse flex-shrink-0" />
                </div>

                <div className="relative flex items-center justify-center my-2">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="h-20 w-20 rounded-full border-2 border-t-[var(--pixie-teal)] border-r-transparent border-b-[var(--gentle-lilac)] border-l-transparent"
                  />
                  <Wand2 className="h-8 w-8 text-[var(--pixie-teal)] absolute animate-pulse" />
                </div>
                
                <div>
                  <h4 className="text-base font-extrabold text-[var(--foreground)] font-sans">AI Routing Core Active</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-sans">
                    Analyzing intent semantic tokens...
                  </p>
                </div>
              </motion.div>
            ) : matchedTool ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full text-center flex flex-col items-center gap-4"
              >
                {/* Completed prompt bar */}
                <div className="w-full bg-[var(--pure-white)] border border-[var(--border)] rounded-[20px] p-3 text-left font-mono text-xs flex items-center gap-2 shadow-sm">
                  <Terminal className="h-3.5 w-3.5 text-[var(--text-muted)] flex-shrink-0" />
                  <span className="text-[var(--text-muted)] truncate">{matchedTool.prompt}</span>
                </div>

                <div className="h-16 w-16 rounded-[24px] bg-[var(--pure-white)] border border-[var(--border)] flex items-center justify-center shadow-md my-1">
                  {matchedTool.icon}
                </div>

                <div>
                  <span 
                    className="text-[10px] font-extrabold tracking-wider uppercase px-3 py-1 rounded-full shadow-sm"
                    style={{ backgroundColor: matchedTool.badgeBg, color: matchedTool.badgeText }}
                  >
                    {matchedTool.category}
                  </span>
                  <h4 className="text-lg font-extrabold text-[var(--foreground)] mt-3 font-sans">
                    {matchedTool.toolName} Match!
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-sans max-w-[220px] mx-auto leading-relaxed">
                    Pixie is ready to process files instantly on your GPU.
                  </p>
                </div>

                <a 
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-[20px] bg-[var(--foreground)] hover:opacity-90 text-[var(--pure-white)] font-bold text-sm transition-all duration-200 cursor-pointer shadow-md text-decoration-none"
                >
                  Open Sandbox Workspace <ArrowRight className="h-4 w-4" />
                </a>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Secure local Sandbox footer label */}
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 opacity-60 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-sans">
            <ShieldAlert className="h-3.5 w-3.5" /> 100% Client-Side execution guaranteed
          </div>
        </div>
      </div>
    </div>
  );
}

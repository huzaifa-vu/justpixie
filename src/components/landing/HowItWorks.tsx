"use client";

import React from "react";
import { Terminal, Cpu, ShieldCheck } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Describe Your Intent",
      desc: "Type what you need in plain English — like 'convert raw.mov to mp4' or 'clean my PDF metadata'. No complex navigation required.",
      icon: <Terminal className="h-6 w-6 text-[var(--pixie-teal)]" />,
      badgeBg: "rgba(20, 184, 166, 0.1)",
      badgeText: "var(--pixie-teal)"
    },
    {
      num: "02",
      title: "Semantic Routing",
      desc: "Our secure client-side AI parses your prompt semantic tokens and automatically prepares the perfect local sandbox tool.",
      icon: <Cpu className="h-6 w-6 text-[var(--gentle-lilac)]" />,
      badgeBg: "rgba(168, 85, 247, 0.1)",
      badgeText: "var(--gentle-lilac)"
    },
    {
      num: "03",
      title: "Warp-Speed Sandbox",
      desc: "Your files are compiled and processed inside your browser cache. No server queues, no telemetry, and absolute privacy.",
      icon: <ShieldCheck className="h-6 w-6 text-[var(--mint-green)]" />,
      badgeBg: "rgba(74, 222, 128, 0.15)",
      badgeText: "#166534"
    }
  ];

  return (
    <section id="how-it-works" className="relative w-full max-w-5xl ml-auto mr-auto px-6 py-24 bg-transparent z-10">
      {/* Dynamic ambient blurs */}
      <div className="absolute top-1/2 left-[-15%] h-[400px] w-[400px] rounded-full bg-[var(--gentle-lilac)] opacity-10 blur-[120px] pointer-events-none" />

      <div className="text-center mb-16">
        <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-900 bg-[var(--gentle-lilac)] px-4 py-1.5 rounded-full shadow-sm">
          Workflow
        </span>
        <h2 className="text-3xl md:text-5xl font-extrabold text-[var(--foreground)] mt-6 tracking-tight leading-tight font-sans">
          Magic in 3 Simple Steps.
        </h2>
        <p className="text-[var(--text-muted)] mt-4 max-w-xl ml-auto mr-auto text-base font-medium font-sans">
          Forget legacy uploads. Here's exactly how the browser-side file alchemy works.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="group relative rounded-[48px] border border-[var(--border)] bg-[var(--pure-white)]/80 p-8 md:p-10 backdrop-blur-md overflow-hidden transition-all duration-300 shadow-[var(--shadow-bento)] hover:border-[var(--pixie-teal)]/30"
          >
            {/* Ambient hover gradient light */}
            <div className="absolute -inset-px rounded-[48px] bg-gradient-to-tr from-[var(--gentle-lilac)]/5 to-[var(--pixie-teal)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8">
              <div className="h-12 w-12 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] flex items-center justify-center shadow-sm">
                {step.icon}
              </div>
              <span 
                className="text-sm font-extrabold font-mono tracking-widest px-3.5 py-1 rounded-full shadow-inner"
                style={{ backgroundColor: step.badgeBg, color: step.badgeText }}
              >
                {step.num}
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight font-sans">
              {step.title}
            </h3>
            <p className="text-[var(--text-muted)] text-sm mt-3 leading-relaxed font-sans font-medium">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

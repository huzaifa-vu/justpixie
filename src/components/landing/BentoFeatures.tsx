"use client";

import React from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Shield, Sparkles, Image as ImageIcon, Video, FileText, Cpu, Code, Type, Wand2, Terminal } from "lucide-react";
import Link from "next/link";

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
}

function BentoCard({ children, className = "" }: BentoCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`group relative rounded-[48px] border border-[var(--border)] bg-[var(--pure-white)]/80 p-8 md:p-10 backdrop-blur-md overflow-hidden transition-all duration-300 shadow-[var(--shadow-bento)] hover:border-[var(--pixie-teal)]/30 ${className}`}
    >
      {/* Dynamic Flashlight radial gradient mask overlay using Soft Sage/Mint V3 Accents */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[48px] opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              350px circle at ${mouseX}px ${mouseY}px,
              rgba(167, 243, 208, 0.25),
              transparent 80%
            )
          `,
        }}
      />
      {children}
    </div>
  );
}

export default function BentoFeatures() {
  return (
    <section id="features" className="relative w-full max-w-5xl ml-auto mr-auto px-6 py-24 bg-transparent z-10">
      <div className="text-center mb-16">
        <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-900 bg-[var(--mint-green)] px-4 py-1.5 rounded-full shadow-sm">
          Features
        </span>
        <h2 className="text-3xl md:text-5xl font-extrabold text-[var(--foreground)] mt-6 tracking-tight leading-tight font-sans">
          50+ Spells. All Processed Locally.
        </h2>
        <p className="text-[var(--text-muted)] mt-4 max-w-xl ml-auto mr-auto text-base font-medium font-sans">
          From image compression to PDF merging to video conversion — every spell runs inside your browser tab using WebAssembly. Nothing is uploaded anywhere.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Row 1, Card 1: AI Routing Core (Large, 2 cols on md) */}
        <BentoCard className="md:col-span-2 flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="h-12 w-12 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
              <Wand2 className="h-5 w-5 text-[var(--pixie-teal)]" />
            </div>
            <h3 className="text-2xl font-extrabold text-[var(--foreground)] font-sans">AI-Powered Intent Routing</h3>
            <p className="text-[var(--text-muted)] text-sm mt-3 max-w-md leading-relaxed font-sans font-medium">
              Don't waste time hunting through menus. Type what you need in plain English — like *"compress raw.mov to mp4"* — and our AI automatically prepares the correct local sandbox page for you.
            </p>
          </div>
          
          <div className="mt-8 flex flex-wrap gap-3 overflow-hidden pointer-events-none opacity-90">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[var(--pure-white)] border border-[var(--border)] text-xs text-[var(--foreground)] font-bold shadow-sm">
              <Terminal className="h-3.5 w-3.5 text-[var(--pixie-teal)]" /> Natural Language Sandbox
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[var(--pure-white)] border border-[var(--border)] text-xs text-[var(--foreground)] font-bold shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-[var(--gentle-lilac)]" /> Intent Classification Core
            </div>
          </div>
        </BentoCard>

        {/* Row 1, Card 2: 100% Client-Side Privacy (Small, 1 col) */}
        <BentoCard className="flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="h-12 w-12 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
              <Shield className="h-5 w-5 text-[var(--pixie-teal)]" />
            </div>
            <h3 className="text-xl font-extrabold text-[var(--foreground)] font-sans">100% Private</h3>
            <p className="text-[var(--text-muted)] text-xs mt-3 leading-relaxed font-sans font-medium">
              Every operation happens completely inside browser RAM. Files never leave your machine — 0 KB sent to cloud hosts.
            </p>
          </div>
          <div className="relative mt-6 h-16 w-full rounded-[24px] bg-[var(--foreground)]/[0.02] border border-[var(--border)] overflow-hidden flex items-center justify-center pointer-events-none opacity-95">
            <span className="text-[9px] uppercase tracking-widest text-[#166534] font-extrabold bg-[var(--mint-green)] px-3 py-1.5 rounded-full shadow-sm">
              0 KB Cloud Telemetry
            </span>
          </div>
        </BentoCard>

        {/* Row 2, Card 1: Image Spells (Small, 1 col) */}
        <BentoCard className="flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="h-12 w-12 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
              <ImageIcon className="h-5 w-5 text-[var(--pixie-teal)]" />
            </div>
            <h3 className="text-xl font-extrabold text-[var(--foreground)] font-sans">Image Spells</h3>
            <p className="text-[var(--text-muted)] text-sm mt-3 leading-relaxed font-sans font-medium">
              Precise background removals, WebP conversions, crops, metadata wipes, and canvas filter magic.
            </p>
          </div>
          <div className="relative mt-6 h-16 w-full rounded-[24px] bg-[var(--foreground)]/[0.02] border border-[var(--border)] overflow-hidden flex items-center justify-center">
            <Link href="/dashboard/image" className="text-[10px] uppercase tracking-widest text-neutral-900 font-extrabold bg-[var(--mint-green)] px-4 py-2 rounded-full shadow-sm hover:opacity-90 transition-opacity text-decoration-none">
              Explore Images
            </Link>
          </div>
        </BentoCard>

        {/* Row 2, Card 2: Video Alchemy (Small, 1 col) */}
        <BentoCard className="flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="h-12 w-12 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
              <Video className="h-5 w-5 text-rose-500" />
            </div>
            <h3 className="text-xl font-extrabold text-[var(--foreground)] font-sans">Video Alchemy</h3>
            <p className="text-[var(--text-muted)] text-sm mt-3 leading-relaxed font-sans font-medium">
              FFmpeg WASM-powered high-performance compression, custom MP3 audio extraction, GIF loops, and merges.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2 w-full">
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] uppercase font-extrabold tracking-wider">
              <span>WASM FFmpeg</span>
              <span>Loaded</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--foreground)]/[0.04] border border-[var(--border)] overflow-hidden">
              <motion.div
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="h-full bg-rose-500"
              />
            </div>
          </div>
        </BentoCard>

        {/* Row 2, Card 3: PDF Spells (Small, 1 col) */}
        <BentoCard className="flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="h-12 w-12 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
              <FileText className="h-5 w-5 text-[var(--gentle-lilac)]" />
            </div>
            <h3 className="text-xl font-extrabold text-[var(--foreground)] font-sans">PDF Spells</h3>
            <p className="text-[var(--text-muted)] text-sm mt-3 leading-relaxed font-sans font-medium">
              Watermark contracts, merge invoice piles, scrub structural profiles, and rotate pages in-memory.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-[9px] font-bold bg-[var(--pure-white)] border border-[var(--border)] px-2.5 py-1 rounded-full shadow-sm text-[var(--text-muted)]">Watermark</span>
            <span className="text-[9px] font-bold bg-[var(--pure-white)] border border-[var(--border)] px-2.5 py-1 rounded-full shadow-sm text-[var(--text-muted)]">Merge</span>
            <span className="text-[9px] font-bold bg-[var(--pure-white)] border border-[var(--border)] px-2.5 py-1 rounded-full shadow-sm text-[var(--text-muted)]">Scrub</span>
          </div>
        </BentoCard>

        {/* Row 3, Card 1: Dev Utilities (Small, 1 col) */}
        <BentoCard className="flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="h-12 w-12 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
              <Code className="h-5 w-5 text-[var(--pixie-teal)]" />
            </div>
            <h3 className="text-xl font-extrabold text-[var(--foreground)] font-sans">Dev Utilities</h3>
            <p className="text-[var(--text-muted)] text-sm mt-3 leading-relaxed font-sans font-medium">
              JWT token decoders, JSON formatting engines, local regex sandboxes, and offline QR builders.
            </p>
          </div>
          <div className="relative mt-6 h-16 w-full rounded-[24px] bg-[var(--foreground)]/[0.02] border border-[var(--border)] overflow-hidden flex items-center justify-center">
            <Link href="/dashboard/dev" className="text-[10px] uppercase tracking-widest text-neutral-900 font-extrabold bg-[var(--gentle-lilac)] px-4 py-2 rounded-full shadow-sm hover:opacity-90 transition-opacity text-decoration-none">
              Explore Dev
            </Link>
          </div>
        </BentoCard>

        {/* Row 3, Card 2: Text & Data Spells (Large, 2 cols on md) */}
        <BentoCard className="md:col-span-2 flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="h-12 w-12 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
              <Type className="h-5 w-5 text-[var(--gentle-lilac)]" />
            </div>
            <h3 className="text-2xl font-extrabold text-[var(--foreground)] font-sans">Text & Data Spells</h3>
            <p className="text-[var(--text-muted)] text-sm mt-3 max-w-md leading-relaxed font-sans font-medium">
              Convert database CSV files to JSON payloads, calculate words, search and replace text blocks, and utilize high-fidelity local text-to-speech generators.
            </p>
          </div>
          
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="p-3.5 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] text-center text-xs font-bold text-[var(--foreground)] shadow-sm">
              CSV Parser
            </div>
            <div className="p-3.5 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] text-center text-xs font-bold text-[var(--foreground)] shadow-sm">
              Speech Synthesis
            </div>
            <div className="p-3.5 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] text-center text-xs font-bold text-[var(--foreground)] shadow-sm">
              Word Count
            </div>
          </div>
        </BentoCard>

      </div>
    </section>
  );
}

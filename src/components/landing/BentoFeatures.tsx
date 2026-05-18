"use client";

import React from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Shield, Sparkles, Image as ImageIcon, Video, FileText, Cpu } from "lucide-react";

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
          Everything You Need.<br />Done in Milliseconds.
        </h2>
        <p className="text-[var(--text-muted)] mt-4 max-w-xl ml-auto mr-auto text-base font-medium font-sans">
          Unlock standard file alchemical spells with lightning speed, complete privacy, and zero server queues.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Card 1: Local-First Security (Large, takes 2 cols on md) */}
        <BentoCard className="md:col-span-2 flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="h-12 w-12 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
              <Shield className="h-5 w-5 text-[var(--pixie-teal)]" />
            </div>
            <h3 className="text-2xl font-extrabold text-[var(--foreground)] font-sans">100% Client-Side Privacy</h3>
            <p className="text-[var(--text-muted)] text-sm mt-3 max-w-md leading-relaxed font-sans font-medium">
              Unlike other tools, Pixie processes every single document, image, and video directly inside your browser. No server uploads. No leaking data. Your files never leave your device.
            </p>
          </div>
          
          <div className="mt-8 flex flex-wrap gap-3 overflow-hidden pointer-events-none opacity-90">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[var(--pure-white)] border border-[var(--border)] text-xs text-[var(--foreground)] font-bold shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--pixie-teal)] animate-pulse" /> Wasm Engine Active
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[var(--pure-white)] border border-[var(--border)] text-xs text-[var(--foreground)] font-bold shadow-sm">
              <Shield className="h-3.5 w-3.5 text-[var(--gentle-lilac)]" /> 0 KB Sent to Cloud
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[var(--pure-white)] border border-[var(--border)] text-xs text-[var(--foreground)] font-bold shadow-sm">
              <Cpu className="h-3.5 w-3.5 text-[var(--pixie-teal)]" /> Powered by Local GPU
            </div>
          </div>
        </BentoCard>

        {/* Card 2: Image Spells (Small, 1 col) */}
        <BentoCard className="flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="h-12 w-12 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
              <ImageIcon className="h-5 w-5 text-[var(--pixie-teal)]" />
            </div>
            <h3 className="text-xl font-extrabold text-[var(--foreground)] font-sans">Image Spells</h3>
            <p className="text-[var(--text-muted)] text-sm mt-3 leading-relaxed font-sans font-medium">
              Background removal, PNG compression, and instant conversion to optimal modern WebP files directly in your cache.
            </p>
          </div>
          <div className="relative mt-6 h-20 w-full rounded-[24px] bg-[var(--foreground)]/[0.02] border border-[var(--border)] overflow-hidden flex items-center justify-center">
            <span className="text-[10px] uppercase tracking-widest text-neutral-900 font-extrabold bg-[var(--mint-green)] px-3 py-1.5 rounded-full shadow-sm">
              Remove Background
            </span>
          </div>
        </BentoCard>

        {/* Card 3: Video Alchemy (Wide, 1 col) */}
        <BentoCard className="flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="h-12 w-12 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
              <Video className="h-5 w-5 text-rose-500" />
            </div>
            <h3 className="text-xl font-extrabold text-[var(--foreground)] font-sans">Video Alchemy</h3>
            <p className="text-[var(--text-muted)] text-sm mt-3 leading-relaxed font-sans font-medium">
              Compress raw MOV recordings to lightweight MP4s using specialized WASM-compiled FFmpeg directly in the background.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2 w-full">
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] uppercase font-extrabold tracking-wider">
              <span>WASM FFmpeg</span>
              <span>Compiling...</span>
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

        {/* Card 4: PDF Spells (Wide, takes 2 cols on md) */}
        <BentoCard className="md:col-span-2 flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="h-12 w-12 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-sm">
              <FileText className="h-5 w-5 text-[var(--gentle-lilac)]" />
            </div>
            <h3 className="text-2xl font-extrabold text-[var(--foreground)] font-sans">PDF Spells</h3>
            <p className="text-[var(--text-muted)] text-sm mt-3 max-w-md leading-relaxed font-sans font-medium">
              Securely watermark contracts, merge invoices, convert pages to PNG, and edit metadata without exposing corporate documents to third-party APIs.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="p-3.5 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] text-center text-xs font-bold text-[var(--foreground)] shadow-sm">
              Watermark
            </div>
            <div className="p-3.5 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] text-center text-xs font-bold text-[var(--foreground)] shadow-sm">
              Merge
            </div>
            <div className="p-3.5 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] text-center text-xs font-bold text-[var(--foreground)] shadow-sm">
              Metadata
            </div>
          </div>
        </BentoCard>
      </div>
    </section>
  );
}

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
      className={`group relative rounded-3xl border border-white/10 bg-[#0a0a0a]/40 p-6 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-white/20 ${className}`}
    >
      {/* Dynamic Flashlight radial gradient mask overlay */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              350px circle at ${mouseX}px ${mouseY}px,
              rgba(99, 102, 241, 0.07),
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
    <section id="features" className="relative w-full max-w-5xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">Features</span>
        <h2 className="text-3xl md:text-5xl font-black text-white mt-4 tracking-tight leading-tight">
          Everything You Need.<br />Done in Milliseconds.
        </h2>
        <p className="text-neutral-400 mt-4 max-w-xl mx-auto text-base">
          Unlock standard file alchemical spells with lightning speed, complete privacy, and zero server queues.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Local-First Security (Large, takes 2 cols on md) */}
        <BentoCard className="md:col-span-2 flex flex-col justify-between min-h-[320px]">
          <div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
              <Shield className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">100% Client-Side Privacy</h3>
            <p className="text-neutral-400 text-sm mt-2 max-w-md">
              Unlike other tools, Pixie processes every single document, image, and video directly inside your browser. No server uploads. No leaking data. Your files never leave your device.
            </p>
          </div>
          
          <div className="mt-8 flex gap-3 overflow-hidden pointer-events-none opacity-80">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-neutral-900 border border-white/5 text-xs text-white">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" /> Wasm Engine Active
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-neutral-900 border border-white/5 text-xs text-white">
              <Shield className="h-3.5 w-3.5 text-indigo-400" /> 0 KB Sent to Cloud
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-neutral-900 border border-white/5 text-xs text-white">
              <Cpu className="h-3.5 w-3.5 text-indigo-400" /> Powered by Local GPU
            </div>
          </div>
        </BentoCard>

        {/* Card 2: Image Spells (Small, 1 col) */}
        <BentoCard className="flex flex-col justify-between min-h-[320px]">
          <div>
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6">
              <ImageIcon className="h-5 w-5 text-teal-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Image Spells</h3>
            <p className="text-neutral-400 text-sm mt-2">
              Background removal, PNG compression, and instant conversion to optimal modern WebP files directly in your cache.
            </p>
          </div>
          <div className="relative mt-6 h-20 w-full rounded-2xl bg-neutral-950 border border-white/5 overflow-hidden flex items-center justify-center">
            <span className="text-[10px] uppercase tracking-widest text-teal-400 font-bold bg-teal-500/10 px-2.5 py-1 rounded-full">
              Remove Background
            </span>
          </div>
        </BentoCard>

        {/* Card 3: Video Alchemy (Wide, 1 col) */}
        <BentoCard className="flex flex-col justify-between min-h-[320px]">
          <div>
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
              <Video className="h-5 w-5 text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Video Alchemy</h3>
            <p className="text-neutral-400 text-sm mt-2">
              Compress raw MOV recordings to lightweight MP4s using specialized WASM-compiled FFmpeg directly in the background.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2 w-full">
            <div className="flex justify-between text-[10px] text-neutral-500 uppercase font-bold">
              <span>WASM FFMpeg</span>
              <span>Compiling...</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-neutral-900 border border-white/5 overflow-hidden">
              <motion.div
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="h-full bg-rose-500"
              />
            </div>
          </div>
        </BentoCard>

        {/* Card 4: PDF Spells (Wide, takes 2 cols on md) */}
        <BentoCard className="md:col-span-2 flex flex-col justify-between min-h-[320px]">
          <div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
              <FileText className="h-5 w-5 text-amber-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">PDF Spells</h3>
            <p className="text-neutral-400 text-sm mt-2 max-w-md">
              Securely watermark contracts, merge invoices, convert pages to PNG, and edit metadata without exposing corporate documents to third-party APIs.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-neutral-950 border border-white/5 text-center text-xs text-white">
              Watermark
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-white/5 text-center text-xs text-white">
              Merge
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-white/5 text-center text-xs text-white">
              Metadata
            </div>
          </div>
        </BentoCard>
      </div>
    </section>
  );
}

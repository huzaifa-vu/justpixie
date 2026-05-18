"use client";

import React from "react";
import { motion } from "framer-motion";
import InteractiveWidget from "./InteractiveWidget";
import { Sparkles } from "lucide-react";

export default function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as const, // Custom ultra-premium cubic-bezier curve
      },
    },
  };

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center pt-32 pb-16 px-6 overflow-hidden bg-[#030303]">
      {/* Dynamic Ambient Blur Mesh Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-[10%] left-[20%] h-[350px] w-[350px] rounded-full bg-indigo-500/[0.04] blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] h-[400px] w-[400px] rounded-full bg-teal-500/[0.03] blur-3xl pointer-events-none animate-pulse" />

      {/* Main Orchestrated Container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center gap-8"
      >
        {/* Animated Badge */}
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span className="text-xs text-neutral-400 font-medium tracking-wide">
            Next-Gen Browser File Alchemy
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div variants={itemVariants} className="flex flex-col gap-3">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.1]">
            Effortless File Spells.
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-teal-300 to-rose-400">
              100% Local AI.
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg md:text-xl text-neutral-400 font-light leading-relaxed max-w-xl mx-auto"
        >
          Cast background removals, metadata wipes, and high-performance video conversions instantly in your cache. Your data never touches a server.
        </motion.p>

        {/* The Interactive Crucible Widget */}
        <motion.div
          variants={itemVariants}
          className="w-full mt-6"
        >
          <InteractiveWidget />
        </motion.div>
      </motion.div>

      {/* Elegant Fade Out Transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#030303] to-transparent pointer-events-none" />
    </section>
  );
}

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
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center pt-36 pb-16 px-6 overflow-hidden bg-transparent">
      {/* Warm & Soft Pastel Ambient Blur Mesh Glows (V3) */}
      <div className="absolute top-0 right-[-10%] h-[500px] w-[500px] rounded-full bg-[var(--mint-green)] opacity-25 dark:opacity-[0.08] blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[var(--gentle-lilac)] opacity-20 dark:opacity-[0.05] blur-[130px] pointer-events-none" />

      {/* Main Orchestrated Container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-4xl ml-auto mr-auto flex flex-col items-center text-center gap-8"
      >
        {/* Animated Badge */}
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--pure-white)]/40 border border-[var(--border)] shadow-[var(--shadow-bento)]"
        >
          <Sparkles className="h-3.5 w-3.5 text-[var(--pixie-teal)] animate-pulse" />
          <span className="text-xs text-[var(--text-muted)] font-bold tracking-wide">
            Next-Gen Browser File Alchemy
          </span>
        </motion.div>

        {/* Headline (Friendly rounded Plus Jakarta display) */}
        <motion.div variants={itemVariants} className="flex flex-col gap-3">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[var(--foreground)] leading-[1.1] font-sans">
            Effortless File Spells.
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--gentle-lilac)] via-[var(--pixie-teal)] to-[var(--mint-green)]">
              100% Local AI.
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg md:text-xl text-[var(--text-muted)] font-medium leading-relaxed max-w-xl ml-auto mr-auto font-sans"
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

      {/* Soft overlay gradient transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--soft-sage)] to-transparent pointer-events-none" />
    </section>
  );
}

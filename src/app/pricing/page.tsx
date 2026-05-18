"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Shield, HelpCircle } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import NoiseOverlay from "@/components/landing/NoiseOverlay";
import Footer from "@/components/landing/Footer";
import Link from "next/link";

export default function PricingPage() {
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
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const faqItems = [
    {
      q: "Do you ever upload my files to your servers?",
      a: "Never. Pixie processes all file conversions, image background removals, and video compressions locally in your browser memory (RAM/GPU) using WebAssembly. Your files stay on your machine."
    },
    {
      q: "Why is there a prompt limit on the Free Guest tier?",
      a: "While all 50+ file tools are 100% free and run locally in your browser, the AI Routing prompt requires secure external semantic parsing models. We cover the cost of these queries for guests, and offer unlimited access to signed-in Pro members."
    },
    {
      q: "Can I use the tools completely offline?",
      a: "Yes! Once the dashboard loads, all tools compile and execute in-memory inside your tab. You can disconnect from the internet completely and continue converting PDFs, compressing images, or formatting CSVs."
    },
    {
      q: "How does the subscription payment work?",
      a: "We process billing securely via Stripe and Lemon Squeezy. You can cancel at any time directly from your dashboard account portal with a single click."
    }
  ];

  return (
    <div className="relative min-h-screen w-full bg-[var(--soft-sage)] text-[var(--foreground)] overflow-y-auto overflow-x-hidden">
      <NoiseOverlay />
      <Navbar />

      <section className="relative w-full pt-36 pb-16 px-6 overflow-hidden bg-transparent">
        {/* Soft Mesh Glows */}
        <div className="absolute top-0 right-[-10%] h-[500px] w-[500px] rounded-full bg-[var(--gentle-lilac)] opacity-20 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[var(--mint-green)] opacity-20 blur-[130px] pointer-events-none" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 w-full max-w-5xl ml-auto mr-auto flex flex-col items-center gap-8"
        >
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto flex flex-col items-center gap-4">
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--pure-white)]/40 border border-[var(--border)] shadow-[var(--shadow-bento)]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--pixie-teal)] animate-pulse" />
              <span className="text-xs text-[var(--text-muted)] font-bold tracking-wide uppercase">
                Pricing Plans
              </span>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[var(--foreground)] leading-[1.1] font-sans"
            >
              Simple, transparent pricing.
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg text-[var(--text-muted)] font-semibold leading-relaxed max-w-xl font-sans"
            >
              Start transforming files for free with zero accounts. Upgrade to Pro Alchemist for unlimited AI routing and maximum processing priorities.
            </motion.p>
          </div>

          {/* Pricing Grid */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mt-8 items-stretch"
          >
            {/* Free Tier */}
            <div className="group relative rounded-[48px] border border-[var(--border)] bg-[var(--pure-white)]/80 p-8 md:p-10 backdrop-blur-md overflow-hidden flex flex-col justify-between shadow-[var(--shadow-bento)] transition-all duration-300 hover:border-[var(--pixie-teal)]/10">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--text-muted)] bg-[var(--foreground)]/[0.05] px-3.5 py-1.5 rounded-full">
                    Free Guest
                  </span>
                </div>
                
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-extrabold text-[var(--foreground)] font-sans">$0</span>
                  <span className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-wider">/ Free Lifetime</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-semibold leading-relaxed mb-6 font-sans">
                  Process quick conversions and minor edits without registering an account.
                </p>

                <div className="border-t border-[var(--border)] pt-6 flex flex-col gap-4">
                  {[
                    "Access to all 50+ local tools",
                    "100% private client-side processing",
                    "3 AI Routing prompts per day",
                    "High-speed browser-side downloads",
                    "No credit card or sign up required"
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs font-bold text-[var(--foreground)]/80 font-sans">
                      <Check className="h-4 w-4 text-[var(--pixie-teal)] flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <Link 
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-[24px] border border-[var(--border)] hover:bg-[var(--foreground)]/[0.04] text-[var(--foreground)] font-bold text-xs transition-all duration-200 cursor-pointer shadow-sm text-decoration-none"
                >
                  Open Guest Workspace
                </Link>
              </div>
            </div>

            {/* Pro Tier */}
            <div className="group relative rounded-[48px] border border-[var(--pixie-teal)]/30 bg-gradient-to-tr from-[var(--gentle-lilac)]/5 via-[var(--pure-white)]/80 to-[var(--pixie-teal)]/5 p-8 md:p-10 backdrop-blur-md overflow-hidden flex flex-col justify-between shadow-[var(--shadow-bento)] transition-all duration-300 hover:shadow-xl">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#166534] bg-[var(--mint-green)] px-3.5 py-1.5 rounded-full shadow-sm">
                    Pro Alchemist
                  </span>
                  <span className="text-[10px] font-extrabold tracking-widest text-[var(--pixie-teal)] uppercase">
                    Most Popular
                  </span>
                </div>
                
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-extrabold text-[var(--foreground)] font-sans">$9</span>
                  <span className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-wider">/ month</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-semibold leading-relaxed mb-6 font-sans">
                  Perfect for creators, developers, and professionals needing absolute conversion freedom.
                </p>

                <div className="border-t border-[var(--border)] pt-6 flex flex-col gap-4">
                  {[
                    "Everything in Free Guest",
                    "Unlimited AI Routing prompts",
                    "Zero prompt limit timers or queues",
                    "Priority local compilation processing",
                    "Developer sandbox feature requests",
                    "Dynamic customizable theme palettes"
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs font-bold text-[var(--foreground)]/80 font-sans">
                      <Zap className="h-4 w-4 text-[var(--pixie-teal)] flex-shrink-0 animate-pulse" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <Link 
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-[24px] bg-[var(--foreground)] hover:opacity-90 text-[var(--pure-white)] font-bold text-xs transition-all duration-200 cursor-pointer shadow-md text-decoration-none"
                >
                  Upgrade to Pro Alchemist
                </Link>
              </div>
            </div>
          </motion.div>

          {/* FAQs Title */}
          <div className="text-center mt-20 mb-8 max-w-2xl mx-auto flex flex-col items-center gap-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-900 bg-[var(--gentle-lilac)] px-4 py-1.5 rounded-full shadow-sm">
              FAQs
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--foreground)] leading-tight font-sans">
              Frequently Asked Questions
            </h2>
          </div>

          {/* FAQs List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl text-left">
            {faqItems.map((item, idx) => (
              <div 
                key={idx} 
                className="rounded-[32px] border border-[var(--border)] bg-[var(--pure-white)]/70 p-6 backdrop-blur-sm shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[var(--foreground)]/[0.03] border border-[var(--border)] flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                    <HelpCircle className="h-4.5 w-4.5 text-[var(--pixie-teal)]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[var(--foreground)] font-sans">
                      {item.q}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed font-sans font-semibold">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </motion.div>
      </section>

      <Footer />
    </div>
  );
}

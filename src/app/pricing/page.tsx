"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, HelpCircle } from "lucide-react";
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
      q: "Do you keep my files?",
      a: "No. Everything runs inside your web browser. Your files never leave your computer."
    },
    {
      q: "Why is there a limit for guests?",
      a: "Using AI to understand typing costs us real money. We pay for guests to try it, and offer unlimited typing to members."
    },
    {
      q: "Can I use it without internet?",
      a: "Yes! Once the page loads, you can turn off your internet. The tools will still work perfectly on your computer."
    },
    {
      q: "How does the Patreon upgrade work?",
      a: "After joining our Patreon tier for $1/month, send a quick email to huzaifaramzan10@gmail.com with your account details for an instant manual upgrade. Otherwise, your account will be auto-upgraded within 24–48 hours."
    }
  ];

  return (
    <div className="relative min-h-screen w-full bg-[var(--soft-sage)] bg-dots text-[var(--foreground)] overflow-y-auto overflow-x-hidden">
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
                Simple Pricing
              </span>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[var(--foreground)] leading-[1.1] font-sans"
            >
              Simple pricing. No hidden fees.
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg text-[var(--text-muted)] font-semibold leading-relaxed max-w-xl font-sans"
            >
              Use our tools for free without an account. Upgrade to Pro if you want unlimited typing help and faster speeds.
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
                  <span className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-wider">/ Free forever</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-semibold leading-relaxed mb-6 font-sans">
                  Best for quick fixes. No email or sign up needed.
                </p>

                <div className="border-t border-[var(--border)] pt-6 flex flex-col gap-4">
                  {[
                    "Use all 50+ tools for free",
                    "100% private (files never leave your computer)",
                    "3 typing helper prompts per day",
                    "Quick downloads inside your browser",
                    "No sign up or login needed"
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
                  Open Free Workspace
                </Link>
              </div>
            </div>            {/* Pro Tier */}
            <div className="group relative rounded-[48px] border border-[var(--pixie-teal)]/30 bg-gradient-to-tr from-[var(--gentle-lilac)]/5 via-[var(--pure-white)]/80 to-[var(--pixie-teal)]/5 p-8 md:p-10 backdrop-blur-md overflow-hidden flex flex-col justify-between shadow-[var(--shadow-bento)] transition-all duration-300 hover:shadow-xl">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#166534] bg-[var(--mint-green)] px-3.5 py-1.5 rounded-full shadow-sm">
                    Unlimited Magic
                  </span>
                  <span className="text-[10px] font-extrabold tracking-widest text-[var(--pixie-teal)] uppercase">
                    Most Popular
                  </span>
                </div>
                
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-extrabold text-[var(--foreground)] font-sans">$1</span>
                  <span className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-wider">/ month</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-semibold leading-relaxed mb-6 font-sans">
                  Support Pixie on Patreon and unlock absolute power.
                </p>
 
                <div className="border-t border-[var(--border)] pt-6 flex flex-col gap-4">
                  {[
                    "Everything in the Free Guest plan",
                    "Unlimited typing helper prompts",
                    "No daily limits or wait times",
                    "Faster local processing queue",
                    "Suggest new features & tools directly",
                    "Support indie development"
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
                  href="/dashboard/upgrade"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-[24px] bg-[var(--foreground)] hover:opacity-90 text-[var(--pure-white)] font-bold text-xs transition-all duration-200 cursor-pointer shadow-md text-decoration-none"
                >
                  Upgrade to Unlimited Magic
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

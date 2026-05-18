import React from "react";
import Navbar from "@/components/landing/Navbar";
import NoiseOverlay from "@/components/landing/NoiseOverlay";
import HeroSection from "@/components/landing/HeroSection";
import BentoFeatures from "@/components/landing/BentoFeatures";
import HowItWorks from "@/components/landing/HowItWorks";
import TerminalCTA from "@/components/landing/TerminalCTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="relative h-screen w-full bg-[var(--soft-sage)] bg-dots text-[var(--foreground)] overflow-y-auto overflow-x-hidden">
      {/* Global anti-banding grain noise */}
      <NoiseOverlay />

      {/* Floating high-end session-aware glass nav */}
      <Navbar />

      {/* The Hook & Interactive browser transforms crucible */}
      <HeroSection />

      {/* Structured asymmetric Bento Grid features highlight */}
      <BentoFeatures />

      {/* Structured 3-step magic details walkthrough */}
      <HowItWorks />

      {/* Shell cmd-prompt conversion activation */}
      <TerminalCTA />

      {/* Clean high-density footer */}
      <Footer />
    </div>
  );
}

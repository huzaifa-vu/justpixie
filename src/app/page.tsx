import React from "react";
import MarketingWrapper from "@/components/MarketingWrapper";
import NoiseOverlay from "@/components/landing/NoiseOverlay";
import HeroSection from "@/components/landing/HeroSection";
import BentoFeatures from "@/components/landing/BentoFeatures";
import TerminalCTA from "@/components/landing/TerminalCTA";

export default function Home() {
  return (
    <MarketingWrapper>
      <div className="relative min-h-screen bg-[#030303] text-white overflow-y-auto overflow-x-hidden">
        {/* Anti-banding film noise texture */}
        <NoiseOverlay />

        {/* Immersive Landing Hook */}
        <HeroSection />

        {/* Detailed High-Performance Asymmetric Features */}
        <BentoFeatures />

        {/* Command Shell Direct Activation CTA */}
        <TerminalCTA />
      </div>
    </MarketingWrapper>
  );
}

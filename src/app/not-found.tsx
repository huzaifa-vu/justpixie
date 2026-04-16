"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import MarketingWrapper from "@/components/MarketingWrapper";

export default function NotFound() {
  return (
      <main style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '4rem 2rem'
      }}>
        <div style={{
          background: 'var(--soft-sage)',
          padding: '1.5rem',
          borderRadius: '50%',
          marginBottom: '2rem',
          color: 'var(--deep-charcoal)'
        }}>
          <Sparkles size={64} />
        </div>
        
        <h1 style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.05em', color: 'var(--foreground)' }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Whoops! This spell hasn't been written yet.
        </h2>
        <p style={{ maxWidth: '500px', color: 'var(--text-muted)', marginBottom: '3rem', lineHeight: 1.6 }}>
          The magic artifact or tool page you are looking for doesn't exist, was moved, or is currently under construction in the Pixie workshop.
        </p>
        
        <Link href="/dashboard" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 2rem',
          background: 'var(--mint-green)',
          color: 'var(--deep-charcoal)',
          borderRadius: '999px',
          fontWeight: 700,
          textDecoration: 'none',
          transition: 'transform 0.2s',
        }}>
          <ArrowLeft size={20} />
          Return to the Dashboard
        </Link>
      </main>
  );
}

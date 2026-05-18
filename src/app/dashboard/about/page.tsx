"use client";

import { Lock, Zap, MousePointerClick, Info, Play, Camera, Sparkles, Globe, Heart } from "lucide-react";
import styles from "../meta-pages.module.css";
import { motion } from "framer-motion";

export default function AboutPage() {
  const features = [
    {
      icon: <Lock size={32} style={{ color: 'var(--mint-green)' }} />,
      title: "Absolute Privacy",
      description: "By utilizing WebAssembly (WASM), your files stay 100% locally on your browser. Your sensitive data never touches our servers."
    },
    {
      icon: <Zap size={32} style={{ color: 'var(--gentle-lilac)' }} />,
      title: "Blazing Fast",
      description: "No more upload bars. Pixie leverages your own CPU and memory for instant transformation with zero network latency."
    },
    {
      icon: <MousePointerClick size={32} style={{ color: 'var(--mint-green)' }} />,
      title: "AI Routing",
      description: "Stop hunting for tools. Typed instructions are parsed locally and route you to the exact workspace you need instantly."
    }
  ];

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.header}>
        <div className={styles.badge}><Info size={16} /> About Pixie</div>
        <h1 className={styles.title}>The Future of <span className={styles.titleHighlight}>Private Magic</span></h1>
        <p className={styles.subtitle}>
          Pixie was born from a simple idea: AI should be powerful, but your privacy should be absolute. 
          We've built a sanctuary for your media where compute is local and your data is sacred.
        </p>
      </div>

      <div className={styles.grid}>
        {features.map((f, i) => (
          <motion.div 
            key={i} 
            className={styles.featureCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className={styles.featureIcon}>{f.icon}</div>
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureDesc}>{f.description}</p>
          </motion.div>
        ))}
      </div>

      {/* WASM Micro-Explainer Section */}
      <div className={styles.card} style={{ marginTop: '3rem', padding: '3.5rem 3rem' }}>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Globe size={24} style={{ color: 'var(--gentle-lilac)' }} />
          What is WebAssembly (WASM)?
        </h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '1.05rem', marginBottom: '2.5rem' }}>
          Normally, websites have to send your files to their remote cloud servers to perform complex transformations (like editing a PDF, resizing an image, or rendering a video). 
          <strong> WebAssembly</strong> changes everything. It is a revolutionary browser technology that allows desktop-grade performance engines to run securely inside your browser tab.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
            <h4 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.5rem', color: '#10b981' }}>🔒 Zero Server Uploads</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Since the conversion logic executes right on your computer's browser engine, your raw files are never transmitted over the internet.
            </p>
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
            <h4 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.5rem', color: '#a855f7' }}>⚡ Near-Native Speed</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              WASM is compiled to high-speed binary instructions that execute directly on your processor, making local conversions instantly responsive.
            </p>
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
            <h4 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.5rem', color: '#06b6d4' }}>📶 Works 100% Offline</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Once the web app loads, you can completely disconnect your Wi-Fi or go offline. All spells and engines continue to work perfectly.
            </p>
          </div>
        </div>
      </div>

      {/* Meet the Creator Section */}
      <div className={styles.card} style={{ marginTop: '4rem', padding: '3rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ flexShrink: 0, position: 'relative' }}>
            <div style={{ 
              width: '180px', 
              height: '180px', 
              borderRadius: '50%', 
              overflow: 'hidden', 
              border: '4px solid var(--mint-green)',
              boxShadow: 'var(--shadow-bento)'
            }}>
              <img 
                src="/zefi-bhai.png" 
                alt="Zefi Bhai" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ 
              position: 'absolute', 
              bottom: '10px', 
              right: '10px', 
              background: 'var(--mint-green)', 
              color: 'var(--deep-charcoal)',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={16} />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '300px', textAlign: 'left' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Meet the Wizard: Zefi Bhai</h2>
            <p style={{ color: 'var(--mint-green)', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={16} /> Creator, Developer & Visionary
            </p>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '2rem', fontSize: '1.1rem' }}>
              Pixie is the culmination of my mission to democratize enterprise-grade file tools. I've spent years building communities and tech that put power back into the hands of the individuals. 
              Pixie is built differently—it respects your machine, your bandwidth, and most importantly, your privacy.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a 
                href="https://youtube.com/@zefibhai" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.payoutBtn} 
                style={{ background: '#FF0000', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '12px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 700 }}
              >
                <Play size={18} /> @zefibhai
              </a>
              <a 
                href="https://instagram.com/zefibhai" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.payoutBtn} 
                style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '12px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 700 }}
              >
                <Camera size={18} /> @zefibhai
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card} style={{ textAlign: 'center', marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <Heart size={24} style={{ color: '#ff4757' }} /> Built with Passion
        </h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '700px', margin: '0 auto' }}>
          Pixie is an independent project dedicated to reclaiming computational sovereignty. By running expensive operations on your hardware, we've eliminated the need for tracking, middle-men, and subscription burnout. 
        </p>
      </div>
    </div>
  );
}

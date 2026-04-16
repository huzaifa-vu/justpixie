"use client";

import { Lock, Zap, MousePointerClick, Info } from "lucide-react";
import styles from "../meta-pages.module.css";

export default function AboutPage() {
  const features = [
    {
      icon: <Lock size={32} style={{ color: 'var(--mint-green)' }} />,
      title: "Absolute Privacy",
      description: "By utilizing WebAssembly (WASM), tools like our Background Remover and Image Compressor run entirely within your browser. Your sensitive files never touch our servers."
    },
    {
      icon: <Zap size={32} style={{ color: 'var(--gentle-lilac)' }} />,
      title: "Blazing Fast",
      description: "Waiting for server uploads and spinning loaders is a thing of the past. Transformation operations occur instantly, leveraging your own CPU and memory for zero-latency feedback."
    },
    {
      icon: <MousePointerClick size={32} style={{ color: 'var(--mint-green)' }} />,
      title: "Prompt Engine",
      description: "Instead of navigating a maze of 40+ complex tools, Pixie lets you simply type what you want done. Our local NLP routing handles the rest and instantly prepares your workspace."
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.badge}><Info size={16} /> About Pixie</div>
        <h1 className={styles.title}>The Future of <span className={styles.titleHighlight}>Local Transformation</span></h1>
        <p className={styles.subtitle}>
          Pixie was built with a single mission: To combine the power of AI prompting with the sheer speed and absolute privacy of local browser execution.
        </p>
      </div>

      <div className={styles.grid}>
        {features.map((f, i) => (
          <div key={i} className={styles.featureCard}>
            <div className={styles.featureIcon}>{f.icon}</div>
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureDesc}>{f.description}</p>
          </div>
        ))}
      </div>

      <div className={styles.card} style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', fontWeight: 800 }}>Indie & Open</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
          Pixie is an independent project dedicated to reclaiming computational sovereignty. By running expensive operations on your hardware, we reduce server costs and pass those savings (and privacy) directly to you.
        </p>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { 
  Video, Headphones, VolumeX, Shrink, FileVideo, 
  RotateCw, Gauge, Scissors, Camera, ArrowRight, 
  Plus 
} from "lucide-react";
import styles from "../page.module.css";
import Link from "next/link";

export default function VideoCategoryHome() {
  const tools = [
    { name: 'A/V Merger', type: 'Utility', desc: 'Locally merge video & audio streams.', href: '/dashboard/video/merge', icon: Plus },
    { name: 'Video to Audio', type: 'Video', desc: 'Extract MP3 directly in browser.', href: '/dashboard/video/audio', icon: Headphones },
    { name: 'Video Silencer', type: 'Video', desc: 'Mute track audio natively.', href: '/dashboard/video/silence', icon: VolumeX },
    { name: 'Compress Video', type: 'Video', desc: 'Lossy size reduction without servers.', href: '/dashboard/video/compress', icon: Shrink },
    { name: 'GIF Maker', type: 'Video', desc: 'Convert video slices into looped GIFs.', href: '/dashboard/video/gif', icon: FileVideo },
    { name: 'Rotate Video', type: 'Video', desc: 'Rotate 90°/180°/270° via WASM.', href: '/dashboard/video/rotate', icon: RotateCw },
    { name: 'Video Speed', type: 'Video', desc: 'Speed up or slow down video playback.', href: '/dashboard/video/speed', icon: Gauge },
    { name: 'Video Trimmer', type: 'Video', desc: 'Slice segments precisely without delays.', href: '/dashboard/video/trim', icon: Scissors },
    { name: 'To Screenshots', type: 'Video', desc: 'Capture frames natively at intervals.', href: '/dashboard/video/screenshots', icon: Camera }
  ];

  return (
    <div className={styles.dashboardContainer} style={{ height: 'auto', padding: '1rem', background: 'transparent' }}>
      <div className={styles.aiCommandBox} style={{ background: 'var(--gentle-lilac)', color: 'var(--deep-charcoal)', marginBottom: '2rem' }}>
        <div className={styles.aiHeader}>
          <Video size={20} className={styles.wandStar} style={{ color: 'var(--deep-charcoal)' }} />
          <span style={{ color: 'var(--deep-charcoal)' }}>Video Hub</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Video Alchemy</h1>
        <p style={{ opacity: 0.8, maxWidth: '600px' }}>
          Powered by ffmpeg.wasm. Perform complex video alterations with blistering speed inside Chromium.
        </p>
      </div>

      <div className={styles.toolsGrid}>
        {tools.map((tool, idx) => (
          <Link href={tool.href} key={idx} style={{ textDecoration: 'none' }}>
            <motion.div 
              className={styles.toolCard}
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className={styles.toolHeader}>
                <div className={styles.toolIconContainer}>
                  <tool.icon size={24} className={styles.toolIcon} />
                </div>
                <span className={styles.toolBadge}>{tool.type}</span>
              </div>
              <h4 className={styles.toolName}>{tool.name}</h4>
              <p className={styles.toolDesc}>{tool.desc}</p>
              <div className={styles.toolArrowBtn}>
                <ArrowRight size={18} />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

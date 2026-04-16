"use client";

import { motion } from "framer-motion";
import { 
  Play, Share2, Globe, Camera, ArrowRight, Download
} from "lucide-react";
import styles from "../page.module.css";
import Link from "next/link";

export default function DownloadHubHome() {
  const tools = [
    { name: 'YouTube Downloader', type: 'Download', desc: 'Save videos directly to your device.', href: '/dashboard/download/youtube', icon: Play },
    { name: 'Instagram Downloader', type: 'Download', desc: 'Download Reels and IG posts.', href: '/dashboard/download/instagram', icon: Camera },
    { name: 'X / Twitter Downloader', type: 'Download', desc: 'Capture videos and GIFs from X/Twitter.', href: '/dashboard/download/twitter', icon: Share2 },
    { name: 'Facebook Downloader', type: 'Download', desc: 'Archive Facebook videos securely.', href: '/dashboard/download/facebook', icon: Globe },
  ];

  return (
    <div className={styles.dashboardContainer} style={{ height: 'auto', padding: '1rem', background: 'transparent' }}>
      <div className={styles.aiCommandBox} style={{ background: 'var(--gentle-lilac)', color: 'var(--deep-charcoal)', marginBottom: '2rem' }}>
        <div className={styles.aiHeader}>
          <Download size={20} className={styles.wandStar} style={{ color: 'var(--deep-charcoal)' }} />
          <span style={{ color: 'var(--deep-charcoal)' }}>Resource Hub</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 900 }}>Download Hub</h1>
        <p style={{ opacity: 0.8, maxWidth: '600px' }}>
          Extract and archive media from across the web. Pixie uses a local-first proxy system to ensure your downloads remain private and high-speed.
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

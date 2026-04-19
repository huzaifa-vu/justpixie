"use client";

import { motion } from "framer-motion";
import { Wand2, FileText, Shrink, Combine, SplitSquareHorizontal, Lock, Image as ImageIcon, RotateCcw, Hash, Type, GripVertical, ArrowRight, ShieldCheck } from "lucide-react";
import styles from "../page.module.css";
import Link from "next/link";

export default function PDFCategoryHome() {
  const tools = [
    { name: 'Compress PDF', type: 'PDF', desc: 'Reduce megabytes in seconds.', href: '/dashboard/pdf/compress', icon: Shrink },
    { name: 'Merge PDF', type: 'PDF', desc: 'Combine multiple documents gracefully.', href: '/dashboard/pdf/merge', icon: Combine },
    { name: 'Split PDF', type: 'PDF', desc: 'Extract specific pages rapidly.', href: '/dashboard/pdf/split', icon: SplitSquareHorizontal },
    { name: 'Privacy & Metadata', type: 'PDF', desc: 'Scrub identity data and flatten content.', href: '/dashboard/pdf/lock', icon: ShieldCheck },
    { name: 'PDF to Images', type: 'PDF', desc: 'Extract pages as image files.', href: '/dashboard/pdf/pdf-to-images', icon: ImageIcon },
    { name: 'Rotate Pages', type: 'PDF', desc: 'Rotate all pages by 90/180/270\u00b0.', href: '/dashboard/pdf/rotate', icon: RotateCcw },
    { name: 'Add Page Numbers', type: 'PDF', desc: 'Stamp sequential numbers on pages.', href: '/dashboard/pdf/page-numbers', icon: Hash },
    { name: 'Text Watermark', type: 'PDF', desc: 'Stamp diagonal text across pages.', href: '/dashboard/pdf/text-watermark', icon: Type },
    { name: 'Reorder Pages', type: 'PDF', desc: 'Visually swap, drag or delete pages.', href: '/dashboard/pdf/reorder', icon: GripVertical }
  ];

  return (
    <div className={styles.dashboardContainer} style={{ height: 'auto', padding: '1rem', background: 'transparent' }}>
      <div className={styles.aiCommandBox} style={{ background: 'var(--gentle-lilac)', color: 'var(--deep-charcoal)', marginBottom: '2rem' }}>
        <div className={styles.aiHeader}>
          <FileText size={20} className={styles.wandStar} style={{ color: 'var(--deep-charcoal)' }} />
          <span style={{ color: 'var(--deep-charcoal)' }}>PDF Hub</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>PDF Spells</h1>
        <p style={{ opacity: 0.8, maxWidth: '600px' }}>
          Select a spell to run. All document splicing, merging, and compression executes precisely on your hardware.
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

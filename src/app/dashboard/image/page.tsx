"use client";

import { motion } from "framer-motion";
import { Wand2, Image as ImageIcon, Shrink, Eraser, Replace, Stamp, Maximize, Crop, RotateCcw, Sliders, Square, Palette, Pencil, FileText , ArrowRight } from "lucide-react";
import styles from "../page.module.css";
import Link from "next/link";

export default function ImageCategoryHome() {
  const tools = [
    { name: 'Image Compressor', type: 'Image', desc: 'Instant shrink ray magic for heavy images.', href: '/dashboard/image/compress', icon: Shrink },
    { name: 'Background Remover', type: 'Image', desc: 'AI-powered exact subject cutout.', href: '/dashboard/image/bg-remove', icon: Eraser },
    { name: 'Format Converter', type: 'Image', desc: 'Batch convert between WebP, JPG, PNG & more.', href: '/dashboard/image/format', icon: Replace },
    { name: 'Watermark Wizard', type: 'Image', desc: 'Automatically stamp bulk visual assets.', href: '/dashboard/image/watermark', icon: Stamp },
    { name: 'Image Resizer', type: 'Image', desc: 'Scale to exact dimensions with ratio lock.', href: '/dashboard/image/resize', icon: Maximize },
    { name: 'Image Cropper', type: 'Image', desc: 'Slice pixel regions from any image.', href: '/dashboard/image/crop', icon: Crop },
    { name: 'Rotate & Flip', type: 'Image', desc: 'Rotate 90°/180°/270° and flip images.', href: '/dashboard/image/rotate', icon: RotateCcw },
    { name: 'Image Filters', type: 'Image', desc: 'Grayscale, sepia, blur, brightness & more.', href: '/dashboard/image/filters', icon: Sliders },
    { name: 'Favicon Generator', type: 'Image', desc: 'Generate favicons at all standard sizes.', href: '/dashboard/image/favicon', icon: Square },
    { name: 'Color Palette Extractor', type: 'Image', desc: 'Extract hex colors directly from photos.', href: '/dashboard/image/palette', icon: Palette },
    { name: 'Image Annotator', type: 'Image', desc: 'Draw annotations over images visually.', href: '/dashboard/image/annotate', icon: Pencil },
    { name: 'Images to PDF', type: 'Image', desc: 'Combine multiple images into a PDF.', href: '/dashboard/image/images-to-pdf', icon: FileText }
  ];

  return (
    <div className={styles.dashboardContainer} style={{ height: 'auto', padding: '1rem', background: 'transparent' }}>
      <div className={styles.aiCommandBox} style={{ background: 'var(--gentle-lilac)', color: 'var(--deep-charcoal)', marginBottom: '2rem' }}>
        <div className={styles.aiHeader}>
          <ImageIcon size={20} className={styles.wandStar} style={{ color: 'var(--deep-charcoal)' }} />
          <span style={{ color: 'var(--deep-charcoal)' }}>Image Hub</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Image Magic Tools</h1>
        <p style={{ opacity: 0.8, maxWidth: '600px' }}>
          Select a spell to run. All image manipulation executes purely locally on your device using WASM. 
          Zero server uploads required.
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

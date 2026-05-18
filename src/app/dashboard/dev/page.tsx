"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Wand2, Code, Braces, Binary, Lock, Palette, FileType, 
  LinkIcon, Key, Fingerprint, Clock, Minimize2, Terminal, 
  FileText, ArrowLeftRight, QrCode , ArrowRight, Search 
} from "lucide-react";
import styles from "../page.module.css";
import Link from "next/link";

export default function DevCategoryHome() {
  const [searchQuery, setSearchQuery] = useState("");

  const tools = [
    { name: 'JSON Formatter', type: 'Dev', desc: 'Beautify, minify, and validate JSON instantly.', href: '/dashboard/dev/json', icon: Braces },
    { name: 'Base64 Codec', type: 'Dev', desc: 'Encode and decode Base64 strings.', href: '/dashboard/dev/base64', icon: Binary },
    { name: 'Hash Generator', type: 'Dev', desc: 'Generate MD5, SHA-1, SHA-256 hashes.', href: '/dashboard/dev/hash', icon: Lock },
    { name: 'Color Converter', type: 'Dev', desc: 'Convert between HEX, RGB, HSL formats.', href: '/dashboard/dev/color', icon: Palette },
    { name: 'Lorem Generator', type: 'Dev', desc: 'Generate placeholder text on demand.', href: '/dashboard/dev/lorem', icon: FileType },
    { name: 'URL Encoder', type: 'Dev', desc: 'Encode and decode URL components.', href: '/dashboard/dev/url', icon: LinkIcon },
    { name: 'JWT Decoder', type: 'Dev', desc: 'Inspect header and payload of JWT tokens.', href: '/dashboard/dev/jwt', icon: Key },
    { name: 'UUID Generator', type: 'Dev', desc: 'Generate cryptographic v4 UUIDs.', href: '/dashboard/dev/uuid', icon: Fingerprint },
    { name: 'Timestamp Converter', type: 'Dev', desc: 'Convert Unix timestamps to dates.', href: '/dashboard/dev/timestamp', icon: Clock },
    { name: 'Code Minifier', type: 'Dev', desc: 'Strip whitespace from CSS/HTML/JS.', href: '/dashboard/dev/minifier', icon: Minimize2 },
    { name: 'Regex Tester', type: 'Dev', desc: 'Test JS regular expressions safely.', href: '/dashboard/dev/regex', icon: Terminal },
    { name: 'Markdown Previewer', type: 'Dev', desc: 'Render markdown to formatting instantly.', href: '/dashboard/dev/markdown', icon: FileText },
    { name: 'Diff Checker', type: 'Dev', desc: 'Compare text diffs side-by-side.', href: '/dashboard/dev/diff', icon: ArrowLeftRight },
    { name: 'QR Code Generator', type: 'Dev', desc: 'Generate URL and text QR Codes.', href: '/dashboard/dev/qr', icon: QrCode }
  ];

  const filteredTools = useMemo(() => {
    return tools.filter(tool => 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      tool.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className={styles.dashboardContainer} style={{ height: 'auto', padding: '1rem', background: 'transparent' }}>
      <div className={styles.aiCommandBox} style={{ background: 'var(--gentle-lilac)', color: 'var(--deep-charcoal)', marginBottom: '2rem' }}>
        <div className={styles.aiHeader}>
          <Code size={20} className={styles.wandStar} style={{ color: 'var(--deep-charcoal)' }} />
          <span style={{ color: 'var(--deep-charcoal)' }}>Dev Hub</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Dev Utilities</h1>
        <p style={{ opacity: 0.8, maxWidth: '600px' }}>
          Essential developer micro-tools. All run locally — no API calls, no data leaves your machine.
        </p>
      </div>

      <div className={styles.hubHeaderBar}>
        <div className={styles.hubStatsText}>
          <span>Available spells</span>
          <span className={styles.hubStatsCount}>{filteredTools.length}</span>
        </div>
        
        <div className={styles.hubSearchWrapper}>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dev tools..."
            className={styles.hubSearchInput}
          />
          <Search size={16} className={styles.hubSearchIcon} />
        </div>
      </div>

      {filteredTools.length === 0 ? (
        <div className={styles.hubEmptyState}>
          <div className={styles.hubEmptyTitle}>No spells found matching "{searchQuery}"</div>
          <div className={styles.hubEmptyText}>Try adjusting your parameters or looking for another local action.</div>
        </div>
      ) : (
        <div className={styles.toolsGrid}>
          {filteredTools.map((tool, idx) => (
            <Link href={tool.href} key={idx} style={{ textDecoration: 'none' }}>
              <motion.div
                className={styles.toolCard}
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
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
      )}
    </div>
  );
}

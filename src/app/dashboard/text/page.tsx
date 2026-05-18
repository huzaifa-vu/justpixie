"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Wand2, FileText, Type, CaseUpper, FileSearch, Table, Mic , ArrowRight, Search } from "lucide-react";
import styles from "../page.module.css";
import Link from "next/link";

export default function TextCategoryHome() {
  const [searchQuery, setSearchQuery] = useState("");

  const tools = [
    { name: 'Word Counter', type: 'Text', desc: 'Count words, characters, sentences instantly.', href: '/dashboard/text/word-counter', icon: Type },
    { name: 'Case Converter', type: 'Text', desc: 'Switch between UPPER, lower, Title, camelCase, snake_case.', href: '/dashboard/text/case-converter', icon: CaseUpper },
    { name: 'Find & Replace', type: 'Text', desc: 'Replace text occurrences natively with Regex.', href: '/dashboard/text/replace', icon: FileSearch },
    { name: 'CSV to JSON', type: 'Data', desc: 'Convert spreadsheets to JSON strings.', href: '/dashboard/text/csv', icon: Table },
    { name: 'Text to Speech', type: 'Audio', desc: 'Convert written text to lifelike voice.', href: '/dashboard/text/speech', icon: Mic },
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
          <FileText size={20} className={styles.wandStar} style={{ color: 'var(--deep-charcoal)' }} />
          <span style={{ color: 'var(--deep-charcoal)' }}>Text Hub</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Text & Data</h1>
        <p style={{ opacity: 0.9, maxWidth: '600px' }}>Everyday text manipulation tools for writers, students, and developers alike.</p>
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
            placeholder="Search text tools..."
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

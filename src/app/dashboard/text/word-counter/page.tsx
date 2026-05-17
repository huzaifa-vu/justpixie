"use client";

import { useState } from "react";
import { WholeWord, Wand2, Copy, Check } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../../dev/dev.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function WordCounter() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const { settings } = useSettings();

  useAiHydration(({ params }) => {
    if (params.inputText) setText(params.inputText);
  }, "/dashboard/text/word-counter");

  const stats = {
    words: text.trim().split(/\s+/).filter(w => w.length > 0).length,
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    paragraphs: text.split(/\n+/).filter(p => p.trim().length > 0).length,
    sentences: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolWrapper title="Word Counter" description="Instantly analyze text metrics, characters, grammar elements, and reading time." icon={WholeWord}>

      <div className={styles.workspace}>
        <div className={styles.editorArea}>
          <div className={styles.textPanel}>
            <div className={styles.panelHeader}>Source Text</div>
            <textarea
              className={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type your text here..."
              style={{ fontSize: '1.125rem' }}
            />
          </div>
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Wand2 size={20} />
            <h2>Statistics</h2>
          </div>
          <div className={styles.configBody}>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-inner)', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)' }}>{stats.words}</div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Words</div>
                </div>
                <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-inner)', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)' }}>{stats.characters}</div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Characters</div>
                </div>
             </div>

            <div style={{ background: 'var(--surface-card)', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-inner)', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Characters (no spaces)</span>
                <span style={{ fontWeight: 600 }}>{stats.charactersNoSpaces}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sentences</span>
                <span style={{ fontWeight: 600 }}>{stats.sentences}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>Paragraphs</span>
                <span style={{ fontWeight: 600 }}>{stats.paragraphs}</span>
              </div>
            </div>

            <button className={styles.actionBtnAlt} onClick={handleCopy} disabled={!text.trim()}>
              {copied ? <><Check size={18} /> Copied!</> : <><Copy size={18} /> Copy Text</>}
            </button>

            <button 
              className={styles.copyBtn} 
              onClick={() => setText("")}
              style={{ marginTop: 'auto' }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


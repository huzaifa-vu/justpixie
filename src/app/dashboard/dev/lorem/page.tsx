"use client";
import { useEffect, useState, useRef } from "react";
import { Type, Copy, Check } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../dev.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
const LOREM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

export default function LoremGenerator() {
    const [autoRun, setAutoRun] = useState(false);
  const [count, setCount] = useState(3);
  const [type, setType] = useState<"paragraphs" | "characters">("paragraphs");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const { settings } = useSettings();

  const generate = () => { 
    if (type === "paragraphs") {
      const safeCount = Math.min(100, count);
      setOutput(Array(safeCount).fill(LOREM).join("\n\n")); 
    } else {
      const safeCount = Math.min(30000, count);
      let chars = "";
      while (chars.length < safeCount) chars += LOREM + " ";
      setOutput(chars.slice(0, safeCount));
    }
  };
  const copyOut = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  useAiHydration(({ params, autoExecute }) => {
    if (params?.count) setCount(Number(params.count));
    if (params?.type) setType(params.type as any);
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/dev/lorem");

  useEffect(() => {
    if (autoRun) {
      generate();
      setAutoRun(false);
    }
  }, [autoRun, count, type]);

  useEffect(() => {
    if (output && settings.autoCopy) {
      copyOut();
    }
  }, [output, settings.autoCopy]);

  useEffect(() => {
    // Show 3 paragraphs by default on load
    setOutput(Array(3).fill(LOREM).join("\n\n"));
  }, []);


  return (
    <ToolWrapper title="Lorem Generator" description="Generate placeholder text blocks on demand." icon={Type}>
      <div className={styles.workspace}>
        <div className={styles.editorArea}>
          <div className={styles.textPanel}><div className={styles.panelHeader}><span>Generated Text</span>{output && <button onClick={copyOut} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)'}}>{copied ? <Check size={16}/> : <Copy size={16}/>}</button>}</div><textarea className={styles.textarea} value={output} readOnly placeholder="Click Generate to create placeholder text..." /></div>
        </div>
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><Type size={20} /><h2>Config</h2></div>
          <div className={styles.configBody}>
            
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Generation Type</label>
              <div style={{ display: 'flex', gap: '1rem', background: 'var(--background)', padding: '0.4rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)' }}>
                <button 
                  onClick={() => setType("paragraphs")}
                  style={{ 
                    flex: 1, padding: '0.6rem', border: 'none', borderRadius: 'var(--radius-pill)', 
                    background: type === "paragraphs" ? 'var(--foreground)' : 'transparent',
                    color: type === "paragraphs" ? 'var(--background)' : 'var(--text-muted)',
                    fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  Paragraphs
                </button>
                <button 
                  onClick={() => setType("characters")}
                  style={{ 
                    flex: 1, padding: '0.6rem', border: 'none', borderRadius: 'var(--radius-pill)', 
                    background: type === "characters" ? 'var(--foreground)' : 'transparent',
                    color: type === "characters" ? 'var(--background)' : 'var(--text-muted)',
                    fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  Characters
                </button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>{type === "paragraphs" ? "Number of Paragraphs" : "Number of Characters"}</label>
              <input 
                type="text" 
                value={count} 
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setCount(val ? parseInt(val) : 0);
                }} 
                className={styles.textInput} 
                style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 600 }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                {type === "paragraphs" ? "Max 100 paragraphs" : "Max 30,000 chars"}
              </span>
              {((type === "paragraphs" && count > 100) || (type === "characters" && count > 30000)) && (
                <div className={styles.statusBad} style={{ fontSize: '0.75rem', padding: '0.4rem', marginTop: '0.4rem' }}>
                  Limit exceeded! Will cap at max.
                </div>
              )}
            </div>

            <button className={styles.actionBtn} onClick={generate} style={{ marginTop: '0.5rem' }}>Generate Lorem</button>
            <button className={styles.copyBtn} onClick={copyOut}>{copied ? "Copied!" : "Copy Text"}</button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}



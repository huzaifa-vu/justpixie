"use client";

import { useEffect, useState, useRef } from "react";
import { Link2, Copy, RefreshCw, Layers } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { useRouter } from "next/navigation";
import styles from "../dev.module.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
export default function UuidGenerator() {
  const router = useRouter();
    const [autoRun, setAutoRun] = useState(false);
  const [amount, setAmount] = useState(5);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { settings } = useSettings();

  const generateUuids = () => {
    const newUuids = Array.from({ length: amount }, () => {
      // Use modern crypto API natively supported in all modern browsers
      return window.crypto.randomUUID();
    });
    setUuids(newUuids);
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(uuids.join("\n"));
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 1500);
  };
  useAiHydration(({ params, autoExecute }) => {
    if (params?.count) setAmount(Number(params.count));
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/dev/uuid");

  useEffect(() => {
    if (uuids.length > 0 && settings.autoCopy) {
      copyAll();
    }
  }, [uuids, settings.autoCopy]);

  useEffect(() => {
    if (autoRun) {
      generateUuids();
      setAutoRun(false);
    }
  }, [autoRun]);


  return (
    <ToolWrapper title="UUID v4 Generator" description="Instantly generate globally unique identifiers (UUIDs) for your databases and keys." icon={Link2}>

      <div className={styles.workspace}>
        <div className={styles.editorArea}>
          <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-bento)', border: '1px solid var(--border)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '400px' }}>
            {uuids.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Select quantity and press Generate
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', flex: 1 }}>
                {uuids.map((id, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--background)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--pixie-teal)' }}>{id}</span>
                    <button 
                      onClick={() => copyToClipboard(id, i)}
                      style={{ background: 'transparent', border: 'none', color: copiedIndex === i ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Copy size={16} /> {copiedIndex === i ? 'Copied' : ''}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Layers size={20} />
            <h2>Generator Settings</h2>
          </div>
          <div className={styles.configBody}>
            <div className={styles.fieldGroup}>
              <span className={styles.label}>Quantity to Generate</span>
              <input 
                type="number" 
                min="1" 
                max="500" 
                value={amount} 
                onChange={(e) => setAmount(Number(e.target.value))}
                className={styles.numberInput} 
              />
            </div>
            <button className={styles.actionBtn} onClick={generateUuids} style={{ marginTop: '1rem' }}>
              <RefreshCw size={18} /> Generate UUIDs
            </button>
            <button className={styles.copyBtn} onClick={copyAll} disabled={uuids.length === 0}>
               {copiedIndex === -1 ? 'Copied All!' : 'Copy All to Clipboard'}
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}



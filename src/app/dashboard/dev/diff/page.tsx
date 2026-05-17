"use client";

import { useState, useMemo } from "react";
import { FileDiff, Wand2, ArrowRightLeft } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import * as diffObj from "diff";
import styles from "../dev.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function DiffChecker() {
  const [oldText, setOldText] = useState("module.exports = {\n  version: 1.0,\n  author: 'Pixie Studio'\n};");
  const [newText, setNewText] = useState("module.exports = {\n  version: 1.1,\n  author: 'Pixie Studio'\n};");
  const { settings } = useSettings();

  useAiHydration(({ params }) => {
    if (params.oldText) setOldText(params.oldText);
    if (params.newText) setNewText(params.newText);
  }, "/dashboard/dev/diff");

  const diffResult = useMemo(() => {
    if (!oldText && !newText) return [];
    return diffObj.diffLines(oldText, newText);
  }, [oldText, newText]);

  return (
    <ToolWrapper title="Diff Checker" description="Compare two text variations side-by-side to pinpoint exactly what changed." icon={FileDiff}>

      <div className={styles.workspace} style={{ flexDirection: 'column' }}>
        
        <div className={styles.diffInputsWrapper}>
          <div className={styles.textPanel} style={{ flex: 1 }}>
            <div className={styles.panelHeader} style={{ background: 'rgba(220, 38, 38, 0.05)' }}>Original Text</div>
            <textarea
              className={styles.textarea}
              value={oldText}
              onChange={(e) => setOldText(e.target.value)}
              placeholder="Paste original text here..."
              style={{ whiteSpace: 'pre' }}
            />
          </div>
          <div className={styles.diffArrow}>
             <ArrowRightLeft size={32} />
          </div>
          <div className={styles.textPanel} style={{ flex: 1 }}>
            <div className={styles.panelHeader} style={{ background: 'rgba(22, 163, 74, 0.05)' }}>Modified Text</div>
            <textarea
              className={styles.textarea}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Paste modified text here..."
              style={{ whiteSpace: 'pre' }}
            />
          </div>
        </div>

        <div className={styles.textPanel} style={{ flex: 1, minHeight: '300px', backgroundColor: 'var(--surface-card)', color: 'var(--foreground)' }}>
           <div className={styles.panelHeader} style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}>Unified Diff Result</div>
           <div style={{ padding: '1.5rem', fontFamily: 'monospace', fontSize: '1rem', overflowY: 'auto' }}>
              {diffResult.map((part, index) => {
                 let color = 'var(--foreground)';
                 let bgColor = 'transparent';
                 let prefix = ' ';
                 
                 if (part.added) {
                   color = 'var(--pixie-teal)';
                   bgColor = 'rgba(20, 184, 166, 0.1)';
                   prefix = '+';
                 } else if (part.removed) {
                   color = 'var(--danger-text)';
                   bgColor = 'rgba(239, 68, 68, 0.1)';
                   prefix = '-';
                 }

                 return (
                   <div key={index} style={{ color, backgroundColor: bgColor, whiteSpace: 'pre-wrap', padding: '0 0.5rem' }}>
                     {part.value.endsWith('\n') ? 
                        part.value.slice(0, -1).split('\n').map((line, i) => <div key={i}>{prefix} {line}</div>) :
                        part.value.split('\n').map((line, i) => <div key={i}>{prefix} {line}</div>)
                     }
                   </div>
                 );
              })}
           </div>
        </div>

      </div>
    </ToolWrapper>
  );
}


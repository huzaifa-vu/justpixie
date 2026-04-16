"use client";

import { useState } from "react";
import { Type, Wand2, Copy, Check } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../../dev/dev.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { useEffect } from "react";

export default function CaseConverter() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const { settings } = useSettings();

  useAiHydration(({ params, autoExecute }) => {
    if (params.inputText) setText(params.inputText);
    // Auto-apply the requested case if specified
    if (autoExecute && params.inputText && params.targetCase) {
      const t = params.inputText;
      switch (params.targetCase) {
        case 'upper': setText(t.toUpperCase()); break;
        case 'lower': setText(t.toLowerCase()); break;
        case 'title': setText(t.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())); break;
        default: setText(t);
      }
    }
  }, "/dashboard/text/case-converter");

  useEffect(() => {
    if (text && settings.autoCopy) {
      handleCopy();
    }
  }, [text, settings.autoCopy]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toSentenceCase = () => {
    setText(text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase()));
  };

  const toTitleCase = () => {
    setText(text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()));
  };

  const toCamelCase = () => {
    setText(text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, ''));
  };

  const toSnakeCase = () => {
    setText(text.replace(/\W+/g, " ")
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_'));
  };

  return (
    <ToolWrapper title="Case Converter" description="Transform your text into UPPERCASE, lowercase, Title Case, camelCase, and more." icon={Type}>

      <div className={styles.workspace}>
        <div className={styles.editorArea}>
          <div className={styles.textPanel}>
            <div className={styles.panelHeader}>Source Text</div>
            <textarea
              className={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text sequence here..."
              style={{ fontSize: '1.125rem' }}
            />
          </div>
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Wand2 size={20} />
            <h2>Transform Options</h2>
          </div>
          <div className={styles.configBody}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
               <button className={styles.copyBtn} onClick={() => setText(text.toUpperCase())} style={{ padding: '0.75rem' }}>UPPERCASE</button>
               <button className={styles.copyBtn} onClick={() => setText(text.toLowerCase())} style={{ padding: '0.75rem' }}>lowercase</button>
               <button className={styles.copyBtn} onClick={toSentenceCase} style={{ padding: '0.75rem' }}>Sentence case</button>
               <button className={styles.copyBtn} onClick={toTitleCase} style={{ padding: '0.75rem' }}>Title Case</button>
               <button className={styles.copyBtn} onClick={toCamelCase} style={{ padding: '0.75rem', gridColumn: 'span 2' }}>camelCase</button>
               <button className={styles.copyBtn} onClick={toSnakeCase} style={{ padding: '0.75rem', gridColumn: 'span 2' }}>snake_case</button>
            </div>

            <button className={styles.actionBtnAlt} onClick={handleCopy} disabled={!text.trim()} style={{ marginTop: '1rem' }}>
              {copied ? <><Check size={18} /> Copied!</> : <><Copy size={18} /> Copy Output</>}
            </button>

            <button 
              className={styles.copyBtn} 
              onClick={() => setText("")}
              style={{ marginTop: 'auto' }}
            >
              Clear Text
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


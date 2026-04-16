"use client";

import { useState, useEffect } from "react";
import { CaseSensitive, Wand2, ArrowRightLeft, Copy, Check, Regex } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../../dev/dev.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function FindReplace() {
  const [inputText, setInputText] = useState("");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [outputText, setOutputText] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { settings } = useSettings();

  // AI Hydration
  useAiHydration(({ params }) => {
    if (params.inputText) setInputText(params.inputText);
    if (params.findText) setFindText(params.findText);
    if (params.replaceText) setReplaceText(params.replaceText);
  }, "/dashboard/text/replace");

  useEffect(() => {
    if (!findText) {
      setOutputText(inputText);
      setErrorMsg("");
      return;
    }

    try {
      if (useRegex) {
        const flags = caseSensitive ? "g" : "gi";
        const regex = new RegExp(findText, flags);
        setOutputText(inputText.replace(regex, replaceText.replace(/\\n/g, '\n')));
      } else {
        if (caseSensitive) {
          // split and join for global exact replace
          setOutputText(inputText.split(findText).join(replaceText));
        } else {
          // regex with escape
          const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapeRegExp(findText), "gi");
          setOutputText(inputText.replace(regex, replaceText));
        }
      }
      setErrorMsg("");
    } catch (e: any) {
      setErrorMsg("Invalid Regex");
    }
  }, [inputText, findText, replaceText, useRegex, caseSensitive]);

  useEffect(() => {
    if (outputText && outputText !== inputText && settings.autoCopy) {
      handleCopy();
    }
  }, [outputText, settings.autoCopy]);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolWrapper title="Find & Replace" description="Replace text occurrences with regex support, purely in your browser." icon={ArrowRightLeft}>

      <div className={styles.workspace}>
        <div className={styles.editorArea}>
          <div className={styles.textPanel}>
            <div className={styles.panelHeader}>Input Text</div>
            <textarea
              className={styles.textarea}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your source text here..."
            />
          </div>
          
          <div className={styles.textPanel}>
            <div className={styles.panelHeader}>Output Text</div>
            <textarea
              className={styles.textarea}
              value={outputText}
              readOnly
              placeholder="Replaced text will appear here..."
              style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
            />
          </div>
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Wand2 size={20} />
            <h2>Config</h2>
          </div>
          <div className={styles.configBody}>
            
            <div className={styles.fieldGroup}>
              <span className={styles.label}>Find</span>
              <input
                type="text"
                className={styles.textInput}
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Text or Regex..."
              />
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.label}>Replace With</span>
              <input
                type="text"
                className={styles.textInput}
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Replacement text..."
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-inner)',
                  border: `1px solid ${useRegex ? 'var(--mint-green)' : 'var(--border)'}`,
                  background: useRegex ? 'rgba(167, 243, 208, 0.1)' : 'transparent',
                  color: useRegex ? 'var(--deep-charcoal)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onClick={() => setUseRegex(!useRegex)}
              >
                <Regex size={16} /> Regex
              </button>
              
              <button
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-inner)',
                  border: `1px solid ${caseSensitive ? 'var(--mint-green)' : 'var(--border)'}`,
                  background: caseSensitive ? 'rgba(167, 243, 208, 0.1)' : 'transparent',
                  color: caseSensitive ? 'var(--deep-charcoal)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onClick={() => setCaseSensitive(!caseSensitive)}
              >
                <CaseSensitive size={16} /> Match Case
              </button>
            </div>

            {errorMsg && <div className={styles.statusBad}>{errorMsg}</div>}

            <div className={styles.infoBox}>
              <strong>Real-time Preview</strong>
              Input text is replaced instantly as you type.
            </div>

            <button className={styles.actionBtnAlt} onClick={handleCopy} disabled={!outputText}>
              {copied ? <><Check size={18} /> Copied!</> : <><Copy size={18} /> Copy Result</>}
            </button>

            <button 
              className={styles.copyBtn} 
              onClick={() => {
                setInputText("");
                setFindText("");
                setReplaceText("");
                setUseRegex(false);
                setCaseSensitive(false);
              }}
            >
              Clear All
            </button>

          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


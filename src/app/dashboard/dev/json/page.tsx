"use client";
import { useState } from "react";
import { Braces, Copy, Check, Minimize2, Maximize2 } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../dev.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { useEffect } from "react";

export default function JSONFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [copied, setCopied] = useState(false);
  const { settings } = useSettings();

  useAiHydration(({ params, autoExecute }) => {
    if (params.inputText) {
      setInput(params.inputText);
      if (autoExecute) {
        try { const parsed = JSON.parse(params.inputText); setOutput(JSON.stringify(parsed, null, 2)); setStatus("valid"); } catch { setStatus("invalid"); setOutput("Invalid JSON"); }
      }
    }
  }, "/dashboard/dev/json");

  useEffect(() => {
    if (output && status === "valid" && settings.autoCopy) {
      copyOutput();
    }
  }, [output, status, settings.autoCopy]);

  const beautify = () => {
    try { const parsed = JSON.parse(input); setOutput(JSON.stringify(parsed, null, 2)); setStatus("valid"); } catch { setStatus("invalid"); setOutput("Invalid JSON"); }
  };
  const minify = () => {
    try { const parsed = JSON.parse(input); setOutput(JSON.stringify(parsed)); setStatus("valid"); } catch { setStatus("invalid"); setOutput("Invalid JSON"); }
  };
  const copyOutput = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <ToolWrapper title="JSON Formatter" description="Beautify, minify, and validate JSON data instantly." icon={Braces}>
      <div className={styles.workspace}>
        <div className={styles.editorArea}>
          <div className={styles.textPanel}>
            <div className={styles.panelHeader}>Input</div>
            <textarea className={styles.textarea} value={input} onChange={(e) => { setInput(e.target.value); setStatus("idle"); }} placeholder='Paste your JSON here...' />
          </div>
          <div className={styles.textPanel}>
            <div className={styles.panelHeader}><span>Output</span>{output && <button onClick={copyOutput} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)'}}>{copied ? <Check size={16}/> : <Copy size={16}/>}</button>}</div>
            <textarea className={styles.textarea} value={output} readOnly placeholder="Result will appear here..." />
          </div>
        </div>
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><Braces size={20} /><h2>Actions</h2></div>
          <div className={styles.configBody}>
            {status === "valid" && <div className={styles.statusGood}>✓ Valid JSON</div>}
            {status === "invalid" && <div className={styles.statusBad}>✗ Invalid JSON</div>}
            <button className={styles.actionBtn} onClick={beautify}><Maximize2 size={18} /> Beautify</button>
            <button className={styles.actionBtnAlt} onClick={minify}><Minimize2 size={18} /> Minify</button>
            <button className={styles.copyBtn} onClick={copyOutput}>{copied ? "Copied!" : "Copy Output"}</button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


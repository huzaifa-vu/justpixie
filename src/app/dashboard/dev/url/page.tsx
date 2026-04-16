"use client";
import { useState, useEffect } from "react";
import { Link2, Copy, Check } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../dev.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function URLEncoder() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const { settings } = useSettings();

  useAiHydration(({ params, autoExecute }) => {
    if (params.inputText) {
      setInput(params.inputText);
      if (autoExecute) setOutput(encodeURIComponent(params.inputText));
    }
  }, "/dashboard/dev/url");

  useEffect(() => {
    if (output && settings.autoCopy && output !== "Invalid encoded URL") {
      copyOut();
    }
  }, [output, settings.autoCopy]);

  const encode = () => { setOutput(encodeURIComponent(input)); };
  const decode = () => { try { setOutput(decodeURIComponent(input)); } catch { setOutput("Invalid encoded URL"); } };
  const copyOut = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <ToolWrapper title="URL Encoder" description="Encode and decode URL components for safe transmission." icon={Link2}>
      <div className={styles.workspace}>
        <div className={styles.editorArea}>
          <div className={styles.textPanel}><div className={styles.panelHeader}>Input</div><textarea className={styles.textarea} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste URL or text here..." /></div>
          <div className={styles.textPanel}><div className={styles.panelHeader}><span>Output</span>{output && <button onClick={copyOut} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)'}}>{copied ? <Check size={16}/> : <Copy size={16}/>}</button>}</div><textarea className={styles.textarea} value={output} readOnly placeholder="Result appears here..." /></div>
        </div>
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><Link2 size={20} /><h2>Actions</h2></div>
          <div className={styles.configBody}>
            <button className={styles.actionBtn} onClick={encode}>Encode URL</button>
            <button className={styles.actionBtnAlt} onClick={decode}>Decode URL</button>
            <button className={styles.copyBtn} onClick={copyOut}>{copied ? "Copied!" : "Copy Output"}</button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


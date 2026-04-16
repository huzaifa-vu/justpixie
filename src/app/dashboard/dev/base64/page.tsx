"use client";
import { useState, useEffect } from "react";
import { Binary, Copy, Check } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../dev.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function Base64Codec() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const { settings } = useSettings();

  useAiHydration(({ params, autoExecute }) => {
    if (params.inputText) {
      setInput(params.inputText);
      if (autoExecute) {
        if (params.mode === "decode") { try { setOutput(decodeURIComponent(escape(atob(params.inputText)))); } catch { setOutput("Invalid Base64"); } }
        else { try { setOutput(btoa(unescape(encodeURIComponent(params.inputText)))); } catch { setOutput("Encoding failed"); } }
      }
    }
  }, "/dashboard/dev/base64");

  useEffect(() => {
    if (output && settings.autoCopy && output !== "Invalid Base64" && output !== "Encoding failed" && output !== "Invalid Base64 string") {
      copyOutput();
    }
  }, [output, settings.autoCopy]);

  const encode = () => { try { setOutput(btoa(unescape(encodeURIComponent(input)))); } catch { setOutput("Encoding failed"); } };
  const decode = () => { try { setOutput(decodeURIComponent(escape(atob(input)))); } catch { setOutput("Invalid Base64 string"); } };
  const copyOutput = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <ToolWrapper title="Base64 Codec" description="Encode text to Base64 or decode Base64 strings back to plain text." icon={Binary}>
      <div className={styles.workspace}>
        <div className={styles.editorArea}>
          <div className={styles.textPanel}><div className={styles.panelHeader}>Input</div><textarea className={styles.textarea} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type or paste text here..." /></div>
          <div className={styles.textPanel}><div className={styles.panelHeader}><span>Output</span>{output && <button onClick={copyOutput} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)'}}>{copied ? <Check size={16}/> : <Copy size={16}/>}</button>}</div><textarea className={styles.textarea} value={output} readOnly placeholder="Result appears here..." /></div>
        </div>
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><Binary size={20} /><h2>Actions</h2></div>
          <div className={styles.configBody}>
            <button className={styles.actionBtn} onClick={encode}>Encode → Base64</button>
            <button className={styles.actionBtnAlt} onClick={decode}>Decode → Text</button>
            <button className={styles.copyBtn} onClick={copyOutput}>{copied ? "Copied!" : "Copy Output"}</button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


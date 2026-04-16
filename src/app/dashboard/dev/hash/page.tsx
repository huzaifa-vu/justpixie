"use client";
import { useState, useEffect } from "react";
import { Shield, Copy, Check } from "lucide-react";
import Dropdown from "@/components/Dropdown";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../dev.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function HashGenerator() {
  const [input, setInput] = useState("");
  const [algo, setAlgo] = useState("SHA-256");
  const [hashResult, setHashResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [pendingAutoHash, setPendingAutoHash] = useState(false);
  const { settings } = useSettings();

  useAiHydration(({ params, autoExecute }) => {
    if (params.inputText) {
      setInput(params.inputText);
      if (autoExecute) setPendingAutoHash(true);
    }
  }, "/dashboard/dev/hash");

  useEffect(() => {
    if (pendingAutoHash && input) {
      setPendingAutoHash(false);
      generateHash();
    }
  }, [pendingAutoHash, input]);

  const generateHash = async () => {
    if (!input) return;
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest(algo, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    setHashResult(hashHex);
  };

  useEffect(() => {
    if (hashResult && settings.autoCopy) {
      copyHash();
    }
  }, [hashResult, settings.autoCopy]);

  const copyHash = () => { navigator.clipboard.writeText(hashResult); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <ToolWrapper title="Hash Generator" description="Generate cryptographic hashes using the Web Crypto API. Zero server calls." icon={Shield}>
      <div className={styles.workspace}>
        <div className={styles.editorArea}>
          <div className={styles.textPanel}><div className={styles.panelHeader}>Input String</div><textarea className={styles.textarea} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type text to hash..." /></div>
          <div className={styles.textPanel}><div className={styles.panelHeader}><span>Hash Output ({algo})</span>{hashResult && <button onClick={copyHash} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)'}}>{copied ? <Check size={16}/> : <Copy size={16}/>}</button>}</div><div style={{padding:'1.5rem'}}>{hashResult ? <div className={styles.hashOutput}>{hashResult}</div> : <span style={{color:'#94a3b8'}}>Hash will appear here...</span>}</div></div>
        </div>
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><Shield size={20} /><h2>Config</h2></div>
          <div className={styles.configBody}>
            <div className={styles.fieldGroup}><label className={styles.label}>Algorithm</label><Dropdown options={[{ label: "SHA-256", value: "SHA-256" }, { label: "SHA-384", value: "SHA-384" }, { label: "SHA-512", value: "SHA-512" }, { label: "SHA-1", value: "SHA-1" }]} value={algo} onChange={(val) => setAlgo(val)} /></div>
            <button className={styles.actionBtn} onClick={generateHash}>Generate Hash</button>
            <button className={styles.copyBtn} onClick={copyHash}>{copied ? "Copied!" : "Copy Hash"}</button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


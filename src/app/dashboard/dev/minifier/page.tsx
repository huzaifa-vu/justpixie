"use client";

import { useState, useEffect } from "react";
import { FileDigit, Play, Copy, Check, Info } from "lucide-react";
import Dropdown from "@/components/Dropdown";
import ToolWrapper from "@/components/ToolWrapper";
import { useRouter } from "next/navigation";
import styles from "../dev.module.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function CodeMinifier() {
  const router = useRouter();
  const [inputCode, setInputCode] = useState("");
  const [outputCode, setOutputCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<"css" | "json" | "js" | "html">("css");
  const [autoRun, setAutoRun] = useState(false);
  const { settings } = useSettings();

  useAiHydration(({ params, autoExecute }) => {
    if (params.inputText) setInputCode(params.inputText);
    if (params.format) setFormat(params.format as any);
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/dev/minifier");

  useEffect(() => {
    if (autoRun && inputCode.trim() && !outputCode) {
      handleMinify();
      setAutoRun(false);
    }
  }, [autoRun, inputCode]);

  useEffect(() => {
    if (outputCode && settings.autoCopy && !outputCode.startsWith("Error")) {
      handleCopy();
    }
  }, [outputCode, settings.autoCopy]);

  const handleMinify = () => {
    if (!inputCode) return;
    
    let result = inputCode;
    
    try {
      if (format === "json") {
        // Fast JSON minify: Parse and stringify without spaces
        result = JSON.stringify(JSON.parse(inputCode));
      } else if (format === "css") {
        // Simple CSS minify: remove comments, then extra whitespace
        result = result.replace(/\/\*[\s\S]*?\*\//g, '');
        result = result.replace(/\s+/g, ' ');
        result = result.replace(/\s*([\{\}\:\;\,])\s*/g, '$1');
        result = result.replace(/\;\}$/g, '}'); // Remove trailing semicolon
        result = result.trim();
      } else if (format === "html") {
        result = result.replace(/<!--[\s\S]*?-->/g, ''); // Comments
        result = result.replace(/>\s+</g, '><'); // Tags whitespace
        result = result.replace(/\s{2,}/g, ' '); // General whitespace
        result = result.trim();
      } else if (format === "js") {
        // Basic naive JS minification (for pure aggressive compression, real AST minifiers are required, but this suffices for raw scripts)
        result = result.replace(/\/\*[\s\S]*?\*\//g, ''); // multi-line comments
        result = result.replace(/\/\/.*$/gm, ''); // single line
        result = result.replace(/\s+/g, ' ');
        result = result.replace(/\s*([\{\}\(\)\[\]\;\:\,\=\+\-\*\/\!\?\|\&])\s*/g, '$1');
        result = result.trim();
      }
      
      setOutputCode(result);
    } catch (e: any) {
      setOutputCode("Error minifying: " + e.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolWrapper title="Blaze Minifier" description="Instantly strip whitespace and compress code blocks locally." icon={FileDigit}>

      <div className={styles.workspace}>
        <div className={styles.editorArea} style={{ flexDirection: 'column' }}>
          
          <div className={styles.textPanel} style={{ minHeight: '250px' }}>
            <div className={styles.panelHeader}>Original RAW Code</div>
            <textarea
              className={styles.textarea}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Paste your unminified code here..."
            />
          </div>

          <div className={styles.textPanel} style={{ minHeight: '250px' }}>
            <div className={styles.panelHeader} style={{ background: 'var(--deep-charcoal)', color: 'white' }}>
              Minified Output
              {outputCode && (
                <span style={{ fontSize: '0.75rem', color: 'var(--mint-green)' }}>
                  Reduced by {Math.round(((inputCode.length - outputCode.length) / inputCode.length) * 100) || 0}%
                </span>
              )}
            </div>
            <textarea
              className={styles.textarea}
              value={outputCode}
              readOnly
              placeholder="Minified output will appear here..."
              style={{ background: 'var(--deep-charcoal)', color: 'var(--mint-green)' }}
            />
          </div>

        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Info size={20} />
            <h2>Configuration</h2>
          </div>
          <div className={styles.configBody}>

            <div className={styles.fieldGroup}>
              <span className={styles.label}>Code Format</span>
              <Dropdown options={[{ label: "CSS", value: "css" }, { label: "JSON", value: "json" }, { label: "HTML", value: "html" }, { label: "JavaScript (Naive)", value: "js" }]} value={format} onChange={(val) => setFormat(val)} />
            </div>

            <button className={styles.actionBtn} onClick={handleMinify} disabled={!inputCode.trim()} style={{ marginTop: '1rem' }}>
              <Play size={18} /> Minify Code
            </button>
            <button className={styles.copyBtn} onClick={handleCopy} disabled={!outputCode}>
              {copied ? <><Check size={18} /> Copied</> : <><Copy size={18} /> Copy Result</>}
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


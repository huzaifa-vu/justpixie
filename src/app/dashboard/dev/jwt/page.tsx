"use client";

import { useState, useEffect, useCallback } from "react";
import { Shield, ShieldCheck, ShieldAlert, Key, Copy, Check, Info } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../dev.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

/**
 * Custom Syntax Highlighter for JSON
 * Wraps keys and values in spans with CSS-variable colors
 */
function CodeBlock({ code }: { code: string }) {
  if (!code || code.includes("Invalid")) return <div style={{ color: "var(--text-muted)" }}>{code}</div>;

  const highlighted = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = "value-num";
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "key";
          } else {
            cls = "string";
          }
        } else if (/true|false/.test(match)) {
          cls = "bool";
        } else if (/null/.test(match)) {
          cls = "null";
        }
        
        const colors: Record<string, string> = {
          key: "#8b5cf6",    // Deeper Violet
          string: "#059669", // Darker Emerald/Mint
          "value-num": "#db2777", // Deeper Pink
          bool: "#d97706",   // Deeper Amber
          null: "#64748b"    // Slate
        };
        
        return `<span style="color: ${colors[cls]}">${match}</span>`;
      }
    );

  return (
    <pre 
      style={{ 
        margin: 0, 
        fontFamily: "'JetBrains Mono', monospace", 
        fontSize: "0.875rem", 
        lineHeight: "1.6", 
        whiteSpace: "pre-wrap", 
        wordBreak: "break-all",
        color: "var(--foreground)"
      }}
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

export default function JWTTool() {
  const [token, setToken] = useState("");
  const [key, setKey] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"none" | "valid" | "invalid" | "error">("none");
  const { settings } = useSettings();

  const [header, setHeader] = useState("");
  const [payload, setPayload] = useState("");
  const [signature, setSignature] = useState("");

  const decodeBase64Url = (str: string) => {
    try {
      let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) base64 += "=";
      const json = atob(base64).split("").map(c => 
        "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
      ).join("");
      return JSON.stringify(JSON.parse(decodeURIComponent(json)), null, 2);
    } catch {
      return "Invalid Segment";
    }
  };

  const handleTokenChange = useCallback((val: string) => {
    setToken(val);
    const parts = val.trim().split(".");
    if (parts.length === 3) {
      setHeader(decodeBase64Url(parts[0]));
      setPayload(decodeBase64Url(parts[1]));
      setSignature(parts[2]);
    } else {
      setHeader("");
      setPayload("");
      setSignature("");
    }
    setVerificationStatus("none");
  }, []);

  useAiHydration(({ params }) => {
    if (params.inputText) handleTokenChange(params.inputText);
  }, "/dashboard/dev/jwt");

  useEffect(() => {
    if (payload && !payload.includes("Invalid") && settings.autoCopy) {
      copy(payload, 'payload');
    }
  }, [payload, settings.autoCopy]);

  const verifyHS256 = async (tokenStr: string, secret: string) => {
    try {
      const parts = tokenStr.split(".");
      if (parts.length !== 3) return false;

      const encoder = new TextEncoder();
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      );

      const data = encoder.encode(parts[0] + "." + parts[1]);
      let sigBase64 = parts[2].replace(/-/g, "+").replace(/_/g, "/");
      while (sigBase64.length % 4) sigBase64 += "=";
      const sigData = Uint8Array.from(atob(sigBase64), c => c.charCodeAt(0));

      return await crypto.subtle.verify("HMAC", cryptoKey, sigData, data);
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  useEffect(() => {
    const runVerify = async () => {
      if (!token || !key) {
        setVerificationStatus("none");
        return;
      }

      try {
        const headerObj = JSON.parse(header);
        if (headerObj.alg === "HS256") {
          const isValid = await verifyHS256(token, key);
          setVerificationStatus(isValid ? "valid" : "invalid");
        } else {
          setVerificationStatus("error"); // Unsupported for now
        }
      } catch {
        setVerificationStatus("error");
      }
    };
    runVerify();
  }, [token, key, header]);

  const copy = (val: string, id: string) => {
    navigator.clipboard.writeText(val);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <ToolWrapper title="JWT Decoder & Verifier" description="Inspect and verify JSON Web Tokens (JWT) safely in your browser." icon={Shield}>
      <div className={styles.workspace}>
        <div className={styles.editorArea}>
          <div className={styles.textPanel}>
            <div className={styles.panelHeader}>JWT Token</div>
            <textarea 
              className={styles.textarea} 
              value={token} 
              onChange={(e) => handleTokenChange(e.target.value)} 
              placeholder="Paste your JWT here (header.payload.signature)..."
              style={{ minHeight: "120px", flex: "none" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", flex: 1 }}>
            <div className={styles.textPanel}>
              <div className={styles.panelHeader}>
                Header
                {header && !header.includes("Invalid") && (
                  <button onClick={() => copy(header, 'header')}>
                    {copied === 'header' ? <Check size={14}/> : <Copy size={14}/>}
                  </button>
                )}
              </div>
              <div style={{ padding: "1.5rem", overflowY: "auto" }}>
                <CodeBlock code={header} />
              </div>
            </div>

            <div className={styles.textPanel}>
              <div className={styles.panelHeader}>
                Payload
                {payload && !payload.includes("Invalid") && (
                  <button onClick={() => copy(payload, 'payload')}>
                    {copied === 'payload' ? <Check size={14}/> : <Copy size={14}/>}
                  </button>
                )}
              </div>
              <div style={{ padding: "1.5rem", overflowY: "auto" }}>
                <CodeBlock code={payload} />
              </div>
            </div>
          </div>
          
          <div className={styles.textPanel} style={{ flex: "none", minHeight: "auto" }}>
            <div className={styles.panelHeader}>Signature</div>
            <div style={{ 
              padding: "1rem 1.5rem", 
              fontSize: "0.75rem", 
              fontFamily: "monospace", 
              color: signature ? "var(--text-muted)" : "rgba(0,0,0,0.2)",
              wordBreak: "break-all"
            }}>
              {signature || "No signature detected"}
            </div>
          </div>
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><Key size={20} /><h2>Verification</h2></div>
          <div className={styles.configBody}>
            
            <div className={styles.fieldGroup}>
              <label className={styles.label}>HS256 Secret Key</label>
              <textarea 
                className={styles.textInput} 
                value={key} 
                onChange={(e) => setKey(e.target.value)} 
                placeholder="Enter HS256 secret..."
                style={{ height: "100px", resize: "none", padding: "1rem" }}
              />
            </div>

            <div style={{ marginTop: "1rem" }}>
              {verificationStatus === "none" && (
                <div className={styles.infoBox}>
                  <Info size={16} /> Enter a secret key to verify HS256 tokens.
                </div>
              )}
              {verificationStatus === "valid" && (
                <div className={styles.statusGood} style={{ padding: "1.5rem", flexDirection: "column", gap: "0.5rem" }}>
                  <ShieldCheck size={32} />
                  <strong>Signature Verified</strong>
                </div>
              )}
              {verificationStatus === "invalid" && (
                <div className={styles.statusBad} style={{ padding: "1.5rem", flexDirection: "column", gap: "0.5rem" }}>
                  <ShieldAlert size={32} />
                  <strong>Invalid Signature</strong>
                </div>
              )}
              {verificationStatus === "error" && (
                <div className={styles.statusBad} style={{ padding: "1.5rem" }}>
                  Unsupported algorithm or malformed key.
                </div>
              )}
            </div>

            <div style={{ flex: 1 }} />
            
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", lineHeight: "1.4" }}>
              Processing is done entirely on your machine. Pixie never sees your tokens or keys.
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        button { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: background 0.2s; }
        button:hover { background: rgba(0,0,0,0.05); color: var(--foreground); }
      `}</style>
    </ToolWrapper>
  );
}

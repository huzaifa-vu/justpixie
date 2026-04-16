"use client";

import { useState, useEffect, useRef } from "react";
import { QrCode, Wand2, Download, Copy, Check, Pipette, AlertCircle } from "lucide-react";
import Dropdown from "@/components/Dropdown";
import ToolWrapper from "@/components/ToolWrapper";
import QRCode from "qrcode";
import styles from "../dev.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function QrGenerator() {
  const [text, setText] = useState("https://github.com");
  const [errorCorrection, setErrorCorrection] = useState<"L" | "M" | "Q" | "H">("M");
  const [lightColor, setLightColor] = useState("#ffffff");
  const [darkColor, setDarkColor] = useState("#000000");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const { settings } = useSettings();

  useAiHydration(({ params, autoExecute }) => {
    if (params.inputText) setText(params.inputText);
    if (autoExecute) setLastGeneratedAt(Date.now());
  }, "/dashboard/dev/qr");

  useEffect(() => {
    if (!canvasRef.current || !text.trim()) {
      setQrError(null);
      return;
    }
    
    setQrError(null);
    try {
      QRCode.toCanvas(canvasRef.current, text, {
        margin: 2,
        width: 300,
        errorCorrectionLevel: errorCorrection,
        color: {
          dark: darkColor,
          light: lightColor
        }
      }, function (error) {
        if (error) {
          if (error.message.includes("too big")) {
            setQrError("The amount of data is too big for a standard QR Code. Try shortening your text or lowering the Error Correction level.");
          } else {
            console.error(error);
            setQrError("Failed to generate QR Code. Please check your settings.");
          }
        }
      });
    } catch (error: any) {
      if (error.message.includes("too big")) {
        setQrError("The amount of data is too big for a standard QR Code. Try shortening your text or lowering the Error Correction level.");
      } else {
        console.error(error);
        setQrError("Critical Error: Failed to initialize QR engine.");
      }
    }
  }, [text, errorCorrection, lightColor, darkColor]);

  useEffect(() => {
    if (text.trim() && canvasRef.current && lastGeneratedAt) {
        const timer = setTimeout(() => {
            if (settings.autoDownload) handleDownload();
            if (settings.autoCopy) handleCopy();
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [lastGeneratedAt, settings.autoDownload, settings.autoCopy]);

  const handleDownload = () => {
    if (!canvasRef.current || !text.trim()) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qrcode-${Date.now()}.png`;
    a.click();
  };

  const handleCopy = () => {
    if (!canvasRef.current || !text.trim()) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }
    });
  };

  return (
    <ToolWrapper title="QR Code Generator" description="Instantly generate standard scannable QR codes for links, text, and data." icon={QrCode}>

      <div className={styles.workspace}>
        <div className={styles.editorArea}>
          <div className={styles.textPanel} style={{ flex: 0, height: '150px' }}>
            <div className={styles.panelHeader}>QR Content (URL or Text)</div>
            <textarea
              className={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter URL or text to encode..."
              style={{ overflow: 'hidden' }}
            />
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-card)', borderRadius: 'var(--radius-bento)', border: '1px solid var(--border)', padding: '2rem' }}>
             {!text.trim() ? (
                <div style={{ color: 'var(--text-muted)' }}>Provide text to generate QR code</div>
             ) : qrError ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', maxWidth: '300px' }}>
                   <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertCircle size={32} />
                   </div>
                   <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ef4444' }}>Data Too Large</h3>
                   <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>{qrError}</p>
                </div>
             ) : (
                <canvas ref={canvasRef} style={{ borderRadius: 'var(--radius-inner)' }}></canvas>
             )}
          </div>
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Wand2 size={20} />
            <h2>Generator Settings</h2>
          </div>
          <div className={styles.configBody}>

            <div className={styles.fieldGroup}>
              <span className={styles.label}>Error Correction</span>
              <Dropdown options={[{ label: "Low (7%) - Best for URLs", value: "L" }, { label: "Medium (15%)", value: "M" }, { label: "Quartile (25%)", value: "Q" }, { label: "High (30%) - Industrial use", value: "H" }]} value={errorCorrection} onChange={(val) => setErrorCorrection(val)} />
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.label}>QR Foreground Color</span>
              <div style={{ position: 'relative', width: '46px', height: '46px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0, backgroundColor: darkColor }}>
                <input 
                  type="color" 
                  value={darkColor} 
                  onChange={(e) => setDarkColor(e.target.value)} 
                  style={{ position: 'absolute', top: '-10px', left: '-10px', width: '100px', height: '100px', cursor: 'pointer', border: 'none', opacity: 0 }} 
                />
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Pipette size={20} color={darkColor.toLowerCase() === '#ffffff' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)'} />
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.label}>QR Background Color</span>
              <div style={{ position: 'relative', width: '46px', height: '46px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0, backgroundColor: lightColor }}>
                <input 
                  type="color" 
                  value={lightColor} 
                  onChange={(e) => setLightColor(e.target.value)} 
                  style={{ position: 'absolute', top: '-10px', left: '-10px', width: '100px', height: '100px', cursor: 'pointer', border: 'none', opacity: 0 }} 
                />
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Pipette size={20} color={lightColor.toLowerCase() === '#ffffff' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)'} />
                </div>
              </div>
            </div>

            <button className={styles.actionBtn} onClick={() => setLastGeneratedAt(Date.now())} disabled={!text.trim() || !!qrError} style={{ marginTop: '1rem' }}>
              <Wand2 size={18} /> Cast Magic QR
            </button>
            <button className={styles.actionBtnAlt} onClick={handleDownload} disabled={!text.trim() || !!qrError}>
              <Download size={18} /> Download PNG
            </button>
            <button className={styles.copyBtn} onClick={handleCopy} disabled={!text.trim() || !!qrError}>
              {copied ? <><Check size={18} /> Copied Image!</> : <><Copy size={18} /> Copy Image to Clipboard</>}
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


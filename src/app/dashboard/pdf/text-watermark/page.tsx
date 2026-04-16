"use client";

import { useEffect, useState, useRef } from "react";
import { PenTool, Download, UploadCloud, ShieldAlert } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { useRouter } from "next/navigation";
import styles from "../pdf.module.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";
export default function PdfWatermark() {
  const router = useRouter();
    const [autoRun, setAutoRun] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { settings } = useSettings();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcess = async () => {
    if (!file || !watermarkText) return;
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      for (const page of pages) {
        const { width, height } = page.getSize();
        page.drawText(watermarkText, {
          x: width / 2 - (watermarkText.length * 15),
          y: height / 2 - 20,
          size: 60,
          color: rgb(0.8, 0.2, 0.2), // Faded redish
          opacity: 0.3,
          rotate: degrees(45),
        });
      }
      
      const pdfBytes = await pdfDoc.save();
      // @ts-ignore - pdf-lib Uint8Array is runtime-compatible with BlobPart
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
    } catch (err) {
      console.error(err);
      alert("Failed to inject watermark.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!outputUrl) return;
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = `watermarked-${file?.name || 'document.pdf'}`;
    a.click();
  };
  useAiHydration(({ files, params, autoExecute }) => {
    if (files && files.length > 0) {
      setFile(files[0]);
      setOutputUrl(null);
    }
    if (params?.watermarkText) setWatermarkText(String(params.watermarkText));
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/pdf/text-watermark");

  useEffect(() => {
    if (outputUrl && settings.autoDownload && !isProcessing) {
      const timer = setTimeout(() => {
        const link = document.createElement("a");
        link.href = outputUrl;
        link.download = `pixie-${Date.now()}.pdf`;
        link.click();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [outputUrl, settings.autoDownload, isProcessing]);

  useEffect(() => {
    if (autoRun && file && watermarkText && !isProcessing) {
      handleProcess();
      setAutoRun(false);
    }
  }, [autoRun, file, watermarkText, isProcessing]);


  return (
    <ToolWrapper title="Add Text Watermark" description="Overlay a giant translucent diagonal watermark label on all PDF pages." icon={PenTool}>

        <div className={styles.workspace}>
          <DropZone 
            onFilesSelected={(files) => {
              if (files.length > 0) {
                setFile(files[0]);
                setOutputUrl(null);
              }
            }} 
            accept="application/pdf"
            title={outputUrl ? "Watermark Applied!" : (file ? file.name : "Drop PDF Here")}
            subtitle={outputUrl ? "" : (file ? "Ready to apply watermark" : "or click to browse")}
          >
            {outputUrl && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '1rem', color: 'var(--mint-green)' }}><ShieldAlert size={48} /></div>
                <button 
                   onClick={(e) => { e.stopPropagation(); setFile(null); setOutputUrl(null); }}
                   style={{ marginTop: '1rem', background: 'transparent', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', color: 'var(--foreground)', cursor: 'pointer' }}
                >
                  Upload another file
                </button>
              </div>
            )}
            {!outputUrl && file && (
               <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '1rem', color: 'var(--pixie-teal)' }}><PenTool size={48} /></div>
                <h2>{file.name}</h2>
               </div>
            )}
          </DropZone>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
             <h2>Watermark Text</h2>
          </div>
          <div className={styles.configBody}>
            <div className={styles.fieldGroup}>
              <span className={styles.label}>Text Content</span>
              <input 
                type="text" 
                value={watermarkText} 
                onChange={(e) => { setWatermarkText(e.target.value.toUpperCase()); setOutputUrl(null); }} 
                placeholder="CONFIDENTIAL"
                className={styles.textInput} 
              />
            </div>
            
            {!outputUrl ? (
              <button className={styles.actionBtn} onClick={handleProcess} disabled={!file || !watermarkText || isProcessing} style={{ marginTop: '1rem' }}>
                <PenTool size={18} /> {isProcessing ? "Processing..." : "Apply Watermark"}
              </button>
            ) : (
              <button className={styles.actionBtnAlt} onClick={handleDownload} style={{ marginTop: '1rem' }}>
                <Download size={18} /> Download Protected PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}



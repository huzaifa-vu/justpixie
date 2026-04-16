"use client";

import { useEffect, useState, useRef } from "react";
import { FileDigit, Download, UploadCloud, Check } from "lucide-react";
import Dropdown from "@/components/Dropdown";
import ToolWrapper from "@/components/ToolWrapper";
import { useRouter } from "next/navigation";
import styles from "../pdf.module.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";
export default function PdfPageNumbers() {
  const router = useRouter();
    const [autoRun, setAutoRun] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { settings } = useSettings();
  
  const [startNum, setStartNum] = useState(1);
  const [position, setPosition] = useState("bottom-right");
  const [textSize, setTextSize] = useState("medium");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setOutputUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
      e.target.value = ""; // Clear to allow re-selection
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      let currNum = startNum;
      for (const page of pages) {
        const { width, height } = page.getSize();
        
        let x = width - 50;
        let y = 30;
        
        if (position === 'bottom-center') {
          x = width / 2 - 10;
        } else if (position === 'bottom-left') {
          x = 30;
        } else if (position === 'top-right') {
          y = height - 30;
        }

        const sizeMap = { small: 10, medium: 14, large: 20 };
        const finalSize = sizeMap[textSize as keyof typeof sizeMap] || 14;

        page.drawText(`${currNum}`, {
          x,
          y,
          size: finalSize,
          color: rgb(0, 0, 0),
        });
        currNum++;
      }
      
      const pdfBytes = await pdfDoc.save();
      // @ts-ignore - pdf-lib Uint8Array is runtime-compatible with BlobPart
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
    } catch (err) {
      console.error(err);
      alert("Failed to inject page numbers.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!outputUrl) return;
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = `numbered-${file?.name || 'document.pdf'}`;
    a.click();
  };
  useAiHydration(({ files, params, autoExecute }) => {
    if (files && files.length > 0) {
      setFile(files[0]);
      setOutputUrl(null);
    }
    if (params?.startNum) setStartNum(Number(params.startNum));
    if (params?.position) setPosition(params.position);
    if (params?.textSize) setTextSize(params.textSize);
    
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/pdf/page-numbers");

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
    if (autoRun && file && !isProcessing) {
      handleProcess();
      setAutoRun(false);
    }
  }, [autoRun, file, isProcessing]);


  return (
    <ToolWrapper title="Add Page Numbers" description="Inject serialized page numbers universally across a document." icon={FileDigit}>

        <div className={styles.workspace}>
          <DropZone 
            onFilesSelected={handleFiles} 
            accept="application/pdf"
            title={outputUrl ? "Numbers Injected!" : (file ? file.name : "Drop PDF")}
            subtitle={outputUrl ? "" : (file ? "Ready to inject" : "or click to browse")}
            previewUrl={outputUrl ? undefined : (file ? undefined : undefined)}
          >
            {outputUrl && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '1rem', color: 'var(--mint-green)' }}><Check size={48} /></div>
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
                <div style={{ marginBottom: '1rem', color: 'var(--pixie-teal)' }}><FileDigit size={48} /></div>
                <h2>{file.name}</h2>
               </div>
            )}
          </DropZone>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
             <h2>Numbering Settings</h2>
          </div>
          <div className={styles.configBody}>
            <div className={styles.fieldGroup}>
              <span className={styles.label}>Start Number From</span>
              <input type="number" min="1" value={startNum} onChange={(e) => { setStartNum(Number(e.target.value)); setOutputUrl(null); }} className={styles.textInput} />
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.label}>Position</span>
              <Dropdown options={[{ label: "Bottom Right", value: "bottom-right" }, { label: "Bottom Center", value: "bottom-center" }, { label: "Bottom Left", value: "bottom-left" }, { label: "Top Right", value: "top-right" }]} value={position} onChange={(val) => { setPosition(val); setOutputUrl(null); }} />
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.label}>Text Size</span>
              <Dropdown options={[
                { label: "Small (10pt)", value: "small" },
                { label: "Medium (14pt)", value: "medium" },
                { label: "Large (20pt)", value: "large" }
              ]} value={textSize} onChange={(val) => { setTextSize(val); setOutputUrl(null); }} />
            </div>
            
            {!outputUrl ? (
              <button className={styles.actionBtn} onClick={handleProcess} disabled={!file || isProcessing} style={{ marginTop: '1rem' }}>
                <Check size={18} /> {isProcessing ? "Processing..." : "Inject Numbers"}
              </button>
            ) : (
              <button className={styles.actionBtnAlt} onClick={handleDownload} style={{ marginTop: '1rem' }}>
                <Download size={18} /> Download PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}



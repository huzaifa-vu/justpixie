"use client";

import { useEffect, useState, useRef } from "react";
import { RotateCcw, Download, UploadCloud, RefreshCw } from "lucide-react";
import Dropdown from "@/components/Dropdown";
import ToolWrapper from "@/components/ToolWrapper";
import { useRouter } from "next/navigation";
import styles from "../pdf.module.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";
export default function PdfRotate() {
  const router = useRouter();
    const [autoRun, setAutoRun] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState(90);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { settings } = useSettings();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      for (const page of pages) {
        // Get current rotation and add new angle
        const currentRot = page.getRotation().angle;
        const newRot = (currentRot + angle) % 360;
        page.setRotation(degrees(newRot));
      }
      
      const pdfBytes = await pdfDoc.save();
      // @ts-ignore - pdf-lib Uint8Array is runtime-compatible with BlobPart
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
    } catch (err) {
      console.error(err);
      alert("Failed to rotate PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!outputUrl) return;
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = `rotated-${file?.name || 'document.pdf'}`;
    a.click();
  };
  useAiHydration(({ files, params, autoExecute }) => {
    if (files && files.length > 0) {
      setFile(files[0]);
      setAngle(Number(params?.angle) || 90);
      setOutputUrl(null);
    }
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/pdf/rotate");

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
    <ToolWrapper title="Rotate PDF" description="Rotate all pages in a PDF document simultaneously." icon={RotateCcw}>

        <div className={styles.workspace}>
          <DropZone 
            onFilesSelected={(files) => {
              if (files.length > 0) {
                setFile(files[0]);
                setOutputUrl(null);
              }
            }} 
            accept="application/pdf"
            title={outputUrl ? "Rotation Applied!" : (file ? file.name : "Drop PDF to rotate")}
            subtitle={outputUrl ? "Your PDF is ready for download." : (file ? "Ready to rotate" : "or click to browse local files")}
          >
            {outputUrl && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '1rem', color: 'var(--mint-green)' }}><RotateCcw size={48} /></div>
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
                <div style={{ marginBottom: '1rem', color: 'var(--pixie-teal)' }}><RotateCcw size={48} /></div>
                <h2>{file.name}</h2>
               </div>
            )}
          </DropZone>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
             <h2>Rotation Config</h2>
          </div>
          <div className={styles.configBody}>
            <div className={styles.fieldGroup}>
              <span className={styles.label}>Rotation Angle</span>
              <Dropdown options={[{ label: "Clockwise (90°)", value: 90 }, { label: "Upside Down (180°)", value: 180 }, { label: "Counter-Clockwise (270°)", value: 270 }]} value={angle} onChange={(val) => { setAngle(Number(val)); setOutputUrl(null); }} />
            </div>
            
            {!outputUrl ? (
              <button className={styles.actionBtn} onClick={handleProcess} disabled={!file || isProcessing} style={{ marginTop: '1rem' }}>
                <RefreshCw size={18} /> {isProcessing ? "Processing..." : "Apply Rotation"}
              </button>
            ) : (
              <button className={styles.actionBtnAlt} onClick={handleDownload} style={{ marginTop: '1rem' }}>
                <Download size={18} /> Download Result
              </button>
            )}
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}



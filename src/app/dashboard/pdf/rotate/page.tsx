"use client";
import { useEffect, useState } from "react";
import { RotateCcw, Download, RefreshCw, Trash2, CheckCircle, Info, RotateCw } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../pdf-pro.module.css";
import { PDFDocument, degrees } from "pdf-lib";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";

export default function PdfRotate() {
  const [file, setFile] = useState<File | null>(null);
  const [visualRotation, setVisualRotation] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const { settings } = useSettings();
  const [autoRun, setAutoRun] = useState(false);

  const handleFiles = async (files: File[]) => {
    if (files.length > 0) {
      const f = files[0];
      setFile(f);
      setOutputUrl(null);
      setVisualRotation(0);
      setStatus("");
      
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
      setThumbnailUrl(null);

      try {
        const buf = await f.arrayBuffer();
        const { GlobalWorkerOptions, getDocument } = await import("pdfjs-dist");
        GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        
        const loadingTask = getDocument(buf);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          canvas.toBlob((blob) => {
            if (blob) setThumbnailUrl(URL.createObjectURL(blob));
          }, "image/jpeg", 0.7);
        }
      } catch (err) { console.error(err); }
    }
  };

  const rotate = (dir: 'left' | 'right') => {
    setVisualRotation(prev => (prev + (dir === 'right' ? 90 : -90)));
    setOutputUrl(null);
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setStatus("Restructuring document metadata...");
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      // Calculate effective rotation (0-360)
      const effectiveAngle = ((visualRotation % 360) + 360) % 360;

      setStatus(`Applying ${effectiveAngle}° rotation to ${pages.length} pages...`);
      for (const page of pages) {
        const currentRot = page.getRotation().angle;
        const newRot = (currentRot + effectiveAngle) % 360;
        page.setRotation(degrees(newRot));
      }
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      setStatus("Done!");

      if (settings.autoDownload) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `rotated-${file.name}`;
        a.click();
      }
    } catch (err) {
      console.error(err);
      setStatus("Processing failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    setFile(null);
    setOutputUrl(null);
    setThumbnailUrl(null);
    setVisualRotation(0);
    setStatus("");
  };

  useAiHydration(({ files, params, autoExecute }) => {
    if (files && files.length > 0) {
      handleFiles([files[0]]);
      if (params?.angle) setVisualRotation(Number(params.angle));
    }
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/pdf/rotate");

  useEffect(() => {
    if (autoRun && file && !isProcessing) {
      handleProcess();
      setAutoRun(false);
    }
  }, [autoRun, file, isProcessing]);

  return (
    <ToolWrapper title="Rotate PDF" description="Interactive visual rotation for all pages in a PDF document." icon={RotateCcw}>
      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {file ? (
            <>
              <div className={styles.canvasToolbar}>
                <button className={styles.canvasBtn} onClick={() => rotate('left')} title="Rotate Left">
                    <RotateCcw size={20} />
                </button>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }}></div>
                <button className={styles.canvasBtn} onClick={() => rotate('right')} title="Rotate Right">
                    <RotateCw size={20} />
                </button>
              </div>

              <div className={styles.thumbnailContainer}>
                <div className={styles.previewWrapper} style={{ transform: `rotate(${visualRotation}deg)` }}>
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} className={styles.thumbnail} alt="PDF Preview" />
                  ) : (
                    <div className={styles.thumbnail} style={{ width: 300, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222' }}>
                        <RefreshCw size={40} className={styles.spin} style={{ color: '#444' }} />
                    </div>
                  )}
                </div>
                <div className={styles.thumbnailBadge}>{file.name} ({visualRotation}°)</div>
              </div>
            </>
          ) : (
            <DropZone 
              onFilesSelected={handleFiles} 
              accept="application/pdf"
              title="Select PDF"
              subtitle="Use the canvas buttons for live visual rotation"
            />
          )}
        </div>
        
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><RotateCcw size={20} /><h2>Rotation Manager</h2></div>
          <div className={styles.configBody}>
            <div className={styles.infoBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--foreground)', fontWeight: 700 }}>
                 <Info size={14} />
                 <span>Studio Mode</span>
              </div>
              Use the **floating controls** on the document preview to rotate. The degree indicator helps track cumulative changes.
            </div>

            {isProcessing && (
               <div className={styles.statusCard}>
                  <RefreshCw size={18} className={styles.spin} style={{ color: 'var(--mint-green)' }} />
                  <div className={styles.statusInfo}>
                     <div className={styles.statusTitle}>Current State</div>
                     <div className={styles.statusText}>{status}</div>
                  </div>
               </div>
            )}

            {outputUrl && (
               <div className={styles.statusCard}>
                  <CheckCircle size={18} style={{ color: 'var(--mint-green)' }} />
                  <div className={styles.statusInfo}>
                     <div className={styles.statusTitle}>Export Ready</div>
                     <div className={styles.statusText}>Rotation Applied</div>
                  </div>
               </div>
            )}
            
            {!outputUrl ? (
              <button className={styles.executeBtn} onClick={handleProcess} disabled={!file || isProcessing}>
                {isProcessing ? <><RefreshCw size={18} className={styles.spin} /> Processing...</> : <><Download size={18} /> Download Rotated PDF</>}
              </button>
            ) : (
              <a 
                href={outputUrl} 
                download={`rotated-${file?.name || 'document.pdf'}`}
                className={styles.downloadBtnLarge}
              >
                <Download size={20} /> Download PDF
              </a>
            )}

            <button className={styles.resetBtn} onClick={resetAll}>
               <Trash2 size={16} /> Discard & Reset
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

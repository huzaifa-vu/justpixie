"use client";
import { useEffect, useState } from "react";
import { PenTool, Download, RefreshCw, Trash2, Info, ShieldAlert } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../pdf-pro.module.css";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";

export default function PdfWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
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
          await page.render({ canvasContext: ctx, viewport }).promise;
          canvas.toBlob((blob) => {
            if (blob) setThumbnailUrl(URL.createObjectURL(blob));
          }, "image/jpeg", 0.7);
        }
      } catch (err) { console.error(err); }
    }
  };

  const handleProcess = async () => {
    if (!file || !watermarkText) return;
    setIsProcessing(true);
    setStatus("Preparing canvas...");
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      for (let i = 0; i < pages.length; i++) {
        setStatus(`Watermarking page ${i + 1} of ${pages.length}...`);
        const page = pages[i];
        const { width, height } = page.getSize();
        page.drawText(watermarkText, {
          x: width / 2 - (watermarkText.length * 15),
          y: height / 2 - 20,
          size: 60,
          color: rgb(0.8, 0.2, 0.2),
          opacity: 0.3,
          rotate: degrees(45),
        });
      }
      
      setStatus("Finalizing protect mode...");
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      setStatus("Done!");

      if (settings.autoDownload) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `watermarked-${file.name}`;
        a.click();
      }
    } catch (err) {
      console.error(err);
      setStatus("Failed to process.");
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
    setStatus("");
  };

  useAiHydration(({ files, params, autoExecute }) => {
    if (files && files.length > 0) handleFiles([files[0]]);
    if (params?.watermarkText) setWatermarkText(String(params.watermarkText));
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/pdf/text-watermark");

  useEffect(() => {
    if (autoRun && file && watermarkText && !isProcessing) {
      handleProcess();
      setAutoRun(false);
    }
  }, [autoRun, file, watermarkText, isProcessing]);

  return (
    <ToolWrapper title="Add Text Watermark" description="Overlay a giant translucent diagonal watermark label on all PDF pages." icon={PenTool}>
      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {file ? (
            <div className={styles.thumbnailContainer}>
               {thumbnailUrl ? (
                 <img src={thumbnailUrl} className={styles.thumbnail} alt="PDF Preview" />
               ) : (
                 <div className={styles.thumbnail} style={{ width: 300, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222' }}>
                    <RefreshCw size={40} className={styles.spin} style={{ color: '#444' }} />
                 </div>
               )}
               <div className={styles.thumbnailBadge}>{file.name}</div>
            </div>
          ) : (
            <DropZone 
              onFilesSelected={handleFiles} 
              accept="application/pdf"
              title="Select PDF"
              subtitle="Translucent watermark will be applied diagonally"
            />
          )}
        </div>
        
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><PenTool size={20} /><h2>Watermark Manager</h2></div>
          <div className={styles.configBody}>
            <div className={styles.infoBox}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--foreground)', fontWeight: 700 }}>
                 <Info size={14} />
                 <span>Instruction</span>
              </div>
              Enter the label you want to stamp. It will appear globally as a giant translucent overlay in the center of every page.
            </div>

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
                  <ShieldAlert size={18} style={{ color: 'var(--mint-green)' }} />
                  <div className={styles.statusInfo}>
                     <div className={styles.statusTitle}>Export Ready</div>
                     <div className={styles.statusText}>Watermark Applied</div>
                  </div>
               </div>
            )}
            
            {!outputUrl ? (
              <button className={styles.executeBtn} onClick={handleProcess} disabled={!file || !watermarkText || isProcessing}>
                {isProcessing ? <><RefreshCw size={18} className={styles.spin} /> Processing...</> : <><PenTool size={18} /> Apply Watermark</>}
              </button>
            ) : (
              <a 
                href={outputUrl} 
                download={`watermarked-${file.name}`}
                className={styles.downloadBtnLarge}
              >
                <Download size={20} /> Download Protected PDF
              </a>
            )}

            <button className={styles.resetBtn} onClick={resetAll}>
               <Trash2 size={16} /> Clear Selection
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

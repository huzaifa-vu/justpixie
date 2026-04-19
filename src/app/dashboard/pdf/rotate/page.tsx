"use client";
import { useEffect, useState } from "react";
import { RotateCcw, Download, RefreshCw, Trash2, CheckCircle, Info } from "lucide-react";
import Dropdown from "@/components/Dropdown";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../pdf-pro.module.css";
import { PDFDocument, degrees } from "pdf-lib";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";

export default function PdfRotate() {
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState(90);
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
    if (!file) return;
    setIsProcessing(true);
    setStatus("Restructuring document metadata...");
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      setStatus(`Rotating ${pages.length} pages...`);
      for (const page of pages) {
        const currentRot = page.getRotation().angle;
        const newRot = (currentRot + angle) % 360;
        page.setRotation(degrees(newRot));
      }
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
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
    setStatus("");
  };

  useAiHydration(({ files, params, autoExecute }) => {
    if (files && files.length > 0) {
      handleFiles([files[0]]);
      if (params?.angle) setAngle(Number(params.angle));
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
    <ToolWrapper title="Rotate PDF" description="Rotate all pages in a PDF document simultaneously." icon={RotateCcw}>
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
              subtitle="The document will be proofed before rotation"
            />
          )}
        </div>
        
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><RotateCcw size={20} /><h2>Rotation Manager</h2></div>
          <div className={styles.configBody}>
            <div className={styles.infoBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--foreground)', fontWeight: 700 }}>
                 <Info size={14} />
                 <span>Instruction</span>
              </div>
              Choose a rotation angle. Every page in the PDF will be rotated by this amount from its current orientation.
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.label}>Rotation Angle</span>
              <Dropdown 
                options={[
                  { label: "Clockwise (90°)", value: 90 }, 
                  { label: "Upside Down (180°)", value: 180 }, 
                  { label: "Counter-Clockwise (270°)", value: 270 }
                ]} 
                value={angle} 
                onChange={(val) => { setAngle(Number(val)); setOutputUrl(null); }} 
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
                  <CheckCircle size={18} style={{ color: 'var(--mint-green)' }} />
                  <div className={styles.statusInfo}>
                     <div className={styles.statusTitle}>Export Ready</div>
                     <div className={styles.statusText}>Rotation Applied</div>
                  </div>
               </div>
            )}
            
            {!outputUrl ? (
              <button className={styles.executeBtn} onClick={handleProcess} disabled={!file || isProcessing}>
                {isProcessing ? <><RefreshCw size={18} className={styles.spin} /> Processing...</> : <><RotateCcw size={18} /> Apply Rotation</>}
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
               <Trash2 size={16} /> Clear Selection
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

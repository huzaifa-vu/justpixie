"use client";
import { useEffect, useState } from "react";
import { FileDigit, Download, RefreshCw, Trash2, CheckCircle, Info } from "lucide-react";
import Dropdown from "@/components/Dropdown";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../pdf-pro.module.css";
import { PDFDocument, rgb } from "pdf-lib";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";

export default function PdfPageNumbers() {
  const [file, setFile] = useState<File | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const { settings } = useSettings();
  const [autoRun, setAutoRun] = useState(false);
  
  const [startNum, setStartNum] = useState(1);
  const [position, setPosition] = useState("bottom-right");
  const [textSize, setTextSize] = useState("medium");

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
    setStatus("Analyzing layout...");
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      let currNum = startNum;
      for (let i = 0; i < pages.length; i++) {
        setStatus(`Stamping page ${i + 1} of ${pages.length}...`);
        const page = pages[i];
        const { width, height } = page.getSize();
        
        let x = width - 50;
        let y = 30;
        
        if (position === 'bottom-center') x = width / 2 - 10;
        else if (position === 'bottom-left') x = 30;
        else if (position === 'top-right') y = height - 30;

        const sizeMap = { small: 10, medium: 14, large: 20 };
        const finalSize = sizeMap[textSize as keyof typeof sizeMap] || 14;

        page.drawText(`${currNum}`, {
          x, y,
          size: finalSize,
          color: rgb(0, 0, 0),
        });
        currNum++;
      }
      
      setStatus("Finalizing document...");
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      setStatus("Done!");

      if (settings.autoDownload) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `numbered-${file.name}`;
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
    if (params?.startNum) setStartNum(Number(params.startNum));
    if (params?.position) setPosition(params.position);
    if (params?.textSize) setTextSize(params.textSize);
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/pdf/page-numbers");

  useEffect(() => {
    if (autoRun && file && !isProcessing) {
      handleProcess();
      setAutoRun(false);
    }
  }, [autoRun, file, isProcessing]);

  return (
    <ToolWrapper title="Add Page Numbers" description="Inject serialized page numbers universally across a document." icon={FileDigit}>
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
              subtitle="Numbers will be previewed before being permanently injected"
            />
          )}
        </div>
        
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><FileDigit size={20} /><h2>Numbering Manager</h2></div>
          <div className={styles.configBody}>
            <div className={styles.infoBox}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--foreground)', fontWeight: 700 }}>
                 <Info size={14} />
                 <span>Instruction</span>
              </div>
              Serialized numbers will be added to every page. You can customize the starting index and placement.
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.label}>Start Number From</span>
              <input type="number" min="1" value={startNum} onChange={(e) => { setStartNum(Number(e.target.value)); setOutputUrl(null); }} className={styles.textInput} />
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.label}>Position</span>
              <Dropdown 
                options={[
                  { label: "Bottom Right", value: "bottom-right" }, 
                  { label: "Bottom Center", value: "bottom-center" }, 
                  { label: "Bottom Left", value: "bottom-left" }, 
                  { label: "Top Right", value: "top-right" }
                ]} 
                value={position} 
                onChange={(val) => { setPosition(val); setOutputUrl(null); }} 
              />
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.label}>Text Size</span>
              <Dropdown 
                options={[
                  { label: "Small (10pt)", value: "small" },
                  { label: "Medium (14pt)", value: "medium" },
                  { label: "Large (20pt)", value: "large" }
                ]} 
                value={textSize} 
                onChange={(val) => { setTextSize(val); setOutputUrl(null); }} 
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
                     <div className={styles.statusText}>Numbers Injected</div>
                  </div>
               </div>
            )}
            
            {!outputUrl ? (
              <button className={styles.executeBtn} onClick={handleProcess} disabled={!file || isProcessing}>
                {isProcessing ? <><RefreshCw size={18} className={styles.spin} /> Working...</> : <><FileDigit size={18} /> Inject Numbers</>}
              </button>
            ) : (
              <a 
                href={outputUrl} 
                download={`numbered-${file.name}`}
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



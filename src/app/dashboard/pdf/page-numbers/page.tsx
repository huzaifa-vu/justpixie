"use client";
import { useEffect, useState, useRef } from "react";
import { FileDigit, Download, RefreshCw, Trash2, CheckCircle, Info, Settings2, Palette } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../pdf-pro.module.css";
import { PDFDocument, rgb, hexToRgb } from "pdf-lib";
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
  
  // Studio State
  const [startNum, setStartNum] = useState(1);
  const [xPos, setXPos] = useState(90); // 0-100 percentage
  const [yPos, setYPos] = useState(5);  // 0-100 percentage
  const [textSize, setTextSize] = useState(14);
  const [color, setColor] = useState("#000000");
  const [pdfSize, setPdfSize] = useState({ width: 0, height: 0 });
  const [renderedWidth, setRenderedWidth] = useState(0);

  const thumbnailRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

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
        
        const viewport = page.getViewport({ scale: 1.0 });
        setPdfSize({ width: viewport.width, height: viewport.height });

        const renderViewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.height = renderViewport.height;
          canvas.width = renderViewport.width;
          await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
          canvas.toBlob((blob) => {
            if (blob) setThumbnailUrl(URL.createObjectURL(blob));
          }, "image/jpeg", 0.7);
        }
      } catch (err) { console.error(err); }
    }
  };

  const parseHex = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    } : { r: 0, g: 0, b: 0 };
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setStatus("Opening document...");
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const { r, g, b } = parseHex(color);
      
      let currNum = startNum;
      for (let i = 0; i < pages.length; i++) {
        setStatus(`Stamping page ${i + 1} of ${pages.length}...`);
        const page = pages[i];
        const { width, height } = page.getSize();
        const pageRotation = page.getRotation().angle;
        
        // Map 0-100% to actual dimensions accounting for page rotation
        let x = 0;
        let y = 0;
        const xPerc = xPos / 100;
        const yPerc = yPos / 100;

        if (pageRotation === 90) {
          x = width * yPerc;
          y = height * (1 - xPerc);
        } else if (pageRotation === 180) {
          x = width * (1 - xPerc);
          y = height * (1 - yPerc);
        } else if (pageRotation === 270) {
          x = width * (1 - yPerc);
          y = height * xPerc;
        } else {
          x = width * xPerc;
          y = height * yPerc;
        }

        page.drawText(`${currNum}`, {
          x, y,
          size: textSize,
          color: rgb(r, g, b),
          rotate: degrees(-pageRotation), // Keep page numbers upright relative to the content
        });
        currNum++;
      }
      
      setStatus("Saving studio result...");
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
      setStatus("Studio export failed.");
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
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/pdf/page-numbers");

  useEffect(() => {
    if (autoRun && file && !isProcessing) {
      handleProcess();
      setAutoRun(false);
    }
  }, [autoRun, file, isProcessing]);

  useEffect(() => {
    if (!imgRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setRenderedWidth(entry.contentRect.width);
      }
    });
    obs.observe(imgRef.current);
    return () => obs.disconnect();
  }, [thumbnailUrl]);

  useEffect(() => {
    setOutputUrl(null);
  }, [xPos, yPos, color, textSize, startNum]);

  const visualScale = (pdfSize.width && renderedWidth) ? (renderedWidth / pdfSize.width) : 1;

  return (
    <ToolWrapper title="Page Numbers Studio" description="Interactive visual placement of serialized page numbers." icon={FileDigit}>
      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {file ? (
            <div className={styles.tabletFrame}>
              <div ref={thumbnailRef} style={{ position: 'relative', width: 'fit-content', lineHeight: 0 }}>
                {thumbnailUrl ? (
                  <img ref={imgRef} src={thumbnailUrl} className={styles.thumbnail} alt="PDF Proof" />
                ) : (
                  <div className={styles.thumbnail} style={{ width: 300, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222' }}>
                     <RefreshCw size={40} className={styles.spin} style={{ color: '#444' }} />
                  </div>
                )}
                
                {/* Live Preview Badge */}
                <div 
                  className={styles.livePreviewBadge}
                  style={{ 
                    left: `${xPos}%`, 
                    bottom: `${yPos}%`, 
                    color: color,
                    fontSize: `${textSize * visualScale}px`,
                  }}
                >
                  {startNum}
                </div>
              </div>
            </div>
          ) : (
            <DropZone 
              onFilesSelected={handleFiles} 
              accept="application/pdf"
              title="Select PDF"
              subtitle="Numbers will be proofed on a live tablet mockup"
            />
          )}
        </div>
        
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><FileDigit size={20} /><h2>Studio Manager</h2></div>
          <div className={styles.configBody}>
            <div className={styles.infoBox}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: 'var(--mint-green)', fontWeight: 700 }}>
                 <Info size={14} />
                 <span>Adjust Positioning</span>
              </div>
              Slide the bars below to move the page numbers. The digital tablet on the left shows a live preview of where the first number will sit.
            </div>

            <div className={styles.fieldGroup}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Settings2 size={16} style={{ color: 'var(--mint-green)' }} />
                <span className={styles.label}>Layout & Position</span>
              </div>
              <div className={styles.rangeGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                   <span>Horizontal: {xPos}%</span>
                </div>
                <input type="range" min="0" max="100" value={xPos} onChange={(e) => setXPos(Number(e.target.value))} className={styles.rangeInput} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                   <span>Vertical: {yPos}%</span>
                </div>
                <input type="range" min="0" max="100" value={yPos} onChange={(e) => setYPos(Number(e.target.value))} className={styles.rangeInput} />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Palette size={16} style={{ color: 'var(--mint-green)' }} />
                <span className={styles.label}>Typography & Style</span>
              </div>
              <div style={{ background: 'var(--soft-sage)', padding: '1rem', borderRadius: 'var(--radius-inner)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Color</span>
                   <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className={styles.colorInput} style={{ width: '40px', height: '24px', padding: 0 }} />
                </div>
                
                <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      <span>Text Size</span>
                      <span>{textSize}pt</span>
                   </div>
                   <input type="range" min="6" max="72" value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} className={styles.rangeInput} />
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
               <span className={styles.label}>Starting sequence</span>
               <div style={{ position: 'relative' }}>
                 <input type="number" min="1" value={startNum} onChange={(e) => { setStartNum(Number(e.target.value)); setOutputUrl(null); }} className={styles.textInput} />
                 <FileDigit size={14} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
               </div>
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
                     <div className={styles.statusTitle}>Studio Ready</div>
                     <div className={styles.statusText}>Export Successful</div>
                  </div>
               </div>
            )}
            
            {!outputUrl ? (
              <button className={styles.executeBtn} onClick={handleProcess} disabled={!file || isProcessing}>
                {isProcessing ? <><RefreshCw size={18} className={styles.spin} /> Processing...</> : <><Download size={18} /> Finalize & Download</>}
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
               <Trash2 size={16} /> Discard & Reset
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}



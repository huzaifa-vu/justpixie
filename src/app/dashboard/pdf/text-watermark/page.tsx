"use client";
import { useEffect, useState, useRef } from "react";
import { PenTool, Download, RefreshCw, Trash2, CheckCircle, Info, Settings2, Palette, ShieldAlert, Type } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../pdf-pro.module.css";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";

export default function PdfWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const { settings } = useSettings();
  const [autoRun, setAutoRun] = useState(false);
  
  // studio state
  const [text, setText] = useState("CONFIDENTIAL");
  const [xPos, setXPos] = useState(50);
  const [yPos, setYPos] = useState(50);
  const [fontSize, setFontSize] = useState(60);
  const [rotation, setRotation] = useState(45);
  const [opacity, setOpacity] = useState(0.3);
  const [color, setColor] = useState("#CC3333");
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
    } : { r: 0.8, g: 0.2, b: 0.2 };
  };

  const handleProcess = async () => {
    if (!file || !text) return;
    setIsProcessing(true);
    setStatus("Generating protected document...");
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const { r, g, b } = parseHex(color);
      
      for (let i = 0; i < pages.length; i++) {
        setStatus(`Watermarking page ${i + 1} of ${pages.length}...`);
        const page = pages[i];
        const { width, height } = page.getSize();
        const pageRotation = page.getRotation().angle;
        
        // Map 0-100% to actual dimensions accounting for page rotation
        // The viewer (pdf.js) shows the rotated page, so we transform back to raw coordinates
        let x = 0;
        let y = 0;
        const xPerc = xPos / 100;
        const yPerc = yPos / 100;

        if (pageRotation === 90) {
          x = height * yPerc;
          y = width * (1 - xPerc);
        } else if (pageRotation === 180) {
          x = width * (1 - xPerc);
          y = height * (1 - yPerc);
        } else if (pageRotation === 270) {
          x = height * (1 - yPerc);
          y = width * xPerc;
        } else {
          x = width * xPerc;
          y = height * yPerc;
        }

        page.drawText(text, {
          x, y,
          size: fontSize,
          color: rgb(r, g, b),
          opacity: opacity,
          rotate: degrees(rotation - pageRotation),
        });
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
    if (params?.text) setText(String(params.text));
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/pdf/text-watermark");

  useEffect(() => {
    if (autoRun && file && text && !isProcessing) {
      handleProcess();
      setAutoRun(false);
    }
  }, [autoRun, file, text, isProcessing]);

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
  }, [text, xPos, yPos, fontSize, rotation, opacity, color]);

  const visualScale = (pdfSize.width && renderedWidth) ? (renderedWidth / pdfSize.width) : 1;

  return (
    <ToolWrapper title="Text Watermark Studio" description="Add customizable translucent diagonal labels to your PDF pages." icon={PenTool}>
      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {file ? (
            <div className={styles.tabletFrame}>
              <div ref={thumbnailRef} style={{ position: 'relative' }}>
                {thumbnailUrl ? (
                  <img ref={imgRef} src={thumbnailUrl} className={styles.thumbnail} alt="PDF Proof" />
                ) : (
                  <div className={styles.thumbnail} style={{ width: 300, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222' }}>
                     <RefreshCw size={40} className={styles.spin} style={{ color: '#444' }} />
                  </div>
                )}
                
                {/* Live Watermark Preview */}
                <div 
                  className={styles.livePreviewBadge}
                  style={{ 
                    left: `${xPos}%`, 
                    bottom: `${yPos}%`, 
                    color: color,
                    fontSize: `${fontSize * visualScale}px`,
                    opacity: opacity,
                    transform: `rotate(${-rotation}deg)`, // CSS rotates clockwise, pdf-lib rotates CCW usually, we align to visual
                    transformOrigin: 'bottom left'
                  }}
                >
                  {text}
                </div>
              </div>
            </div>
          ) : (
            <DropZone 
              onFilesSelected={handleFiles} 
              accept="application/pdf"
              title="Select PDF"
              subtitle="Labels will be proofed on a live tablet mockup"
            />
          )}
        </div>
        
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><PenTool size={20} /><h2>Watermark Style</h2></div>
          <div className={styles.configBody}>
            <div className={styles.infoBox}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: 'var(--mint-green)', fontWeight: 700 }}>
                 <Info size={14} />
                 <span>Studio Preview</span>
              </div>
              Adjust the sliders below to live-preview the watermark. The position reflects the exact **bottom-left anchor** of the text.
            </div>

            <div className={styles.fieldGroup}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Type size={16} style={{ color: 'var(--mint-green)' }} />
                <span className={styles.label}>Watermark Text</span>
              </div>
              <input 
                type="text" 
                value={text} 
                onChange={(e) => setText(e.target.value.toUpperCase())} 
                className={styles.textInput} 
                placeholder="CONFIDENTIAL"
              />
            </div>

            <div className={styles.fieldGroup}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Settings2 size={16} style={{ color: 'var(--mint-green)' }} />
                <span className={styles.label}>Placement & Bounds</span>
              </div>
              <div className={styles.rangeGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                   <span>Horizontal (X): {xPos}%</span>
                </div>
                <input type="range" min="0" max="100" value={xPos} onChange={(e) => setXPos(Number(e.target.value))} className={styles.rangeInput} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                   <span>Vertical (Y): {yPos}%</span>
                </div>
                <input type="range" min="0" max="100" value={yPos} onChange={(e) => setYPos(Number(e.target.value))} className={styles.rangeInput} />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Palette size={16} style={{ color: 'var(--mint-green)' }} />
                <span className={styles.label}>Visual Styling</span>
              </div>
              <div style={{ background: 'var(--soft-sage)', padding: '1rem', borderRadius: 'var(--radius-inner)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Color</span>
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className={styles.colorInput} style={{ width: '40px', height: '24px', padding: 0 }} />
                 </div>

                 <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      <span>Rotation</span>
                      <span>{rotation}°</span>
                   </div>
                   <input type="range" min="-180" max="180" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className={styles.rangeInput} />
                 </div>

                 <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      <span>Opacity</span>
                      <span>{Math.round(opacity * 100)}%</span>
                   </div>
                   <input type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className={styles.rangeInput} />
                 </div>

                 <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      <span>Font Size</span>
                      <span>{fontSize}pt</span>
                   </div>
                   <input type="range" min="10" max="300" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className={styles.rangeInput} />
                 </div>
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
                     <div className={styles.statusText}>Watermark Applied</div>
                  </div>
               </div>
            )}
            
            {!outputUrl ? (
              <button className={styles.executeBtn} onClick={handleProcess} disabled={!file || !text || isProcessing}>
                {isProcessing ? <><RefreshCw size={18} className={styles.spin} /> Processing...</> : <><PenTool size={18} /> Finalize Watermark</>}
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
               <Trash2 size={16} /> Discard & Reset
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}




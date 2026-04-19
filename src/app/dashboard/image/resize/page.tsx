"use client";
import { useState, useRef, useEffect } from "react";
import { UploadCloud, Maximize, Wand2, RefreshCw, Download } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import styles from "../../image/format/page.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function ImageResizer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lockRatio, setLockRatio] = useState(true);
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [autoRun, setAutoRun] = useState(false);
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setResultUrl(null);
    const img = new Image(); img.src = url;
    img.onload = () => { setOrigW(img.width); setOrigH(img.height); setWidth(img.width); setHeight(img.height); };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  useAiHydration(({ files, params, autoExecute }) => {
    // 1. Respect AI's decision on aspect ratio locking
    const aiLock = params?.lockAspectRatio !== undefined ? (params.lockAspectRatio === true || params.lockAspectRatio === "true") : null;
    if (aiLock !== null) setLockRatio(aiLock);

    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setOriginalUrl(url);
      setResultUrl(null);
      const img = new Image(); img.src = url;
      img.onload = () => { 
        setOrigW(img.width); setOrigH(img.height); 
        
        const aiW = params?.width ? Number(params.width) : null;
        const aiH = params?.height ? Number(params.height) : null;
        const effectiveLock = aiLock !== null ? aiLock : lockRatio;

        // 2. Smart Calculation: If Locking is enabled and only one dimension came from AI
        if (aiW && !aiH && effectiveLock) {
          setWidth(aiW);
          setHeight(Math.round(aiW * (img.height / img.width)));
        } else if (!aiW && aiH && effectiveLock) {
          setHeight(aiH);
          setWidth(Math.round(aiH * (img.width / img.height)));
        } else {
          // Standard: Use AI values or fallback to original
          if (aiW) setWidth(aiW);
          else setWidth(img.width);
          
          if (aiH) setHeight(aiH);
          else setHeight(img.height);
        }
      };
    } else {
      // No files yet (navigation only case)
      if (params?.width) setWidth(Number(params.width));
      if (params?.height) setHeight(Number(params.height));
    }
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/image/resize");

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockRatio && origW > 0) setHeight(Math.round(val * (origH / origW)));
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockRatio && origH > 0) setWidth(Math.round(val * (origW / origH)));
  };

  const executeResize = async () => {
    if (!originalUrl) return;
    setIsProcessing(true);
    try {
      const img = new (window.Image)(); img.src = originalUrl;
      await new Promise(r => img.onload = r);
      const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("fail");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => { if (blob) { setResultUrl(URL.createObjectURL(blob)); } setIsProcessing(false); }, "image/png");
    } catch { alert("Resize failed"); setIsProcessing(false); }
  };

  useEffect(() => {
    if (autoRun && selectedFile && origW > 0 && !isProcessing) {
      executeResize();
      setAutoRun(false);
    }
  }, [autoRun, selectedFile, isProcessing, origW]);

  useEffect(() => {
    if (resultUrl && settings.autoDownload && !isProcessing) {
      const timer = setTimeout(() => {
        const link = document.createElement("a");
        link.href = resultUrl;
        link.download = `pixie-${Date.now()}.png`;
        link.click();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [resultUrl, settings.autoDownload, isProcessing]);

  return (
    <ToolWrapper title="Image Resizer" description="Scale images to exact pixel dimensions using Canvas interpolation." icon={Maximize}>
      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {!originalUrl ? (
            <DropZone 
              onFilesSelected={(files) => handleFile(files[0])} 
              accept="image/*"
              title="Select an Image"
              subtitle="PNG, JPG, WebP"
            />
          ) : (
            <div className={styles.viewerContainer}><div className={styles.imageBox} style={{ backgroundImage: `url(${resultUrl || originalUrl})` }} /></div>
          )}
        </div>
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><Wand2 size={20} /><h2>Dimensions</h2></div>
          <div className={styles.configBody}>
            {origW > 0 && <div style={{fontSize:'0.8125rem', color:'var(--text-muted)'}}>Original: {origW}×{origH}px</div>}
            <div className={styles.selectorGroup}><label className={styles.inputLabel}>Width (px)</label><input type="number" value={width} onChange={(e) => handleWidthChange(parseInt(e.target.value)||1)} className={styles.dropdown} /></div>
            <div className={styles.selectorGroup}><label className={styles.inputLabel}>Height (px)</label><input type="number" value={height} onChange={(e) => handleHeightChange(parseInt(e.target.value)||1)} className={styles.dropdown} /></div>
            <label style={{display:'flex', gap:'0.5rem', fontSize:'0.875rem', cursor:'pointer'}}><input type="checkbox" checked={lockRatio} onChange={() => setLockRatio(!lockRatio)} /> Lock Aspect Ratio</label>
            {!resultUrl ? (
              <button className={styles.executeBtn} onClick={executeResize} disabled={!selectedFile || isProcessing}>{isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Resizing...</> : <><Maximize size={20} /> Resize</>}</button>
            ) : (
              <div className={styles.resultDetails}><div className={styles.statLabel}>Resized to {width}×{height}px</div><a href={resultUrl} download={`resized-${selectedFile?.name}`} className={styles.downloadBtnLarge}><Download size={20} /> Download</a></div>
            )}
            <button className={styles.resetBtn} onClick={() => { setResultUrl(null); setSelectedFile(null); setOriginalUrl(null); }}>Clear</button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


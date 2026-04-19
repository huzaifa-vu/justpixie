"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, Image as ImageIcon, Wand2, RefreshCw, Download, Layers, ArrowUpDown, Info } from "lucide-react";
import Dropdown from "@/components/Dropdown";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import styles from "./page.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function WatermarkWizard() {
  const [baseImage, setBaseImage] = useState<File | null>(null);
  const [basePreview, setBasePreview] = useState<string | null>(null);
  
  const [watermarkImage, setWatermarkImage] = useState<File | null>(null);
  const [watermarkPreview, setWatermarkPreview] = useState<string | null>(null);
  
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [opacity, setOpacity] = useState(0.5);
  const [position, setPosition] = useState<"center" | "bottom-right" | "top-left" | "tiled">("bottom-right");
  const [pendingAutoExecute, setPendingAutoExecute] = useState(false);
  const { settings } = useSettings();
  
  const baseInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  // --- AI Hydration ---
  useAiHydration(({ files, autoExecute }) => {
    if (files.length >= 2) {
      setBaseImage(files[0]);
      setBasePreview(URL.createObjectURL(files[0]));
      setWatermarkImage(files[1]);
      setWatermarkPreview(URL.createObjectURL(files[1]));
      if (autoExecute) {
        setPendingAutoExecute(true);
      }
    } else if (files.length === 1) {
      setBaseImage(files[0]);
      setBasePreview(URL.createObjectURL(files[0]));
    }
  }, "/dashboard/image/watermark");

  // Auto execute after images are set
  useEffect(() => {
    if (pendingAutoExecute && basePreview && watermarkPreview) {
      setPendingAutoExecute(false);
      setTimeout(() => executeWatermarking(), 500);
    }
  }, [pendingAutoExecute, basePreview, watermarkPreview]);

  const handleFiles = (files: File[]) => {
    if (files.length >= 2) {
      setBaseImage(files[0]);
      setBasePreview(URL.createObjectURL(files[0]));
      setWatermarkImage(files[1]);
      setWatermarkPreview(URL.createObjectURL(files[1]));
      setResultUrl(null);
    } else if (files.length === 1) {
      setBaseImage(files[0]);
      setBasePreview(URL.createObjectURL(files[0]));
      setResultUrl(null);
    }
  };

  const handleBaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBaseImage(e.target.files[0]);
      setBasePreview(URL.createObjectURL(e.target.files[0]));
      setResultUrl(null);
    }
  };

  const handleWatermarkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setWatermarkImage(e.target.files[0]);
      setWatermarkPreview(URL.createObjectURL(e.target.files[0]));
      setResultUrl(null);
    }
  };

  const handleSwapImages = () => {
    const tempFile = baseImage;
    const tempPreview = basePreview;
    
    setBaseImage(watermarkImage);
    setBasePreview(watermarkPreview);
    setWatermarkImage(tempFile);
    setWatermarkPreview(tempPreview);
    
    // Reset result so user can re-execute
    setResultUrl(null);
  };

  const executeWatermarking = async () => {
    if (!basePreview || !watermarkPreview) return;
    setIsProcessing(true);

    try {
      const bImg = window.document.createElement("img");
      const wImg = window.document.createElement("img");
      
      bImg.src = basePreview;
      wImg.src = watermarkPreview;

      await Promise.all([
        new Promise(r => bImg.onload = r),
        new Promise(r => wImg.onload = r)
      ]);

      const canvas = document.createElement("canvas");
      canvas.width = bImg.width;
      canvas.height = bImg.height;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) throw new Error("Canvas failure");

      ctx.drawImage(bImg, 0, 0);
      ctx.globalAlpha = opacity;

      const scaleFactor = (bImg.width * 0.25) / wImg.width;
      const wWidth = wImg.width * scaleFactor;
      const wHeight = wImg.height * scaleFactor;
      
      const padding = bImg.width * 0.05;

      if (position === "tiled") {
        for (let x = 0; x < canvas.width; x += wWidth + padding) {
          for (let y = 0; y < canvas.height; y += wHeight + padding) {
             ctx.drawImage(wImg, x, y, wWidth, wHeight);
          }
        }
      } else if (position === "bottom-right") {
        ctx.drawImage(wImg, canvas.width - wWidth - padding, canvas.height - wHeight - padding, wWidth, wHeight);
      } else if (position === "top-left") {
        ctx.drawImage(wImg, padding, padding, wWidth, wHeight);
      } else {
        ctx.drawImage(wImg, (canvas.width - wWidth) / 2, (canvas.height - wHeight) / 2, wWidth, wHeight);
      }

      ctx.globalAlpha = 1.0;

      canvas.toBlob((blob) => {
        if (blob) {
          setResultUrl(URL.createObjectURL(blob));
          setIsProcessing(false);
        }
      }, "image/png");

    } finally {
      setIsProcessing(false);
    }
  };

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
    <ToolWrapper title="Watermark Wizard" description="Composite protective brand layers onto your visual assets entirely client-side." icon={Layers}>

      <div className={styles.workspace}>
        <div className={styles.layersArea}>
          {/* Base Layer */}
          <div className={`${styles.layerBox} ${basePreview ? styles.layerActive : ""}`}>
             <div className={styles.layerHeader}>
                <div className={styles.layerTitle}>1. Base Canvas</div>
                {baseImage && <span className={styles.fileSize}>{(baseImage.size / 1024).toFixed(1)} KB</span>}
             </div>
             <DropZone 
                onFilesSelected={(files) => {
                  setBaseImage(files[0]);
                  setBasePreview(URL.createObjectURL(files[0]));
                  setResultUrl(null);
                }} 
                accept="image/*"
                title="Select Base"
                compact
                previewUrl={basePreview}
             />
             {baseImage && <div className={styles.fileName}>{baseImage.name}</div>}
          </div>

          {/* Swap Button */}
          {basePreview && watermarkPreview && (
            <button 
              onClick={handleSwapImages}
              style={{ 
                alignSelf: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border)', background: 'var(--surface-card)',
                cursor: 'pointer', fontWeight: 600, color: 'var(--text-muted)', transition: 'all 0.2s'
              }}
            >
              <ArrowUpDown size={16} /> Swap Images
            </button>
          )}

          {/* Watermark Layer */}
          <div className={`${styles.layerBox} ${watermarkPreview ? styles.layerActive : ""}`}>
             <div className={styles.layerHeader}>
                <div className={styles.layerTitle}>2. Protection Mark</div>
                {watermarkImage && <span className={styles.fileSize}>{(watermarkImage.size / 1024).toFixed(1)} KB</span>}
             </div>
             <DropZone 
                onFilesSelected={(files) => {
                  setWatermarkImage(files[0]);
                  setWatermarkPreview(URL.createObjectURL(files[0]));
                  setResultUrl(null);
                }} 
                accept="image/png, image/webp"
                title="Select Mark"
                compact
                previewUrl={watermarkPreview}
             />
             {watermarkImage && <div className={styles.fileName}>{watermarkImage.name}</div>}
          </div>
        </div>

        {/* Output Preview Stage */}
        <div className={styles.previewArea}>
          <div className={styles.viewerTop}>
            <span>{resultUrl ? "Magic Cut Result" : "Staging Area"}</span>
            {(basePreview || resultUrl) && (
              <button 
                className={styles.clearBtn}
                onClick={() => {
                  setBaseImage(null);
                  setBasePreview(null);
                  setWatermarkImage(null);
                  setWatermarkPreview(null);
                  setResultUrl(null);
                }}
              >
                Clear Canvas
              </button>
            )}
          </div>
          <div className={`${styles.viewerContainer} ${basePreview ? styles.checkerboard : ""}`}>
             {!basePreview ? (
               <div className={styles.placeholderState}>
                 <Layers size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                 <p>Upload a base image to begin staging</p>
               </div>
             ) : (
               <div className={styles.stageWrap}>
                 <img src={resultUrl || basePreview} alt="Stage" className={styles.stageImage} />
                 
                 {/* Ghost Overlay when staging (before fusion) */}
                 {watermarkPreview && !resultUrl && (
                   <div className={`${styles.watermarkGhost} ${styles[position]}`} style={{ opacity: opacity }}>
                     <img src={watermarkPreview} alt="Ghost" />
                   </div>
                 )}

                 {resultUrl && (
                   <div className={styles.successBadge}>
                     <Wand2 size={16} /> Fused Successfully
                   </div>
                 )}
               </div>
             )}
          </div>
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Wand2 size={20} />
            <h2>Execution Block</h2>
          </div>
          
          <div className={styles.configBody}>
             <div className={styles.selectorGroup}>
               <label className={styles.inputLabel}>Opacity (Alpha)</label>
               <input 
                 type="range" 
                 min="0.1" max="1" step="0.1" 
                 value={opacity} 
                 onChange={(e) => setOpacity(parseFloat(e.target.value))}
                 className={styles.rangeSlider}
               />
               <span style={{fontSize:'0.75rem', alignSelf:'flex-end'}}>{opacity * 100}%</span>
             </div>

             <div className={styles.selectorGroup}>
               <label className={styles.inputLabel}>Positioning</label>
               <Dropdown options={[{ label: "Bottom Right Lock", value: "bottom-right" }, { label: "Center Focal", value: "center" }, { label: "Full Tiled Wash", value: "tiled" }, { label: "Top Left", value: "top-left" }]} value={position} onChange={(val) => setPosition(val)} />
             </div>

            {!resultUrl ? (
              <button className={styles.executeBtn} onClick={executeWatermarking} disabled={!basePreview || !watermarkPreview || isProcessing}>
                {isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Fusing Layers...</> : <><Layers size={20} /> Fuse Mark</>}
              </button>
            ) : (
               <div className={styles.resultDetails}>
                 <div className={styles.statLabel}>Successfully Fused.</div>
                 <a href={resultUrl} download={`watermarked-${baseImage?.name}`} className={styles.downloadBtnLarge}>
                   <Download size={20} /> Download Asset
                 </a>
               </div>
            )}
            
            <button 
              className={styles.resetBtn} 
              onClick={() => { 
                setBaseImage(null);
                setBasePreview(null);
                setWatermarkImage(null);
                setWatermarkPreview(null);
                setResultUrl(null); 
              }}
            >
              Reset Wizard
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

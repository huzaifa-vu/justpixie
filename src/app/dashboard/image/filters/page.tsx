"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SlidersHorizontal, Download, UploadCloud, Undo2, Redo2, Layers, Sun, Palette, Sparkles, RotateCcw, RotateCw, Eye, RefreshCcw } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import { useRouter } from "next/navigation";
import styles from "../image-tools.module.css";
import { ArrowLeft } from "lucide-react";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

interface AdjustmentState {
  brightness: number;
  contrast: number;
  saturate: number;
  blur: number;
  hueRotate: number;
  grayscale: number;
  sepia: number;
  invert: number;
}

const DEFAULT_STATE: AdjustmentState = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
  hueRotate: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0
};




export default function ImageFilters() {
  const router = useRouter();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [blur, setBlur] = useState(0);
  const [hueRotate, setHueRotate] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [invert, setInvert] = useState(0);
  
  const [history, setHistory] = useState<AdjustmentState[]>([DEFAULT_STATE]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComparing, setIsComparing] = useState(false);
  
  const { settings } = useSettings();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      resetControls();
      setHistory([DEFAULT_STATE]);
      setCurrentIndex(0);

      const img = new Image();
      img.onload = () => { imgRef.current = img; renderCanvas(img); };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const resetControls = () => {
    setBrightness(DEFAULT_STATE.brightness);
    setContrast(DEFAULT_STATE.contrast);
    setSaturate(DEFAULT_STATE.saturate);
    setBlur(DEFAULT_STATE.blur);
    setHueRotate(DEFAULT_STATE.hueRotate);
    setGrayscale(DEFAULT_STATE.grayscale);
    setSepia(DEFAULT_STATE.sepia);
    setInvert(DEFAULT_STATE.invert);
  };

  const pushHistoryState = () => {
    const newState: AdjustmentState = { brightness, contrast, saturate, blur, hueRotate, grayscale, sepia, invert };
    
    // Only push if changed from last state
    const lastState = history[currentIndex];
    const isSame = Object.keys(newState).every(key => newState[key as keyof AdjustmentState] === lastState[key as keyof AdjustmentState]);
    
    if (!isSame) {
      const newHistory = history.slice(0, currentIndex + 1);
      newHistory.push(newState);
      setHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);
    }
  };

  const getActiveCSS = useCallback((overrideState?: AdjustmentState) => {
    const s = overrideState || (isComparing ? DEFAULT_STATE : { brightness, contrast, saturate, blur, hueRotate, grayscale, sepia, invert });
    return `brightness(${s.brightness}%) contrast(${s.contrast}%) saturate(${s.saturate}%) blur(${s.blur}px) hue-rotate(${s.hueRotate}deg) grayscale(${s.grayscale}%) sepia(${s.sepia}%) invert(${s.invert}%)`.trim();
  }, [brightness, contrast, saturate, blur, hueRotate, grayscale, sepia, invert, isComparing]);

  const renderCanvas = useCallback((img: HTMLImageElement, overrideState?: AdjustmentState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.filter = getActiveCSS(overrideState);
    ctx.drawImage(img, 0, 0);
  }, [getActiveCSS]);

  useEffect(() => {
      // Sync sliders with history index
      const state = history[currentIndex];
      if (state) {
        setBrightness(state.brightness);
        setContrast(state.contrast);
        setSaturate(state.saturate);
        setBlur(state.blur);
        setHueRotate(state.hueRotate);
        setGrayscale(state.grayscale);
        setSepia(state.sepia);
        setInvert(state.invert);
      }
  }, [currentIndex, history]);

  // Handle updates
  useEffect(() => {
    if (imgRef.current) {
      renderCanvas(imgRef.current);
    }
  }, [brightness, contrast, saturate, blur, hueRotate, grayscale, sepia, invert, isComparing, renderCanvas]);

  const undo = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const redo = () => {
    if (currentIndex < history.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const resetAll = () => {
    setCurrentIndex(0);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const a = document.createElement("a");
    a.href = canvasRef.current.toDataURL("image/png");
    a.download = `filtered-${Date.now()}.png`;
    a.click();
  };
  useAiHydration(({ files, params }) => {
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    if (params?.brightness) setBrightness(Number(params.brightness));
    if (params?.contrast) setContrast(Number(params.contrast));
  }, "/dashboard/image/filters");





  return (
    <ToolWrapper title="Image Filters" description="Apply stunning CSS-native image filters and export as PNG." icon={SlidersHorizontal}>

      <div className={styles.workspace}>
        <div className={styles.canvasArea}>
          {imageSrc && (
            <div className={styles.historyBar}>
               <button className={styles.historyBtn} onClick={undo} disabled={currentIndex <= 0} title="Undo">
                  <RotateCcw size={16} />
               </button>
               <button className={styles.historyBtn} onClick={redo} disabled={currentIndex >= history.length - 1} title="Redo">
                  <RotateCw size={16} />
               </button>
               <div style={{ width: '1px', background: 'var(--border)', height: '20px', margin: '0 0.25rem' }} />
               <button className={styles.historyBtn} onClick={resetAll} title="Reset All">
                  <RefreshCcw size={16} />
               </button>
               <button 
                className={`${styles.compareBtn} ${isComparing ? styles.compareBtnActive : ""}`}
                onMouseDown={() => setIsComparing(true)}
                onMouseUp={() => setIsComparing(false)}
                onMouseLeave={() => setIsComparing(false)}
                title="Hold to see original"
               >
                  <Eye size={14} /> Compare
               </button>
            </div>
          )}
          {!imageSrc ? (
            <DropZone 
              onFilesSelected={(files) => handleFile(files[0])} 
              accept="image/*"
              title="Drop an image here"
              subtitle="or click to browse"
            />
          ) : (
            <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          )}
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <SlidersHorizontal size={18} />
            <h2>Adjustment Panel</h2>
          </div>
          <div className={styles.configBody}>

            {/* Color Adjustments */}
            <div className={styles.categoryHeader}>
              <Sun size={14} className={styles.headerIcon} />
              <span className={styles.categoryTitle}>Color Adjustments</span>
            </div>
            
            <div className={styles.controlGroup}>
              <div className={styles.fieldGroup}>
                <div className={styles.rangeLabel}>
                  <span className={styles.label}>Brightness</span>
                  <span className={styles.rangeValue}>{brightness}%</span>
                </div>
                <input 
                  type="range" min="10" max="200" value={brightness} 
                  onChange={(e) => setBrightness(Number(e.target.value))} 
                  onMouseUp={pushHistoryState}
                  className={styles.rangeInput} 
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.rangeLabel}>
                  <span className={styles.label}>Contrast</span>
                  <span className={styles.rangeValue}>{contrast}%</span>
                </div>
                <input 
                  type="range" min="10" max="300" value={contrast} 
                  onChange={(e) => setContrast(Number(e.target.value))} 
                  onMouseUp={pushHistoryState}
                  className={styles.rangeInput} 
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.rangeLabel}>
                  <span className={styles.label}>Saturation</span>
                  <span className={styles.rangeValue}>{saturate}%</span>
                </div>
                <input 
                  type="range" min="0" max="500" value={saturate} 
                  onChange={(e) => setSaturate(Number(e.target.value))} 
                  onMouseUp={pushHistoryState}
                  className={styles.rangeInput} 
                />
              </div>
            </div>

            {/* Visual Details */}
            <div className={styles.categoryHeader}>
              <Sparkles size={14} className={styles.headerIcon} />
              <span className={styles.categoryTitle}>Visual Details</span>
            </div>

            <div className={styles.controlGroup}>
              <div className={styles.fieldGroup}>
                <div className={styles.rangeLabel}>
                  <span className={styles.label}>Blur</span>
                  <span className={styles.rangeValue}>{blur}px</span>
                </div>
                <input 
                  type="range" min="0" max="20" step="1" value={blur} 
                  onChange={(e) => setBlur(Number(e.target.value))} 
                  onMouseUp={pushHistoryState}
                  className={styles.rangeInput} 
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.rangeLabel}>
                  <span className={styles.label}>Hue Rotate</span>
                  <span className={styles.rangeValue}>{hueRotate}°</span>
                </div>
                <input 
                  type="range" min="0" max="360" value={hueRotate} 
                  onChange={(e) => setHueRotate(Number(e.target.value))} 
                  onMouseUp={pushHistoryState}
                  className={styles.rangeInput} 
                />
              </div>
            </div>

            {/* Artistic Effects */}
            <div className={styles.categoryHeader}>
              <Palette size={14} className={styles.headerIcon} />
              <span className={styles.categoryTitle}>Artistic Effects</span>
            </div>

            <div className={styles.controlGroup}>
              <div className={styles.fieldGroup}>
                <div className={styles.rangeLabel}>
                  <span className={styles.label}>Grayscale</span>
                  <span className={styles.rangeValue}>{grayscale}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={grayscale} 
                  onChange={(e) => setGrayscale(Number(e.target.value))} 
                  onMouseUp={pushHistoryState}
                  className={styles.rangeInput} 
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.rangeLabel}>
                  <span className={styles.label}>Sepia</span>
                  <span className={styles.rangeValue}>{sepia}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={sepia} 
                  onChange={(e) => setSepia(Number(e.target.value))} 
                  onMouseUp={pushHistoryState}
                  className={styles.rangeInput} 
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.rangeLabel}>
                  <span className={styles.label}>Invert</span>
                  <span className={styles.rangeValue}>{invert}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={invert} 
                  onChange={(e) => setInvert(Number(e.target.value))} 
                  onMouseUp={pushHistoryState}
                  className={styles.rangeInput} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <input 
                type="file" 
                ref={fileInputRef} 
                className={styles.hiddenInput} 
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} 
                accept="image/*"
              />
              <button 
                className={styles.uploadBtn} 
                onClick={() => fileInputRef.current?.click()}
              >
                New Image
              </button>

            </div>

            <button className={styles.actionBtn} onClick={handleDownload} disabled={!imageSrc} style={{ marginTop: 'auto' }}>
              <Download size={18} /> Download Filtered Image
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


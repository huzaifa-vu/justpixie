"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SlidersHorizontal, Download, UploadCloud, Undo2, Redo2, Layers } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import { useRouter } from "next/navigation";
import styles from "../image-tools.module.css";
import { ArrowLeft } from "lucide-react";
import Dropdown from "@/components/Dropdown";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";


const FILTERS = [
  { name: "None", css: "none", preview: <span style={{fontSize:'10px'}}>None</span> },
  { name: "Grayscale", css: "grayscale(100%)", preview: <div style={{ width: '100%', height: '100%', background: '#888' }} /> },
  { name: "Sepia", css: "sepia(100%)", preview: <div style={{ width: '100%', height: '100%', background: '#704214' }} /> },
  { name: "Invert", css: "invert(100%)", preview: <div style={{ width: '100%', height: '100%', background: '#000', border: '1px solid #fff' }} /> },
  { name: "Blur", css: "blur(3px)", preview: <div style={{ width: '100%', height: '100%', background: '#ddd', filter: 'blur(2px)' }} /> },
  { name: "High Contrast", css: "contrast(200%)", preview: <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to right, black, white)' }} /> },
  { name: "Warm Glow", css: "sepia(40%) saturate(150%) brightness(110%)", preview: <div style={{ width: '100%', height: '100%', background: '#ffcc33' }} /> },
  { name: "Cool Breeze", css: "hue-rotate(200deg) saturate(120%)", preview: <div style={{ width: '100%', height: '100%', background: '#33ccff' }} /> },
  { name: "Vintage", css: "sepia(60%) contrast(90%) brightness(90%)", preview: <div style={{ width: '100%', height: '100%', background: '#c4a484' }} /> },
];

export default function ImageFilters() {
  const router = useRouter();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("None");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [blur, setBlur] = useState(0);
  const [hueRotate, setHueRotate] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [invert, setInvert] = useState(0);
  
  const [history, setHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
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
      setHistory([src]);
      setCurrentIndex(0);

      const img = new Image();
      img.onload = () => { imgRef.current = img; renderCanvas(img); };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const resetControls = () => {
    setActiveFilter("None");
    setBrightness(100);
    setContrast(100);
    setSaturate(100);
    setBlur(0);
    setHueRotate(0);
    setGrayscale(0);
    setSepia(0);
    setInvert(0);
  };

  const getActiveCSS = useCallback(() => {
    const preset = FILTERS.find(f => f.name === activeFilter);
    const base = preset?.css === "none" ? "" : (preset?.css || "");
    
    return `${base} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) blur(${blur}px) hue-rotate(${hueRotate}deg) grayscale(${grayscale}%) sepia(${sepia}%) invert(${invert}%)`.trim();
  }, [activeFilter, brightness, contrast, saturate, blur, hueRotate, grayscale, sepia, invert]);

  const renderCanvas = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.filter = getActiveCSS();
    ctx.drawImage(img, 0, 0);
  }, [getActiveCSS]);

  useEffect(() => {
      if (imgRef.current && history[currentIndex]) {
        const img = new Image();
        img.onload = () => {
          renderCanvas(img);
        };
        img.src = history[currentIndex];
      }
  }, [activeFilter, brightness, contrast, saturate, blur, hueRotate, grayscale, sepia, invert, currentIndex, history, renderCanvas]);

  const handleApply = () => {
    if (!canvasRef.current) return;
    const newSrc = canvasRef.current.toDataURL("image/png");
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newSrc);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
    
    resetControls();
  };

  const undo = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const redo = () => {
    if (currentIndex < history.length - 1) setCurrentIndex(currentIndex + 1);
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
    if (params?.filter) {
      const match = FILTERS.find(f => f.name.toLowerCase() === params.filter.toLowerCase());
      if (match) setActiveFilter(match.name);
    }
    if (params?.brightness) setBrightness(Number(params.brightness));
    if (params?.contrast) setContrast(Number(params.contrast));
  }, "/dashboard/image/filters");

  useEffect(() => {
    if (imageSrc && settings.autoDownload) {
      // For filters, we only auto-download if we've actually applied something non-default
      if (activeFilter !== "None" || brightness !== 100 || contrast !== 100) {
        const timer = setTimeout(() => {
          handleDownload();
        }, 1000); // Give it a bit more time for the canvas to render
        return () => clearTimeout(timer);
      }
    }
  }, [imageSrc, activeFilter, brightness, contrast, settings.autoDownload]);



  return (
    <ToolWrapper title="Image Filters" description="Apply stunning CSS-native image filters and export as PNG." icon={SlidersHorizontal}>

      <div className={styles.workspace}>
        <div className={styles.canvasArea}>
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
            <h2>Filter Presets</h2>
          </div>
          <div className={styles.configBody}>

            {imageSrc && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                 <button className={styles.secondaryBtn} onClick={undo} disabled={currentIndex <= 0} style={{ flex: 1, padding: '0.5rem' }}>
                    <Undo2 size={16} /> Undo
                 </button>
                 <button className={styles.secondaryBtn} onClick={redo} disabled={currentIndex >= history.length - 1} style={{ flex: 1, padding: '0.5rem' }}>
                    <Redo2 size={16} /> Redo
                 </button>
              </div>
            )}

            <div className={styles.fieldGroup}>
              <span className={styles.label}>Filter Preset</span>
              <Dropdown 
                options={FILTERS.map(f => ({ label: f.name, value: f.name, preview: f.preview }))}
                value={activeFilter}
                onChange={(val) => setActiveFilter(val)}
              />
            </div>

            {/* Custom Sliders Section */}
            <div className={styles.customControls}>
              <div className={styles.fieldGroup}>
                <div className={styles.rangeLabel}>
                  <span className={styles.label}>Brightness</span>
                  <span className={styles.rangeValue}>{brightness}%</span>
                </div>
                <input type="range" min="10" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className={styles.rangeInput} />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.rangeLabel}>
                  <span className={styles.label}>Contrast</span>
                  <span className={styles.rangeValue}>{contrast}%</span>
                </div>
                <input type="range" min="10" max="300" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className={styles.rangeInput} />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.rangeLabel}>
                  <span className={styles.label}>Saturation</span>
                  <span className={styles.rangeValue}>{saturate}%</span>
                </div>
                <input type="range" min="0" max="500" value={saturate} onChange={(e) => setSaturate(Number(e.target.value))} className={styles.rangeInput} />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.rangeLabel}>
                  <span className={styles.label}>Blur</span>
                  <span className={styles.rangeValue}>{blur}px</span>
                </div>
                <input type="range" min="0" max="20" step="1" value={blur} onChange={(e) => setBlur(Number(e.target.value))} className={styles.rangeInput} />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.rangeLabel}>
                  <span className={styles.label}>Hue Rotate</span>
                  <span className={styles.rangeValue}>{hueRotate}°</span>
                </div>
                <input type="range" min="0" max="360" value={hueRotate} onChange={(e) => setHueRotate(Number(e.target.value))} className={styles.rangeInput} />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.rangeLabel}>
                  <span className={styles.label}>Grayscale</span>
                  <span className={styles.rangeValue}>{grayscale}%</span>
                </div>
                <input type="range" min="0" max="100" value={grayscale} onChange={(e) => setGrayscale(Number(e.target.value))} className={styles.rangeInput} />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.rangeLabel}>
                  <span className={styles.label}>Sepia</span>
                  <span className={styles.rangeValue}>{sepia}%</span>
                </div>
                <input type="range" min="0" max="100" value={sepia} onChange={(e) => setSepia(Number(e.target.value))} className={styles.rangeInput} />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.rangeLabel}>
                  <span className={styles.label}>Invert</span>
                  <span className={styles.rangeValue}>{invert}%</span>
                </div>
                <input type="range" min="0" max="100" value={invert} onChange={(e) => setInvert(Number(e.target.value))} className={styles.rangeInput} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
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
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem' }}
              >
                New Image
              </button>
              <button 
                className={styles.actionBtnAlt} 
                onClick={handleApply} 
                disabled={activeFilter === "None" && brightness === 100 && contrast === 100 && saturate === 100 && blur === 0 && hueRotate === 0 && grayscale === 0 && sepia === 0 && invert === 0}
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem' }}
              >
                <Layers size={16} /> Apply
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


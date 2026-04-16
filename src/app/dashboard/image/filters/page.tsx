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
  { name: "None", css: "none" },
  { name: "Grayscale", css: "grayscale(100%)" },
  { name: "Sepia", css: "sepia(100%)" },
  { name: "Invert", css: "invert(100%)" },
  { name: "Blur", css: "blur(3px)" },
  { name: "High Contrast", css: "contrast(200%)" },
  { name: "Low Brightness", css: "brightness(50%)" },
  { name: "Saturate", css: "saturate(300%)" },
  { name: "Hue Rotate", css: "hue-rotate(180deg)" },
  { name: "Warm Glow", css: "sepia(40%) saturate(150%) brightness(110%)" },
  { name: "Cool Breeze", css: "hue-rotate(200deg) saturate(120%)" },
  { name: "Vintage", css: "sepia(60%) contrast(90%) brightness(90%)" },
];

export default function ImageFilters() {
  const router = useRouter();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("None");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
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
      setActiveFilter("None");
      setBrightness(100);
      setContrast(100);
      setHistory([src]);
      setCurrentIndex(0);

      const img = new Image();
      img.onload = () => { imgRef.current = img; renderCanvas(img, "none", 100, 100); };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const getActiveCSS = useCallback(() => {
    const preset = FILTERS.find(f => f.name === activeFilter);
    const base = preset?.css || "none";
    // Layer custom brightness/contrast on top
    if (base === "none") {
      return `brightness(${brightness}%) contrast(${contrast}%)`;
    }
    return `${base} brightness(${brightness}%) contrast(${contrast}%)`;
  }, [activeFilter, brightness, contrast]);

  const renderCanvas = useCallback((img: HTMLImageElement, filterCSS: string, br: number, ct: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    let combinedFilter: string;
    if (filterCSS === "none") {
      combinedFilter = `brightness(${br}%) contrast(${ct}%)`;
    } else {
      combinedFilter = `${filterCSS} brightness(${br}%) contrast(${ct}%)`;
    }
    ctx.filter = combinedFilter;
    ctx.drawImage(img, 0, 0);
  }, []);

  useEffect(() => {
      if (imgRef.current && history[currentIndex]) {
        const img = new Image();
        img.onload = () => {
          const preset = FILTERS.find(f => f.name === activeFilter);
          renderCanvas(img, preset?.css || "none", brightness, contrast);
        };
        img.src = history[currentIndex];
      }
  }, [activeFilter, brightness, contrast, currentIndex, history, renderCanvas]);

  const handleApply = () => {
    if (!canvasRef.current) return;
    const newSrc = canvasRef.current.toDataURL("image/png");
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newSrc);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
    
    // Reset active modifiers
    setActiveFilter("None");
    setBrightness(100);
    setContrast(100);
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
                options={FILTERS.map(f => ({ label: f.name, value: f.name }))}
                value={activeFilter}
                onChange={(val) => setActiveFilter(val)}
              />
            </div>

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

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
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
                disabled={activeFilter === "None" && brightness === 100 && contrast === 100}
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


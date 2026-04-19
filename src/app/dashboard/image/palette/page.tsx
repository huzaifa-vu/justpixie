"use client";

import { useState, useRef } from "react";
import { UploadCloud, Palette, Copy, Wand2, Check } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import styles from "./palette.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { useEffect } from "react";

export default function ColorPalette() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const { settings } = useSettings();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join('');
  };

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      setIsProcessing(true);
      setSelectedImage(files[0]);
      setImageUrl(URL.createObjectURL(files[0]));
      setPalette([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  useAiHydration(({ files }) => {
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, "/dashboard/image/palette");

  const extractPalette = (img: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Downscale massively for faster processing and clustering
    const MAX_DIM = 100;
    const scale = Math.min(MAX_DIM / img.width, MAX_DIM / img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const colorCounts: Record<string, number> = {};

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 125) continue; // skip transparent

      // Quantize colors to group similar hues
      const bucketSize = 32;
      const rQ = Math.round(r / bucketSize) * bucketSize;
      const gQ = Math.round(g / bucketSize) * bucketSize;
      const bQ = Math.round(b / bucketSize) * bucketSize;

      const hex = rgbToHex(
        Math.min(255, rQ),
        Math.min(255, gQ),
        Math.min(255, bQ)
      );

      colorCounts[hex] = (colorCounts[hex] || 0) + 1;
    }

    const sortedColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    // return top 6 most dominant colors
    setPalette(sortedColors.slice(0, 6));
    setIsProcessing(false);
  };

  useEffect(() => {
    if (palette.length > 0 && settings.autoCopy && !isProcessing) {
      handleCopy(palette[0]);
    }
  }, [palette, settings.autoCopy, isProcessing]);

  const handleImageLoad = (e: any) => {
    extractPalette(e.target);
  };

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <ToolWrapper title="Palette Extractor" description="Analyze pixel data locally to find the dominant color schemes in your photos." icon={Palette}>

      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {!imageUrl ? (
            <DropZone 
              onFilesSelected={handleFiles} 
              accept="image/*"
              title="Locate an image"
              subtitle="JPEG, PNG, WEBP processing runs purely in your browser."
            />
          ) : (
            <div className={styles.viewerContainer}>
              <img src={imageUrl} alt="Target" className={styles.previewImage} onLoad={handleImageLoad} />
            </div>
          )}
          {/* Hidden input removed in favor of DropZone */}
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Wand2 size={20} />
            <h2>Dominant Colors</h2>
          </div>
          <div className={styles.configBody}>

             {isProcessing && <div className={styles.infoBoxWarn}>Analyzing pixels...</div>}

              {palette.length > 0 && (
                <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                   {palette.map((hex, i) => (
                       <div 
                        key={i}
                        className={styles.colorRow}
                        onClick={() => handleCopy(hex)}
                      >
                         <div className={styles.copyOverlay}>
                            <Copy size={16} /> Click to Copy
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className={styles.swatchPreview} style={{ backgroundColor: hex }}></div>
                            <span className={styles.hexCode}>{hex}</span>
                         </div>
                         <div style={{ color: 'var(--text-muted)', position: 'relative', zIndex: 10 }}>
                            {copiedColor === hex ? <Check size={18} color="var(--mint-green)" /> : <Copy size={18} />}
                         </div>
                      </div>
                   ))}
                </div>
              )}

            <button 
              className={styles.resetBtn} 
              onClick={() => {
                setSelectedImage(null);
                setImageUrl(null);
                setPalette([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              style={{ marginTop: 'auto' }}
            >
              Clear Image
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


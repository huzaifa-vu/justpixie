"use client";

import { useEffect, useState, useRef } from "react";
import { Image as ImageIcon, Download, UploadCloud, Square, Check } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import { useRouter } from "next/navigation";
import styles from "../image-tools.module.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Dropdown from "@/components/Dropdown";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
const FAVICON_SIZES = [16, 32, 48, 64, 128, 180, 192, 512];

export default function FaviconGenerator() {
  const router = useRouter();
    const [autoRun, setAutoRun] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([16, 32, 180, 192]);
  const [generatedIcons, setGeneratedIcons] = useState<{ size: number; url: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFile = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      setGeneratedIcons([]);

      const img = new window.Image();
      img.onload = () => { 
        imgRef.current = img; 
        setIsProcessing(false);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const toggleSize = (size: number) => {
    setSelectedSizes(prev =>
      prev.includes(size)
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const handleGenerate = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;

    const icons: { size: number; url: string }[] = [];
    
    for (const size of selectedSizes.sort((a, b) => a - b)) {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      // Determine square crop from center of original
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;

      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

      icons.push({ size, url: canvas.toDataURL("image/png") });
    }

    setGeneratedIcons(icons);
  };

  const handleDownload = (url: string, size: number) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `favicon-${size}x${size}.png`;
    a.click();
  };

  const handleDownloadAll = () => {
    for (const icon of generatedIcons) {
      handleDownload(icon.url, icon.size);
    }
  };
  useAiHydration(({ files, autoExecute }) => {
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/image/favicon");

  useEffect(() => {
    if (autoRun && imageSrc && imgRef.current && !isProcessing) {
      handleGenerate();
      setAutoRun(false);
    }
  }, [autoRun, imageSrc, isProcessing]);

  useEffect(() => {
    if (generatedIcons.length > 0 && settings.autoDownload && !isProcessing) {
      const timer = setTimeout(() => {
        handleDownloadAll();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [generatedIcons, settings.autoDownload, isProcessing]);


  return (
    <ToolWrapper title="Favicon Generator" description="Create perfectly sized favicons from any image for web and mobile apps." icon={Square}>

      <div className={styles.workspace}>
        <div className={styles.canvasArea} style={{ flexDirection: 'column', gap: '1.5rem', padding: '2rem' }}>
          {!imageSrc && (
            <DropZone 
              onFilesSelected={(files) => handleFile(files[0])} 
              accept="image/*"
              title="Upload your source image"
              subtitle="Square images work best but any aspect ratio is supported."
            />
          )}

          {imageSrc && generatedIcons.length === 0 && (
            <div style={{ textAlign: 'center' }}>
              <img src={imageSrc} alt="source" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '12px', border: '2px solid var(--border)' }} />
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Source loaded. Select sizes and generate.</p>
            </div>
          )}

          {generatedIcons.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', alignItems: 'flex-end' }}>
              {generatedIcons.map(icon => (
                <div key={icon.size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: Math.max(icon.size, 32),
                      height: Math.max(icon.size, 32),
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'white',
                      imageRendering: icon.size < 32 ? 'pixelated' : 'auto',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleDownload(icon.url, icon.size)}
                    title="Click to download"
                  >
                    <img src={icon.url} alt={`${icon.size}px`} width={icon.size} height={icon.size} style={{ imageRendering: icon.size <= 32 ? 'pixelated' : 'auto' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{icon.size}×{icon.size}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <h2>Favicon Sizes</h2>
          </div>
          <div className={styles.configBody}>

            <div className={styles.fieldGroup}>
              <span className={styles.label}>Select Output Sizes</span>
              <Dropdown 
                options={FAVICON_SIZES.map(s => ({ label: `${s}×${s} px`, value: s }))} 
                value={selectedSizes} 
                onChange={(val) => setSelectedSizes(val)} 
                multiSelect 
                placeholder="Choose Sizes" 
              />
            </div>

            <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
              {imageSrc ? 'Change Source Image' : 'Upload Image'}
            </button>

            <button className={styles.actionBtn} onClick={handleGenerate} disabled={!imageSrc || selectedSizes.length === 0}>
              <ImageIcon size={18} /> Generate Favicons
            </button>

            {generatedIcons.length > 0 && (
              <button className={styles.actionBtnAlt} onClick={handleDownloadAll}>
                <Download size={18} /> Download All
              </button>
            )}
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}



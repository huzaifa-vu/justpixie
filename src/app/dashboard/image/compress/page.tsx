"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Image as ImageIcon, UploadCloud, SlidersHorizontal, Download, Sparkles, AlertCircle } from "lucide-react";
import imageCompression from "browser-image-compression";
import styles from "./page.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useRouter } from "next/navigation";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";

export default function ImageCompressor() {
  const router = useRouter();
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  
  const [maxSizeKB, setMaxSizeKB] = useState(100);
  const [maxWidthOrHeight, setMaxWidthOrHeight] = useState(1920);
  const [isCompressing, setIsCompressing] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const { settings } = useSettings();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      handleNewFile(files[0]);
    }
  };

  const handleNewFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setOriginalFile(file);
    setOriginalUrl(URL.createObjectURL(file));
    setCompressedFile(null);
    setCompressedUrl(null);
  };

  useAiHydration(({ files, params, autoExecute }) => {
    if (files && files.length > 0) {
      handleNewFile(files[0]);
    }
    if (params?.maxSizeMB) setMaxSizeKB(Number(params.maxSizeMB) * 1024);
    if (params?.maxWidthOrHeight) setMaxWidthOrHeight(Number(params.maxWidthOrHeight));
    
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/image/compress");

  const executeCompression = async () => {
    if (!originalFile) return;
    setIsCompressing(true);
    
    try {
      const options = {
        maxSizeMB: maxSizeKB / 1024,
        maxWidthOrHeight: maxWidthOrHeight,
        useWebWorker: true,
        maxIteration: 20,
      };
      
      const compressed = await imageCompression(originalFile, options);
      setCompressedFile(compressed);
      setCompressedUrl(URL.createObjectURL(compressed));
    } catch (error) {
      console.error("Compression isolated error:", error);
    } finally {
      setIsCompressing(false);
    }
  };

  useEffect(() => {
    if (autoRun && originalFile && !isCompressing) {
      executeCompression();
      setAutoRun(false);
    }
  }, [autoRun, originalFile]);

  useEffect(() => {
    if (compressedUrl && settings.autoDownload && !isCompressing) {
      const timer = setTimeout(() => {
        const link = document.createElement("a");
        link.href = compressedUrl;
        const ext = originalFile?.name.split('.').pop() || "jpg";
        link.download = `pixie-${Date.now()}.${ext}`;
        link.click();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [compressedUrl, settings.autoDownload, isCompressing]);

  const maxPossibleKB = originalFile ? Math.max(10, Math.floor(originalFile.size / 1024) || 10) : 5000;

  const handleKBChange = (valStr: string) => {
    let val = parseInt(valStr);
    if (isNaN(val)) return;
    if (val > maxPossibleKB) val = maxPossibleKB;
    if (val < 10) val = 10;
    setMaxSizeKB(val);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    if (!compressedUrl || !compressedFile) return;
    const a = document.createElement("a");
    a.href = compressedUrl;
    a.download = `compressed_${originalFile?.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={styles.toolContainer}>
      <header className={styles.toolHeader}>
        <div className={styles.titleArea}>
          <button onClick={() => router.back()} style={{ background: "transparent", border: "none", cursor: "pointer" }} className={styles.backBtn} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={20} />
          </button>
          <div className={styles.iconBox}>
            <ImageIcon size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Image Compressor</h1>
            <p className={styles.subtitle}>Magically reduce image sizes without losing quality.</p>
          </div>
        </div>
      </header>

      <div className={styles.mainWorkspace}>
        {/* Left Side: Viewer/Uploader */}
        <div className={styles.previewArea}>
          {!originalFile ? (
            <DropZone 
              onFilesSelected={handleFiles} 
              accept="image/*"
              title="Drop your image here"
              subtitle="Supports JPG, PNG, WebP"
            />
          ) : (
            <div className={styles.viewerContainer}>
              <div className={styles.viewerTop}>
                <span>Original File: {originalFile.name} ({formatBytes(originalFile.size)})</span>
                <button 
                  className={styles.clearBtn} 
                  onClick={() => { setOriginalFile(null); setOriginalUrl(null); setCompressedFile(null); }}
                >
                  Clear File
                </button>
              </div>
              
              <div className={styles.imageComparisonBlock}>
                <div className={styles.imageBox}>
                  {originalUrl && !compressedUrl && (
                    <Image src={originalUrl} alt="Original" layout="fill" objectFit="contain" />
                  )}
                  {originalUrl && compressedUrl && (
                    <div className={styles.comparisonContainer}>
                      <div className={styles.comparisonImage}>
                         <Image src={originalUrl} alt="Original Before" layout="fill" objectFit="contain" />
                         <div className={styles.badgeBefore}>Original ({formatBytes(originalFile!.size)})</div>
                      </div>
                      <div className={styles.afterLayer} style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}>
                         <Image src={compressedUrl} alt="Compressed After" layout="fill" objectFit="contain" />
                         <div className={styles.badgeAfter}>Compressed ({formatBytes(compressedFile!.size)})</div>
                      </div>
                      <div className={styles.sliderThumbLine} style={{ left: `${sliderPos}%` }}>
                         <div className={styles.sliderThumbHandle}>
                            <ArrowLeft size={16} style={{ marginRight: '-4px' }}/>
                            <ArrowRight size={16} />
                         </div>
                      </div>
                      <input 
                         type="range" 
                         min="0" max="100" 
                         value={sliderPos} 
                         onChange={(e) => setSliderPos(Number(e.target.value))}
                         className={styles.invisibleSlider}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Config Panel */}
        <aside className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <SlidersHorizontal size={18} />
            <h2>Configuration</h2>
          </div>

          <div className={styles.configBody}>
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <label>Target Size (KB)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="number"
                    min="10"
                    max={maxPossibleKB}
                    value={maxSizeKB}
                    onChange={(e) => handleKBChange(e.target.value)}
                    onBlur={(e) => {
                       if (parseInt(e.target.value) < 10 || !e.target.value) setMaxSizeKB(10);
                    }}
                    className={styles.kbInput}
                  />
                  <strong>KB</strong>
                </div>
              </div>
              <input 
                type="range" 
                min="10" 
                max={maxPossibleKB} 
                step="10" 
                value={maxSizeKB} 
                onChange={(e) => handleKBChange(e.target.value)} 
                className={styles.rangeSlider}
              />
            </div>

            <div className={styles.controlGroup}>
              <label>Max Width/Height: <strong>{maxWidthOrHeight} px</strong></label>
              <input 
                type="range" 
                min="800" 
                max="4000" 
                step="100" 
                value={maxWidthOrHeight} 
                onChange={(e) => setMaxWidthOrHeight(parseInt(e.target.value))} 
                className={styles.rangeSlider}
              />
            </div>

            <div className={styles.infoBox}>
              <AlertCircle size={16} />
              <p>Pixie will process this directly on your device. Zero data sent to servers.</p>
            </div>
          </div>

          <div className={styles.configFooter}>
            <button 
              className={styles.executeBtn} 
              onClick={executeCompression}
              disabled={!originalFile || isCompressing}
            >
              <Sparkles size={18} />
              {isCompressing ? "Casting Spell..." : "Cast Magic Shrink"}
            </button>
          </div>
        </aside>
      </div>

      {/* Result Area */}
      {compressedFile && (
        <div className={styles.resultArea}>
          <div className={styles.resultDetails}>
            <div className={styles.resultStat}>
              <span className={styles.statLabel}>Original</span>
              <span className={styles.statValue}>{formatBytes(originalFile!.size)}</span>
            </div>
            <div className={styles.resultArrow}>
              <ArrowRight size={20} />
            </div>
            <div className={styles.resultStat}>
              <span className={styles.statLabel}>Compressed</span>
              <span className={styles.statValueHighlight}>{formatBytes(compressedFile.size)}</span>
            </div>
            <div className={styles.resultStat}>
              <span className={styles.statLabel}>Saved</span>
              <span className={styles.statValueHighlightPositive}>
                {Math.round(((originalFile!.size - compressedFile.size) / originalFile!.size) * 100)}%
              </span>
            </div>
          </div>
          
          <button className={styles.downloadBtn} onClick={handleDownload}>
            <Download size={20} />
            Download Result
          </button>
        </div>
      )}
    </div>
  );
}


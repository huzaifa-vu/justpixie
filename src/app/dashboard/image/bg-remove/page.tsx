"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { UploadCloud, ArrowRight, Wand2, RefreshCw, Download, Image as ImageIcon } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import styles from "./page.module.css";
// NOTE: Ensure @imgly/background-removal is installed in package.json
import { removeBackground } from '@imgly/background-removal';
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function BackgroundRemover() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [autoRun, setAutoRun] = useState(false);
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setOriginalUrl(URL.createObjectURL(file));
      setResultUrl(null);
      setProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setOriginalUrl(URL.createObjectURL(file));
      setResultUrl(null);
      setProgress(0);
    }
  };

  useAiHydration(({ files, autoExecute }) => {
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setOriginalUrl(URL.createObjectURL(file));
      setResultUrl(null);
      setProgress(0);
    }
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/image/bg-remove");

  const executeMagicCut = async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      setProgress(10); // Artificial startup progress

      // Running WASM engine entirely in browser
      const imageBlob = await removeBackground(selectedFile, {
        progress: (key, current, total) => {
          // Imgly gives different key stages (fetch, compute, etc.)
          // We can just simulate an overall progress jump for visualization
          setProgress((prev) => Math.min(prev + 15, 95));
        }
      });
      
      setProgress(100);
      const url = URL.createObjectURL(imageBlob);
      setResultUrl(url);

    } catch (error) {
      console.error("Magic Cut Error:", error);
      alert("Failed to extract background. Please try another image.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (autoRun && selectedFile && !isProcessing) {
      executeMagicCut();
      setAutoRun(false);
    }
  }, [autoRun, selectedFile, isProcessing]);

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

  const handleDownload = () => {
    if (!resultUrl || !selectedFile) return;
    
    const link = document.createElement("a");
    link.href = resultUrl;
    link.download = `magic-cut-${selectedFile.name.split('.')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ToolWrapper title="Magic Cut" description="Instant magic cutout tool for any subject." icon={Wand2}>

      <div className={styles.workspace}>
        {/* Main Canvas Area */}
        <div className={styles.previewArea}>
          {!originalUrl ? (
            <DropZone 
              onFilesSelected={handleFiles} 
              accept="image/*"
              title="Drop an image here"
              subtitle="Supports JPG, PNG, WebP"
            />
          ) : (
            <div className={styles.viewerContainer}>
              <div className={styles.viewerTop}>
                <span>{resultUrl ? "Magic Cut Result" : "Target Image"}</span>
                <button 
                  className={styles.clearBtn}
                  onClick={() => {
                    setSelectedFile(null);
                    setOriginalUrl(null);
                    setResultUrl(null);
                  }}
                >
                  Clear Canvas
                </button>
              </div>
              <div className={`${styles.imageBox} ${resultUrl ? styles.checkerBackground : ""}`}>
                <Image
                  src={resultUrl || originalUrl}
                  alt={resultUrl ? "Cutout Result" : "Original"}
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </div>
          )}
          {/* Hidden input removed in favor of DropZone */}
        </div>

        {/* Console / Config Sidebar */}
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <ImageIcon size={20} />
            <h2>Execution Block</h2>
          </div>
          
          <div className={styles.configBody}>
            <div className={styles.infoBox}>
              <strong>Notice:</strong> The first time you remove a background, it may take a few seconds to load the AI model into your browser.
            </div>

            {isProcessing && (
              <div className={styles.progressContainer}>
                <div className={styles.progressLabel}>
                  <span>
                    {progress < 20 && "Initializing AI Engine..."}
                    {progress >= 20 && progress < 50 && "Identifying Subject..."}
                    {progress >= 50 && progress < 80 && "Extracting subject edges..."}
                    {progress >= 80 && progress < 100 && "Polishing cutout..."}
                    {progress === 100 && "Magic Complete!"}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {!resultUrl && (
              <button 
                className={styles.executeBtn}
                onClick={executeMagicCut}
                disabled={!selectedFile || isProcessing}
              >
                {isProcessing ? (
                  <><RefreshCw size={20} className={styles.spin} /> Processing...</>
                ) : (
                  <><Wand2 size={20} /> Remove Background</>
                )}
              </button>
            )}

            {resultUrl && (
              <button 
                className={styles.resetBtn}
                onClick={() => {
                  setResultUrl(null);
                  setProgress(0);
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Result Output Area */}
      {resultUrl && (
        <div className={styles.resultArea}>
          <div className={styles.resultDetails}>
             <div className={styles.resultStat}>
                <span className={styles.statLabel}>Status</span>
                <span className={styles.statValueHighlightPositive}>Isolated</span>
             </div>
             
             <div className={styles.resultPreview}>
                <div className={styles.checkerBackground}>
                   <Image
                     src={resultUrl}
                     alt="Cutout Result"
                     width={80}
                     height={80}
                     style={{ objectFit: 'contain' }}
                   />
                </div>
             </div>
          </div>
          
          <button className={styles.downloadBtn} onClick={handleDownload}>
            <Download size={20} />
            Save as PNG
          </button>
        </div>
      )}
    </ToolWrapper>
  );
}


"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, Image as ImageIcon, Wand2, RefreshCw, Download, FileImage } from "lucide-react";
import Dropdown from "@/components/Dropdown";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import styles from "./page.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function FormatConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetFormat, setTargetFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/webp");
  const [autoRun, setAutoRun] = useState(false);
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setOriginalUrl(URL.createObjectURL(file));
    setResultUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  useAiHydration(({ files, params, autoExecute }) => {
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setOriginalUrl(url);
      setResultUrl(null);
    }
    if (params?.targetFormat) {
      const fmt = params.targetFormat.toLowerCase();
      if (fmt.includes("png")) setTargetFormat("image/png");
      else if (fmt.includes("jpg") || fmt.includes("jpeg")) setTargetFormat("image/jpeg");
      else if (fmt.includes("webp")) setTargetFormat("image/webp");
    }
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/image/format");

  const executeConversion = async () => {
    if (!selectedFile || !originalUrl) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.src = originalUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context failed.");
      
      // If converting to JPEG, ensure white background instead of transparent black
      if (targetFormat === "image/jpeg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          setResultUrl(URL.createObjectURL(blob));
          setIsProcessing(false);
        }
      }, targetFormat, 0.95);
      
    } catch (error) {
      console.error(error);
      alert("Failed to traverse image matrix.");
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (autoRun && selectedFile && originalUrl && !isProcessing) {
      executeConversion();
      setAutoRun(false);
    }
  }, [autoRun, selectedFile, isProcessing, originalUrl, targetFormat]);

  useEffect(() => {
    if (resultUrl && settings.autoDownload && !isProcessing) {
      const timer = setTimeout(() => {
        const link = document.createElement("a");
        link.href = resultUrl;
        link.download = `pixie-${Date.now()}.${getExtension()}`;
        link.click();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [resultUrl, settings.autoDownload, isProcessing]);

  const getExtension = () => {
    if (targetFormat === "image/jpeg") return "jpg";
    if (targetFormat === "image/png") return "png";
    return "webp";
  };

  return (
    <ToolWrapper title="Format Converter" description="Instantly pivot images between standard web and print formats directly using Canvas architecture." icon={FileImage}>

      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {!originalUrl ? (
            <DropZone 
              onFilesSelected={(files) => handleFile(files[0])} 
              accept="image/*"
              title="Select Original Image"
              subtitle="Supports .webp, .jpg, .png"
            />
          ) : (
            <div className={styles.viewerContainer}>
              <div 
                className={styles.imageBox}
                style={{ backgroundImage: `url(${resultUrl || originalUrl})` }}
              />
            </div>
          )}
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Wand2 size={20} />
            <h2>Execution Block</h2>
          </div>
          
          <div className={styles.configBody}>
             <div className={styles.selectorGroup}>
               <label className={styles.inputLabel}>Target Alchemy (Format)</label>
               <Dropdown options={[{ label: "WEBP (Web Optimized)", value: "image/webp" }, { label: "PNG (Lossless Alpha)", value: "image/png" }, { label: "JPEG (Standard Lossy)", value: "image/jpeg" }]} value={targetFormat} onChange={(val) => {
                   setTargetFormat(val);
                   setResultUrl(null); // Force re-render for new format type
                 }} />
             </div>

            {!resultUrl ? (
              <button className={styles.executeBtn} onClick={executeConversion} disabled={!selectedFile || isProcessing}>
                {isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Re-Encoding...</> : <><RefreshCw size={20} /> Switch Format</>}
              </button>
            ) : (
               <div className={styles.resultDetails}>
                 <div className={styles.statLabel}>Transmuted successfully.</div>
                 <a href={resultUrl} download={`converted-${selectedFile?.name.split('.')[0]}.${getExtension()}`} className={styles.downloadBtnLarge}>
                   <Download size={20} /> Download .{getExtension().toUpperCase()}
                 </a>
               </div>
            )}
            
            <button className={styles.resetBtn} onClick={() => { setResultUrl(null); setSelectedFile(null); setOriginalUrl(null); }}>Clear Canvas</button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


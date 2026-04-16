"use client";

import { useEffect, useState, useRef } from "react";
import { RotateCw, FlipHorizontal, FlipVertical, Download, UploadCloud } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import { useRouter } from "next/navigation";
import styles from "../image-tools.module.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { useCallback } from "react";
export default function ImageRotateFlip() {
  const router = useRouter();
    const [autoRun, setAutoRun] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const { settings } = useSettings();
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      
      const img = new Image();
      img.onload = () => { imgRef.current = img; drawCanvas(img, 0, false, false); };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const drawCanvas = useCallback((img: HTMLImageElement, rot: number, fh: boolean, fv: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isRotated = rot === 90 || rot === 270;
    canvas.width = isRotated ? img.height : img.width;
    canvas.height = isRotated ? img.width : img.height;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(fh ? -1 : 1, fv ? -1 : 1);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  }, []);

  const applyRotation = (newRot: number) => {
    const r = (rotation + newRot) % 360;
    setRotation(r);
    if (imgRef.current) drawCanvas(imgRef.current, r, flipH, flipV);
  };

  const toggleFlipH = () => {
    const newFlip = !flipH;
    setFlipH(newFlip);
    if (imgRef.current) drawCanvas(imgRef.current, rotation, newFlip, flipV);
  };

  const toggleFlipV = () => {
    const newFlip = !flipV;
    setFlipV(newFlip);
    if (imgRef.current) drawCanvas(imgRef.current, rotation, flipH, newFlip);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const a = document.createElement("a");
    a.href = canvasRef.current.toDataURL("image/png");
    a.download = `rotated-${Date.now()}.png`;
    a.click();
  };
  useAiHydration(({ files, params, autoExecute }) => {
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    if (params?.rotation) setRotation(Number(params.rotation) % 360);
    if (params?.flipH !== undefined) setFlipH(Boolean(params.flipH));
    if (params?.flipV !== undefined) setFlipV(Boolean(params.flipV));
    
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/image/rotate");

  useEffect(() => {
    if (autoRun && imageSrc && imgRef.current && !isProcessing) {
      // Re-draw once to ensure params are applied
      drawCanvas(imgRef.current, rotation, flipH, flipV);
      setAutoRun(false);
    }
  }, [autoRun, imageSrc, isProcessing, rotation, flipH, flipV, drawCanvas]);

  useEffect(() => {
    if (imageSrc && settings.autoDownload && !isProcessing) {
      // Auto download if we've applied a transformation
      if (rotation !== 0 || flipH || flipV) {
        const timer = setTimeout(() => {
          handleDownload();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [imageSrc, rotation, flipH, flipV, settings.autoDownload]);


  return (
    <ToolWrapper title="Rotate & Flip" description="Rotate or mirror images using the native Canvas API." icon={RotateCw}>

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
            <h2>Transform Controls</h2>
          </div>
          <div className={styles.configBody}>
            <div className={styles.fieldGroup}>
              <span className={styles.label}>Rotate</span>
              <div className={styles.quickActions}>
                <button className={styles.quickBtn} onClick={() => applyRotation(90)}>↻ 90°</button>
                <button className={styles.quickBtn} onClick={() => applyRotation(180)}>↻ 180°</button>
                <button className={styles.quickBtn} onClick={() => applyRotation(270)}>↻ 270°</button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.label}>Flip / Mirror</span>
              <div className={styles.quickActions}>
                <button className={`${styles.quickBtn} ${flipH ? styles.quickBtnActive : ''}`} onClick={toggleFlipH}>
                  <FlipHorizontal size={16} style={{ marginRight: 4, verticalAlign: 'middle' }}/> Horizontal
                </button>
                <button className={`${styles.quickBtn} ${flipV ? styles.quickBtnActive : ''}`} onClick={toggleFlipV}>
                  <FlipVertical size={16} style={{ marginRight: 4, verticalAlign: 'middle' }}/> Vertical
                </button>
              </div>
            </div>

            <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()} style={{ marginTop: '0.5rem' }}>
              Upload New Image
            </button>

            <button className={styles.actionBtn} onClick={handleDownload} disabled={!imageSrc} style={{ marginTop: 'auto' }}>
              <Download size={18} /> Download Result
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}



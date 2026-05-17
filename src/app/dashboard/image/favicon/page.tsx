"use client";

import { useEffect, useState, useRef } from "react";
import { Image as ImageIcon, Download, Square, Check, ClipboardPaste } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import { useRouter } from "next/navigation";
import styles from "../image-tools.module.css";
import Link from "next/link";
import Dropdown from "@/components/Dropdown";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

const FAVICON_SIZES = [16, 32, 48, 64, 128, 180, 192, 512];

const SIZE_METADATA: Record<number, { title: string; desc: string }> = {
  16: { title: "Classic Tab Icon", desc: "For legacy desktop browser tabs" },
  32: { title: "Standard Favicon", desc: "For modern browser address bars and tabs" },
  48: { title: "Desktop Shortcut", desc: "For Windows desktop shortcut icons" },
  64: { title: "High-DPI Shortcut", desc: "For high-resolution desktop screens" },
  128: { title: "Extension Icon", desc: "For Chrome Web Store and extensions" },
  180: { title: "Apple Touch Icon", desc: "For iOS home screen shortcuts" },
  192: { title: "Android Launcher", desc: "For Android Progressive Web Apps" },
  512: { title: "PWA Splash Screen", desc: "For PWA loading splash screens" },
};

// Zero-dependency, client-side, high-performance binary ICO encoder
async function createIcoBlob(canvases: HTMLCanvasElement[]): Promise<Blob> {
  const pngBuffers: ArrayBuffer[] = [];
  
  // Extract raw PNG byte buffers from each canvas
  for (const canvas of canvases) {
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error("Failed to generate PNG blob");
    const buffer = await blob.arrayBuffer();
    pngBuffers.push(buffer);
  }

  const numImages = canvases.length;
  const headerSize = 6;
  const dirSize = 16 * numImages;
  
  // Calculate total compiled ICO file size
  let totalSize = headerSize + dirSize;
  for (const buffer of pngBuffers) {
    totalSize += buffer.byteLength;
  }
  
  const fileBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(fileBuffer);
  const uint8View = new Uint8Array(fileBuffer);
  
  // 1. Write Directory Header (6 bytes)
  view.setUint16(0, 0, true);       // Reserved: 0
  view.setUint16(2, 1, true);       // Type: 1 (ICO)
  view.setUint16(4, numImages, true); // Image count
  
  // 2. Write Directory Entries (16 bytes per image)
  let currentOffset = headerSize + dirSize;
  
  for (let i = 0; i < numImages; i++) {
    const canvas = canvases[i];
    const pngBuffer = pngBuffers[i];
    const size = canvas.width;
    
    // Width and height: 1 byte each (0 if size >= 256)
    view.setUint8(headerSize + i * 16 + 0, size >= 256 ? 0 : size);
    view.setUint8(headerSize + i * 16 + 1, size >= 256 ? 0 : size);
    
    // Color palette count: 1 byte (0 for truecolor/PNG)
    view.setUint8(headerSize + i * 16 + 2, 0);
    
    // Reserved: 1 byte (0)
    view.setUint8(headerSize + i * 16 + 3, 0);
    
    // Color planes: 2 bytes (1)
    view.setUint16(headerSize + i * 16 + 4, 1, true);
    
    // Bits per pixel: 2 bytes (32)
    view.setUint16(headerSize + i * 16 + 6, 32, true);
    
    // Size of image data: 4 bytes
    view.setUint32(headerSize + i * 16 + 8, pngBuffer.byteLength, true);
    
    // Offset of image data from start of file: 4 bytes
    view.setUint32(headerSize + i * 16 + 12, currentOffset, true);
    
    // Write actual raw PNG bytes into file buffer
    uint8View.set(new Uint8Array(pngBuffer), currentOffset);
    currentOffset += pngBuffer.byteLength;
  }
  
  return new Blob([fileBuffer], { type: 'image/x-icon' });
}

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

  const getCanvasForSize = (size: number): HTMLCanvasElement | null => {
    if (!imgRef.current) return null;
    const img = imgRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const minDim = Math.min(img.width, img.height);
    const sx = (img.width - minDim) / 2;
    const sy = (img.height - minDim) / 2;
    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
    return canvas;
  };

  const handleGenerate = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const icons: { size: number; url: string }[] = [];
    
    for (const size of selectedSizes.sort((a, b) => a - b)) {
      const canvas = getCanvasForSize(size);
      if (!canvas) continue;
      icons.push({ size, url: canvas.toDataURL("image/png") });
    }

    setGeneratedIcons(icons);
  };

  const handleDownloadPNG = (size: number) => {
    const canvas = getCanvasForSize(size);
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `favicon-${size}x${size}.png`;
    a.click();
  };

  const handleDownloadICO = async (size: number) => {
    const canvas = getCanvasForSize(size);
    if (!canvas) return;
    try {
      const blob = await createIcoBlob([canvas]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `favicon-${size}x${size}.ico`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Failed to generate individual ICO", err);
    }
  };

  const handleDownloadBundle = async () => {
    // Bundle browser tab/shortcut sizes (16, 32, 48) into standard favicon.ico
    const bundleSizes = [16, 32, 48].filter(s => selectedSizes.includes(s));
    const targetSizes = bundleSizes.length > 0 ? bundleSizes : selectedSizes;
    
    const canvases = targetSizes
      .map(getCanvasForSize)
      .filter((c): c is HTMLCanvasElement => c !== null);
      
    if (canvases.length === 0) return;

    try {
      setIsProcessing(true);
      const blob = await createIcoBlob(canvases);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "favicon.ico";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Failed to generate favicon.ico bundle", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = () => {
    for (const icon of generatedIcons) {
      handleDownloadPNG(icon.size);
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
        handleDownloadBundle();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [generatedIcons, settings.autoDownload, isProcessing]);

  return (
    <ToolWrapper title="Favicon Generator" description="Create perfectly sized multi-resolution favicons from any image for web and mobile apps." icon={Square}>
      <div className={styles.workspace}>
        <div className={styles.canvasArea} style={{ flexDirection: 'column', gap: '1.5rem', padding: '2.5rem', overflowY: 'auto' }}>
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
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontWeight: 600 }}>Source loaded. Select sizes and click Generate.</p>
            </div>
          )}

          {generatedIcons.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', alignItems: 'center' }}>
              {/* Premium Multi-Resolution Bundle Card */}
              <div style={{
                background: 'rgba(167, 243, 208, 0.05)',
                border: '1px solid var(--mint-green)',
                borderRadius: '16px',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '600px',
                boxShadow: '0 8px 30px rgba(167, 243, 208, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>✨</span>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--foreground)' }}>Unified favicon.ico Bundle</h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '1.25rem' }}>
                  Packages 16×16, 32×32, and 48×48 dimensions into a single, multi-resolution <code>.ico</code> file. This is the industry-standard file required for absolute compatibility on all browsers and operating systems.
                </p>
                <button 
                  onClick={handleDownloadBundle}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: 'var(--mint-green)',
                    color: 'var(--deep-charcoal)',
                    border: 'none',
                    borderRadius: '999px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(167, 243, 208, 0.25)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(167, 243, 208, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(167, 243, 208, 0.25)';
                  }}
                >
                  <Download size={16} /> Download favicon.ico Bundle
                </button>
              </div>

              {/* Individual Size Asset List */}
              <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Individual Asset Suite
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {generatedIcons.map(icon => {
                    const meta = SIZE_METADATA[icon.size] || { title: "Custom Icon Size", desc: "Generated asset" };
                    return (
                      <div 
                        key={icon.size}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'var(--pure-white)',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          padding: '0.75rem 1rem',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#f8fafc',
                              overflow: 'hidden'
                            }}
                          >
                            <img src={icon.url} alt={`${icon.size}px`} style={{ width: Math.min(icon.size, 32), height: Math.min(icon.size, 32), imageRendering: icon.size <= 32 ? 'pixelated' : 'auto' }} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--foreground)' }}>{icon.size}×{icon.size} px</span>
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--soft-sage)', padding: '2px 6px', borderRadius: '4px' }}>
                                {meta.title}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{meta.desc}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleDownloadICO(icon.size)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.45rem 0.8rem',
                              background: 'transparent',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'var(--foreground)',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--mint-green)';
                              e.currentTarget.style.background = 'rgba(167, 243, 208, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border)';
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <Download size={12} /> ICO
                          </button>
                          <button
                            onClick={() => handleDownloadPNG(icon.size)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.45rem 0.8rem',
                              background: 'transparent',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'var(--foreground)',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--gentle-lilac)';
                              e.currentTarget.style.background = 'rgba(196, 181, 253, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border)';
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <Download size={12} /> PNG
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
            <input 
              type="file" 
              ref={fileInputRef} 
              className={styles.hiddenInput} 
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              accept="image/*"
            />

            <button className={styles.actionBtn} onClick={handleGenerate} disabled={!imageSrc || selectedSizes.length === 0}>
              <ImageIcon size={18} /> Generate Favicons
            </button>

            {generatedIcons.length > 0 && (
              <button className={styles.actionBtnAlt} onClick={handleDownloadAll}>
                <Download size={18} /> Download All PNGs
              </button>
            )}
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

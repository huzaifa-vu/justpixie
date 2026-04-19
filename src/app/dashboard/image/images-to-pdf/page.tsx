"use client";
import { useState, useRef, useEffect } from "react";
import { UploadCloud, FileText, Wand2, RefreshCw, Download, Image as ImgIcon, Plus } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import styles from "./pdf.module.css";
import { PDFDocument } from 'pdf-lib';
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function ImagesToPDF() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Generate previews
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
    
    return () => {
      newPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const handleFiles = (files: File[]) => {
    setSelectedFiles(files);
    setResultUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  useAiHydration(({ files, autoExecute }) => {
    if (files && files.length > 0) {
      const imgFiles = files.filter(f => f.type.startsWith("image/"));
      if (imgFiles.length > 0) {
        setSelectedFiles(imgFiles);
        setResultUrl(null);
      }
    }
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/image/images-to-pdf");

  useEffect(() => {
    if (autoRun && selectedFiles.length > 0 && !isProcessing) {
      execute();
      setAutoRun(false);
    }
  }, [autoRun, selectedFiles, isProcessing]);

  const execute = async () => {
    if (selectedFiles.length === 0) return;
    setIsProcessing(true);
    try {
      const pdfDoc = await PDFDocument.create();
      for (const file of selectedFiles) {
        const bytes = await file.arrayBuffer();
        let img;
        if (file.type === "image/png") {
          img = await pdfDoc.embedPng(bytes);
        } else {
          img = await pdfDoc.embedJpg(bytes);
        }
        const page = pdfDoc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      const pdfBytes = await pdfDoc.save();
      setResultUrl(URL.createObjectURL(new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })));
    } catch (err) { console.error(err); alert("Failed to create PDF. Only JPG and PNG images are supported."); }
    finally { setIsProcessing(false); }
  };

  useEffect(() => {
    if (resultUrl && settings.autoDownload && !isProcessing) {
      const timer = setTimeout(() => {
        const link = document.createElement("a");
        link.href = resultUrl;
        link.download = `pixie-${Date.now()}.pdf`;
        link.click();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [resultUrl, settings.autoDownload, isProcessing]);

  return (
    <ToolWrapper title="Images to PDF" description="Combine multiple images into a single PDF document." icon={ImgIcon}>
      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {selectedFiles.length === 0 ? (
            <DropZone 
              onFilesSelected={handleFiles} 
              accept="image/jpeg,image/png"
              multiple
              title="Select or Drop multiple images"
              subtitle="JPG and PNG supported"
            />
          ) : (
            <div className={styles.galleryGrid}>
              {previews.map((url, i) => (
                <div key={i} className={styles.thumbnailCard}>
                  <div className={styles.pageNumber}>Page {i + 1}</div>
                  <img src={url} alt={`Page ${i+1}`} className={styles.thumbnailImg} />
                </div>
              ))}
              <div className={styles.addMoreCard} onClick={() => fileInputRef.current?.click()}>
                <Plus size={24} />
                <span>Add More</span>
              </div>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            multiple 
            accept="image/jpeg,image/png"
            onChange={(e) => {
              if (e.target.files) {
                const newFiles = Array.from(e.target.files);
                setSelectedFiles(prev => [...prev, ...newFiles]);
              }
            }}
          />
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><Wand2 size={20} /><h2>Execution Block</h2></div>
          <div className={styles.configBody}>
            <div className={styles.infoBox}>
              <strong>Notice:</strong> Each image becomes one PDF page at its original resolution. 
              {selectedFiles.length > 0 && <div>Selected: {selectedFiles.length} images</div>}
            </div>
            
            {!resultUrl ? (
              <button 
                className={styles.executeBtn} 
                onClick={execute} 
                disabled={selectedFiles.length === 0 || isProcessing}
              >
                {isProcessing ? (
                  <><RefreshCw size={18} className={styles.spin} /> Building PDF...</>
                ) : (
                  <><FileText size={18} /> Generate PDF Document</>
                )}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a href={resultUrl} download={`pixie-combined.pdf`} className={styles.downloadBtnLarge}>
                  <Download size={18} /> Download Document
                </a>
                <button 
                  className={styles.executeBtn} 
                  style={{ background: 'var(--soft-sage)' }}
                  onClick={execute}
                >
                  <RefreshCw size={18} /> Rebuild PDF
                </button>
              </div>
            )}
            
            <button 
              className={styles.resetBtn} 
              onClick={() => { 
                setResultUrl(null); 
                setSelectedFiles([]); 
              }}
            >
              Clear Workspace
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


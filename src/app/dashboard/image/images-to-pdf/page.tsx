"use client";
import { useState, useRef, useEffect } from "react";
import { UploadCloud, FileText, Wand2, RefreshCw, Download, Image as ImgIcon } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import styles from "../compress/page.module.css";
import { PDFDocument } from 'pdf-lib';
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function ImagesToPDF() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          <DropZone 
            onFilesSelected={handleFiles} 
            accept="image/jpeg,image/png"
            multiple
            title={selectedFiles.length > 0 ? `${selectedFiles.length} images selected` : 'Select images'}
            subtitle="JPG and PNG supported"
          />
        </div>
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><Wand2 size={20} /><h2>Execution Block</h2></div>
          <div className={styles.configBody}>
            <div className={styles.infoBox}><strong>Notice:</strong> Each image becomes one PDF page at its original resolution.</div>
            {!resultUrl ? (
              <button className={styles.executeBtn} onClick={execute} disabled={selectedFiles.length === 0 || isProcessing}>
                {isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Building...</> : <><FileText size={20} /> Create PDF</>}
              </button>
            ) : (
              <a href={resultUrl} download={`images-combined.pdf`} className={styles.downloadBtnLarge}><Download size={20} /> Download PDF</a>
            )}
            <button className={styles.resetBtn} onClick={() => { setResultUrl(null); setSelectedFiles([]); }}>Clear</button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


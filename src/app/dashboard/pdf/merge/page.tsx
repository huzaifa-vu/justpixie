"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, FileText, Wand2, RefreshCw, Download, Layers, X } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import styles from "./page.module.css";
// NOTE: Make sure pdf-lib is installed via npm install pdf-lib
import { PDFDocument } from 'pdf-lib';
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function PDFMerger() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [autoRun, setAutoRun] = useState(false);
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: File[]) => {
    const newFiles = files.filter(file => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setResultUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  useAiHydration(({ files, autoExecute }) => {
    if (files && files.length > 0) {
      const pdfFiles = files.filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
      if (pdfFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...pdfFiles]);
      }
    }
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/pdf/merge");

  const executePDFMerge = async () => {
    if (selectedFiles.length < 2) {
      alert("Please upload at least 2 PDFs to merge.");
      return;
    }

    try {
      setIsProcessing(true);
      
      // Initialize an empty PDF
      const mergedPdf = await PDFDocument.create();

      // Loop through and stitch
      for (const file of selectedFiles) {
        const fileBuffer = await file.arrayBuffer();
        const pdfToMerge = await PDFDocument.load(fileBuffer);
        const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfFile = await mergedPdf.save();
      const blob = new Blob([mergedPdfFile.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);

    } catch (error) {
      console.error("PDF Merge Error", error);
      alert("Failed to merge PDFs. One of the documents may be encrypted.");
    } finally {
      setIsProcessing(false);
    }
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

  useEffect(() => {
    if (autoRun && selectedFiles.length >= 2 && !isProcessing) {
      executePDFMerge();
      setAutoRun(false);
    }
  }, [autoRun, selectedFiles, isProcessing]);

  return (
    <ToolWrapper title="Bind Spell (Merge)" description="Stitch multiple PDF documents locally into a single cohesive file." icon={Layers}>

      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          <DropZone 
            onFilesSelected={handleFiles} 
            accept="application/pdf"
            multiple
            title="Drop multiple PDFs here"
            subtitle="Or click to browse securely."
          />
          
          {selectedFiles.length > 0 && (
            <div className={styles.fileListWrapper}>
              <h3 className={styles.listTitle}>Documents queued to stitch ({selectedFiles.length})</h3>
              <ul className={styles.fileList}>
                {selectedFiles.map((f, idx) => (
                  <li key={idx} className={styles.fileItem}>
                    <div className={styles.fileMeta}>
                      <FileText size={16} className={styles.fileIcon} />
                      <span className={styles.fileName}>{f.name}</span>
                    </div>
                    <button className={styles.removeBtn} onClick={() => removeFile(idx)}>
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Wand2 size={20} />
            <h2>Execution Block</h2>
          </div>
          
          <div className={styles.configBody}>
            <div className={styles.infoBox}>
              <strong>Notice:</strong> Order of upload signifies stitching order. Requires bare minimum 2 documents.
            </div>

            {!resultUrl && (
              <button 
                className={styles.executeBtn}
                onClick={executePDFMerge}
                disabled={selectedFiles.length < 2 || isProcessing}
              >
                {isProcessing ? (
                  <><RefreshCw size={20} className={styles.spin} /> Merging...</>
                ) : (
                  <><Layers size={20} /> Cast Bind Spell</>
                )}
              </button>
            )}

            {resultUrl && (
              <a 
                href={resultUrl}
                download={`merged-pixie-${Date.now()}.pdf`}
                className={styles.downloadBtnLarge}
              >
                <Download size={20} />
                Download Merged PDF
              </a>
            )}
            
            <button 
              className={styles.resetBtn}
              onClick={() => {
                setResultUrl(null);
                setSelectedFiles([]);
              }}
            >
              Clear Documents
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


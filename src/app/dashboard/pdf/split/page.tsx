"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, Wand2, RefreshCw, Download, Scissors, X } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "./page.module.css";
import { PDFDocument } from 'pdf-lib';
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";
import { useEffect } from "react";

export default function PDFSplitter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setResultUrl(null);

      try {
        const buffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const pages = pdf.getPageCount();
        setTotalPages(pages);
        setStartPage(1);
        setEndPage(pages);
      } catch {
        alert("Could not read PDF. It may be corrupted.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
      e.target.value = ""; // Clear to allow re-selection
    }
  };

  useAiHydration(({ files, params, autoExecute }) => {
    if (files && files.length > 0) {
      const loadAi = async () => {
        const file = files[0];
        setSelectedFile(file);
        setResultUrl(null);
        try {
          const buffer = await file.arrayBuffer();
          const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
          const pages = pdf.getPageCount();
          setTotalPages(pages);
          
          if (params?.startPage) setStartPage(Math.max(1, Math.min(pages, parseInt(params.startPage))));
          else setStartPage(1);
          
          if (params?.endPage) setEndPage(Math.max(1, Math.min(pages, parseInt(params.endPage))));
          else setEndPage(pages);
          
          if (autoExecute) setAutoRun(true);
        } catch { alert("Could not read PDF."); }
      };
      loadAi();
    }
  }, "/dashboard/pdf/split");

  useEffect(() => {
    if (autoRun && selectedFile && totalPages > 0 && !isProcessing) {
      executeSplit();
      setAutoRun(false);
    }
  }, [autoRun, selectedFile, totalPages, isProcessing]);

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

  const executeSplit = async () => {
    if (!selectedFile || startPage < 1 || endPage > totalPages || startPage > endPage) return;
    setIsProcessing(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const sourcePdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const newPdf = await PDFDocument.create();

      // pdf-lib uses 0-indexed pages
      const indices = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage - 1 + i);
      const copiedPages = await newPdf.copyPages(sourcePdf, indices);
      copiedPages.forEach(page => newPdf.addPage(page));

      const resultBytes = await newPdf.save();
      const blob = new Blob([new Uint8Array(resultBytes)], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob));

    } catch (error) {
      console.error("Split Error:", error);
      alert("Failed to split PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolWrapper title="Split PDF" description="Extract specific page ranges from any PDF document entirely in your browser." icon={Scissors}>

      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          <DropZone 
            onFilesSelected={handleFiles} 
            accept="application/pdf"
            title={selectedFile ? selectedFile.name : "Select a PDF"}
            subtitle={selectedFile ? `${totalPages} pages detected` : "Click or drop to upload"}
          />
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Wand2 size={20} />
            <h2>Execution Block</h2>
          </div>

          <div className={styles.configBody}>
            <div className={styles.infoBox}>
              <strong>Instructions:</strong> Select the start and end page to extract a range into a new PDF.
            </div>

            {totalPages > 0 && (
              <div className={styles.rangeControls}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Start Page</label>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={startPage}
                    onChange={(e) => { setStartPage(Math.max(1, parseInt(e.target.value) || 1)); setResultUrl(null); }}
                    className={styles.numberInput}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>End Page</label>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={endPage}
                    onChange={(e) => { setEndPage(Math.min(totalPages, parseInt(e.target.value) || 1)); setResultUrl(null); }}
                    className={styles.numberInput}
                  />
                </div>
                <div className={styles.rangeHint}>
                  Extracting {endPage - startPage + 1} of {totalPages} pages
                </div>
              </div>
            )}

            {!resultUrl ? (
              <button
                className={styles.executeBtn}
                onClick={executeSplit}
                disabled={!selectedFile || isProcessing || totalPages === 0}
              >
                {isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Slicing...</> : <><Scissors size={20} /> Extract Range</>}
              </button>
            ) : (
              <a
                href={resultUrl}
                download={`split-p${startPage}-p${endPage}-${selectedFile?.name}`}
                className={styles.downloadBtnLarge}
              >
                <Download size={20} />
                Download Extracted PDF
              </a>
            )}

            <button
              className={styles.resetBtn}
              onClick={() => { setResultUrl(null); setSelectedFile(null); setTotalPages(0); }}
            >
              Clear Document
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, FileText, Wand2, RefreshCw, Download, Minimize2 } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "./page.module.css";
import { PDFDocument } from 'pdf-lib';
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";

export default function PDFCompressor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setOriginalSize(file.size);
      setResultUrl(null);
      setCompressedSize(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
      e.target.value = ""; // Clear to allow re-selection
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  useAiHydration(({ files, autoExecute }) => {
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setOriginalSize(file.size);
      setResultUrl(null);
      setCompressedSize(0);
    }
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/pdf/compress");

  useEffect(() => {
    if (autoRun && selectedFile && !isProcessing) {
      executeCompression();
      setAutoRun(false);
    }
  }, [autoRun, selectedFile, isProcessing]);

  const executeCompression = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      // Strip metadata to reduce size
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('Pixie Compressor');
      pdfDoc.setCreator('Pixie');

      // Serialize with object stream compaction
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      const blob = new Blob([new Uint8Array(compressedBytes)], { type: 'application/pdf' });
      setCompressedSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));

    } catch (error) {
      console.error("PDF Compression Error:", error);
      alert("Failed to compress PDF. The file may be encrypted or corrupted.");
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

  const savings = originalSize > 0 && compressedSize > 0
    ? Math.round((1 - compressedSize / originalSize) * 100)
    : 0;

  return (
    <ToolWrapper title="Compress PDF" description="Squeeze metadata and compact object streams to reduce PDF weight locally." icon={Minimize2}>

      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          <DropZone 
            onFilesSelected={handleFiles} 
            accept="application/pdf"
            title={selectedFile ? selectedFile.name : "Select a PDF file"}
            subtitle={selectedFile ? formatSize(originalSize) : "Click or drop to upload"}
          />
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Wand2 size={20} />
            <h2>Execution Block</h2>
          </div>

          <div className={styles.configBody}>
            <div className={styles.infoBox}>
              <strong>Method:</strong> Object stream compaction + metadata stripping. Zero visual quality loss.
            </div>

            {resultUrl && (
              <div className={styles.statsCard}>
                <div className={styles.statRow}>
                  <span>Original</span>
                  <span>{formatSize(originalSize)}</span>
                </div>
                <div className={styles.statRow}>
                  <span>Compressed</span>
                  <span className={styles.highlight}>{formatSize(compressedSize)}</span>
                </div>
                <div className={styles.statRow}>
                  <span>Saved</span>
                  <span className={savings > 0 ? styles.positive : styles.neutral}>
                    {savings > 0 ? `${savings}%` : "Minimal (already compact)"}
                  </span>
                </div>
              </div>
            )}

            {!resultUrl ? (
              <button
                className={styles.executeBtn}
                onClick={executeCompression}
                disabled={!selectedFile || isProcessing}
              >
                {isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Compacting...</> : <><Minimize2 size={20} /> Compress PDF</>}
              </button>
            ) : (
              <a
                href={resultUrl}
                download={`compressed-${selectedFile?.name}`}
                className={styles.downloadBtnLarge}
              >
                <Download size={20} />
                Download Compressed
              </a>
            )}

            <button
              className={styles.resetBtn}
              onClick={() => { setResultUrl(null); setSelectedFile(null); setOriginalSize(0); setCompressedSize(0); }}
            >
              Clear Document
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


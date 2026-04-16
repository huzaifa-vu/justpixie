"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, FileText, Wand2, RefreshCw, Download, Lock, Eye, EyeOff } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "./page.module.css";
import { PDFDocument } from 'pdf-lib';
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";

export default function PDFLock() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [authorName, setAuthorName] = useState("Pixie User");
  const [stripMeta, setStripMeta] = useState(true);
  const [autoRun, setAutoRun] = useState(false);
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setResultUrl(null);
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
      setSelectedFile(files[0]);
      setResultUrl(null);
    }
    if (params?.authorName) setAuthorName(params.authorName);
    if (params?.stripMeta !== undefined) setStripMeta(params.stripMeta === "true");
    
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/pdf/lock");

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
    if (autoRun && selectedFile && !isProcessing) {
      executeLock();
      setAutoRun(false);
    }
  }, [autoRun, selectedFile, isProcessing]);

  const executeLock = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      if (stripMeta) {
        // Wipe all identifying metadata
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);
        pdfDoc.setCreator('');
        pdfDoc.setProducer('');
      }

      // Stamp new author
      if (authorName.trim()) {
        pdfDoc.setAuthor(authorName);
      }

      pdfDoc.setProducer('Pixie Lock');
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());

      const resultBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([new Uint8Array(resultBytes)], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob));

    } catch (error) {
      console.error("Lock Error:", error);
      alert("Failed to process PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolWrapper title="Lock & Sanitize" description="Strip hidden metadata, sanitize authorship, and compact your PDF for safe distribution." icon={Lock}>

      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          <DropZone 
            onFilesSelected={handleFiles} 
            accept="application/pdf"
            title={selectedFile ? selectedFile.name : "Select a PDF"}
            subtitle={selectedFile ? "Ready for sanitization" : "Click or drop to upload"}
          />
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Wand2 size={20} />
            <h2>Execution Block</h2>
          </div>

          <div className={styles.configBody}>
            <div className={styles.infoBox}>
              <strong>About:</strong> Strips identifying metadata (author, creator, producer, keywords) from your PDF. Useful before sharing files publicly.
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.label}>Custom Author</span>
              <input 
                type="text" 
                value={authorName} 
                onChange={(e) => { setAuthorName(e.target.value); setResultUrl(null); }} 
                className={styles.textInput} 
              />
            </div>
            
            <div className={styles.fieldGroup} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={styles.label}>Strip All Metadata</span>
              <button 
                onClick={() => { setStripMeta(!stripMeta); setResultUrl(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: stripMeta ? 'var(--mint-green)' : 'var(--text-muted)' }}
              >
                {stripMeta ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            </div>

            {!resultUrl ? (
              <button
                className={styles.executeBtn}
                onClick={executeLock}
                disabled={!selectedFile || isProcessing}
              >
                {isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Sanitizing...</> : <><Lock size={20} /> Lock & Sanitize</>}
              </button>
            ) : (
              <div className={styles.resultDetails}>
                <div className={styles.statLabel}>Sanitized Successfully.</div>
                <a
                  href={resultUrl}
                  download={`locked-${selectedFile?.name}`}
                  className={styles.downloadBtnLarge}
                >
                  <Download size={20} />
                  Download Secured PDF
                </a>
              </div>
            )}

            <button
              className={styles.resetBtn}
              onClick={() => { setResultUrl(null); setSelectedFile(null); }}
            >
              Clear Document
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


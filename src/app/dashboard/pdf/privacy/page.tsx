"use client";

import { useState, useRef, useEffect } from "react";
import { 
  UploadCloud, FileText, Wand2, RefreshCw, Download, ShieldCheck, 
  Eye, EyeOff, Scissors, Layers, Info, ToggleLeft, ToggleRight 
} from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "./page.module.css";
import { PDFDocument } from 'pdf-lib';
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";

export default function PDFPrivacy() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [authorName, setAuthorName] = useState("Pixie User");
  const [stripMeta, setStripMeta] = useState(true);
  const [flatten, setFlatten] = useState(false);
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
      executeSanitize();
      setAutoRun(false);
    }
  }, [autoRun, selectedFile, isProcessing]);

  const executeSanitize = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    try {
      // Dynamic import to fix DOMMatrix SSR error
      const { version, GlobalWorkerOptions, getDocument } = await import("pdfjs-dist");
      GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const buffer = await selectedFile.arrayBuffer();
      let finalBytes: Uint8Array;

      if (flatten) {
        // FLATTEN LOGIC: Render to images and back to PDF
        const pdf = await getDocument({ data: buffer }).promise;
        const outPdf = await PDFDocument.create();

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 }); // High res
          
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (context) {
            await page.render({ canvasContext: context, viewport, canvas }).promise;
            const imgData = canvas.toDataURL("image/jpeg", 0.9);
            const imgBytes = await fetch(imgData).then(res => res.arrayBuffer());
            const embeddedImg = await outPdf.embedJpg(imgBytes);
            const outPage = outPdf.addPage([viewport.width, viewport.height]);
            outPage.drawImage(embeddedImg, { x: 0, y: 0, width: viewport.width, height: viewport.height });
          }
        }
        
        finalBytes = await outPdf.save();
      } else {
        // QUICK SANITIZE (Metadata Only)
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        if (stripMeta) {
          pdfDoc.setTitle('');
          pdfDoc.setAuthor('');
          pdfDoc.setSubject('');
          pdfDoc.setKeywords([]);
          pdfDoc.setCreator('');
          pdfDoc.setProducer('');
        }
        if (authorName.trim()) pdfDoc.setAuthor(authorName);
        pdfDoc.setProducer('Pixie Privacy');
        pdfDoc.setCreationDate(new Date());
        pdfDoc.setModificationDate(new Date());
        finalBytes = await pdfDoc.save({ useObjectStreams: true });
      }

      const blob = new Blob([finalBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob));

    } catch (error) {
      console.error("Sanitize Error:", error);
      alert("Failed to process PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolWrapper title="Privacy & Metadata Scrub" description="Wipe identity data and optionally flatten content to prevent text selection and automated scraping." icon={ShieldCheck}>
      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          <DropZone 
            onFilesSelected={handleFiles} 
            accept="application/pdf"
            title={selectedFile ? selectedFile.name : "Select a Source PDF"}
            subtitle={selectedFile ? "Ready for privacy scrubbing" : "Click or drop to upload"}
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
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Scissors size={14} className={styles.iconDim} />
                  <span className={styles.label}>Scrub Metadata</span>
                  <div className={styles.tooltipIcon} title="Removes hidden Author, Creator, and metadata tags from the PDF structure.">
                     <Info size={12} />
                  </div>
               </div>
               <button 
                onClick={() => { setStripMeta(!stripMeta); setResultUrl(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: stripMeta ? 'var(--mint-green)' : 'var(--text-muted)' }}
              >
                {stripMeta ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>

            <div className={styles.fieldGroup} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={14} className={styles.iconDim} />
                  <span className={styles.label}>Flatten Document</span>
                  <div className={styles.tooltipIcon} title="Converts pages into images to prevent text selection and make tampering extremely difficult.">
                     <Info size={12} />
                  </div>
               </div>
               <button 
                onClick={() => { setFlatten(!flatten); setResultUrl(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: flatten ? 'var(--mint-green)' : 'var(--text-muted)' }}
              >
                {flatten ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>

            {!resultUrl ? (
              <button
                className={styles.executeBtn}
                onClick={executeSanitize}
                disabled={!selectedFile || isProcessing}
              >
                {isProcessing ? <><RefreshCw size={18} className={styles.spin} /> Processing...</> : <><ShieldCheck size={18} /> Apply Privacy Scrub</>}
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


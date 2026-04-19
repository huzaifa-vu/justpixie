"use client";
import { useState, useRef, useEffect } from "react";
import { UploadCloud, RefreshCw, Image as ImgIcon, Download, Wand2, FileText, CheckCircle } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "./pdf-images.module.css";
import { PDFDocument } from 'pdf-lib';
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";
import JSZip from "jszip";

export default function PDFToImages() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [info, setInfo] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [autoRun, setAutoRun] = useState(false);
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setInfo("");
      setResultUrl(null);
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
      setThumbnailUrl(null);

      try {
        const buf = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
        setPageCount(pdfDoc.getPageCount());

        // Generate Thumbnail for first page
        const { version, GlobalWorkerOptions, getDocument } = await import("pdfjs-dist");
        GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        
        const loadingTask = getDocument(buf);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport }).promise;
          canvas.toBlob((blob) => {
            if (blob) setThumbnailUrl(URL.createObjectURL(blob));
          }, "image/jpeg", 0.7);
        }
      } catch (err) { 
        console.error(err);
        setPageCount(0); 
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
      e.target.value = ""; // Clear to allow re-selection
    }
  };

  useAiHydration(({ files, autoExecute }) => {
    if (files && files.length > 0) {
      const loadAi = async () => {
        const file = files[0]; setSelectedFile(file); setInfo("");
        try {
          const buf = await file.arrayBuffer();
          const pdf = await PDFDocument.load(buf, { ignoreEncryption: true });
          setPageCount(pdf.getPageCount());
          if (autoExecute) setAutoRun(true);
        } catch { setPageCount(0); }
      };
      loadAi();
    }
  }, "/dashboard/pdf/pdf-to-images");

  useEffect(() => {
    if (autoRun && selectedFile && pageCount > 0 && !isProcessing) {
      execute();
      setAutoRun(false);
    }
  }, [autoRun, selectedFile, pageCount, isProcessing]);

  const execute = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setInfo("Initializing browser PDF engine...");

    try {
      // Dynamically import pdf.js strictly on the client to avoid Next.js SSR crashes
      const { version, GlobalWorkerOptions, getDocument } = await import('pdfjs-dist');
      GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const buf = await selectedFile.arrayBuffer();
      const loadingTask = getDocument(buf);
      const pdf = await loadingTask.promise;
      
      const totalPages = pdf.numPages;
      const zip = new JSZip();

      for (let i = 1; i <= totalPages; i++) {
        setInfo(`Rasterizing page ${i} of ${totalPages}...`);
        
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas 2D context not supported.");
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
        if (blob) zip.file(`Pixie_Page_${i}.png`, blob);
      }

      setInfo(`Zipping ${totalPages} high-res images...`);
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      setResultUrl(url);
      
      if (settings.autoDownload) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedFile.name.replace(/\.pdf$/i, '')}_Images.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      setInfo(`✨ Successfully extracted ${totalPages} images!`);
      
    } catch (err: any) { 
      console.error(err); 
      setInfo(`Rendering failed: ${err.message || 'Unknown error'}`);
    } finally { 
      setIsProcessing(false); 
    }
  };

  const resetAll = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    setSelectedFile(null);
    setPageCount(0);
    setInfo("");
    setResultUrl(null);
    setThumbnailUrl(null);
  };

  return (
    <ToolWrapper title="PDF to Images (ZIP)" description="Extract all pages from a PDF document as high-res PNG image files entirely offline." icon={ImgIcon}>
      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {selectedFile ? (
            <div className={styles.thumbnailContainer}>
               {thumbnailUrl ? (
                 <img src={thumbnailUrl} className={styles.thumbnail} alt="PDF Preview" />
               ) : (
                 <div className={styles.thumbnail} style={{ width: 300, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222' }}>
                    <RefreshCw size={40} className={styles.spin} style={{ color: '#444' }} />
                 </div>
               )}
               <div className={styles.thumbnailBadge}>{pageCount} Pages Loaded</div>
            </div>
          ) : (
            <DropZone 
              onFilesSelected={handleFiles} 
              accept="application/pdf"
              title="Select a PDF"
              subtitle="All pages will be converted to high-res PNGs"
            />
          )}
        </div>
        
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><Download size={20} /><h2>Export Manager</h2></div>
          <div className={styles.configBody}>
            <div className={styles.infoBox}>
              <strong>About:</strong> This tool rasterizes every page of your PDF at 2x resolution and packages them into a ZIP archive.
            </div>

            {isProcessing && (
               <div className={styles.statusCard}>
                  <RefreshCw size={18} className={styles.spin} style={{ color: 'var(--pixie-teal)' }} />
                  <div className={styles.statusInfo}>
                     <div className={styles.statusTitle}>Current State</div>
                     <div className={styles.statusText}>{info}</div>
                  </div>
               </div>
            )}

            {resultUrl && (
               <div className={styles.statusCard} style={{ background: 'var(--soft-sage)', borderColor: 'var(--mint-green)' }}>
                  <CheckCircle size={18} style={{ color: 'var(--mint-green)' }} />
                  <div className={styles.statusInfo}>
                     <div className={styles.statusTitle}>Export Ready</div>
                     <div className={styles.statusText}>ZIP Archive Generated</div>
                  </div>
               </div>
            )}
            
            {!resultUrl ? (
              <button className={styles.executeBtn} onClick={execute} disabled={!selectedFile || isProcessing}>
                {isProcessing ? <><RefreshCw size={18} className={styles.spin} /> Working...</> : <><ImgIcon size={18} /> Extract to .ZIP</>}
              </button>
            ) : (
              <a 
                href={resultUrl} 
                download={`${selectedFile?.name.replace(/\.pdf$/i, '')}_Images.zip`}
                className={styles.downloadBtnLarge}
              >
                <Download size={20} /> Download ZIP
              </a>
            )}

            <button className={styles.resetBtn} onClick={resetAll}>Clear Selection</button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


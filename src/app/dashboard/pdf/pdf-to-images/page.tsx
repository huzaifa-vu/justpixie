"use client";
import { useState, useRef, useEffect } from "react";
import { UploadCloud, RefreshCw, Image as ImgIcon, Download } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../compress/page.module.css";
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
  const [autoRun, setAutoRun] = useState(false);
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setInfo("");
      try {
        const buf = await file.arrayBuffer();
        const pdf = await PDFDocument.load(buf, { ignoreEncryption: true });
        setPageCount(pdf.getPageCount());
      } catch { setPageCount(0); }
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
      const pdfjsLib = await import('pdfjs-dist');
      
      // Point the worker natively to Cloudflare CDN to perfectly bypass Webpack hurdles
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const buf = await selectedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument(buf);
      const pdf = await loadingTask.promise;
      
      const totalPages = pdf.numPages;
      const zip = new JSZip();

      for (let i = 1; i <= totalPages; i++) {
        setInfo(`Rasterizing page ${i} of ${totalPages}...`);
        
        const page = await pdf.getPage(i);
        // Scale 2.0 provides fantastic 2x retina display rasterization quality without destroying memory
        const viewport = page.getViewport({ scale: 2.0 });

        // Spin up a headless canvas inside memory
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas 2D context not supported.");
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // @ts-ignore - Third-party type definitions mismatch but physical execution succeeds
        await page.render({ canvasContext: context, viewport: viewport }).promise;

        // Convert the rendered canvas into a standard PNG blob
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
        
        if (blob) {
          zip.file(`Pixie_Page_${i}.png`, blob);
        }
      }

      setInfo(`Zipping ${totalPages} high-res images...`);
      const zipBlob = await zip.generateAsync({ type: "blob" });
      
      // Natively trigger the file download in the browser
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedFile.name.replace(/\.pdf$/i, '')}_Images.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setInfo(`✨ Successfully extracted ${totalPages} images!`);
      
    } catch (err: any) { 
      console.error(err); 
      setInfo(`Rendering failed: ${err.message || 'Unknown error'}`);
    } finally { 
      setIsProcessing(false); 
    }
  };

  return (
    <ToolWrapper title="PDF to Images (ZIP)" description="Extract all pages from a PDF document as high-res PNG image files entirely offline." icon={ImgIcon}>
      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          <DropZone 
            onFilesSelected={handleFiles} 
            accept="application/pdf"
            title={selectedFile ? selectedFile.name : 'Select a PDF'}
            subtitle={pageCount > 0 ? `${pageCount} pages detected` : 'Click or drop to upload'}
          />
        </div>
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><Download size={20} /><h2>Export Manager</h2></div>
          <div className={styles.configBody}>
            {info && <div className={styles.infoBox}>{info}</div>}
            
            <button className={styles.executeBtn} onClick={execute} disabled={!selectedFile || isProcessing}>
              {isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Processing...</> : <><Download size={20} /> Extract to .ZIP</>}
            </button>
            <button className={styles.resetBtn} onClick={() => { setSelectedFile(null); setPageCount(0); setInfo(""); }}>Clear Selection</button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


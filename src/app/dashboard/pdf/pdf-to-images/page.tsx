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

interface PageItem {
  pageNum: number;
  thumbUrl: string;
  selected: boolean;
}

export default function PDFToImages() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [info, setInfo] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [autoRun, setAutoRun] = useState(false);
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setInfo("Reading document catalog...");
      setResultUrl(null);
      
      // Cleanup previous blobs
      pages.forEach(p => URL.revokeObjectURL(p.thumbUrl));
      setPages([]);

      try {
        const buf = await file.arrayBuffer();
        const { version, GlobalWorkerOptions, getDocument } = await import("pdfjs-dist");
        GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        
        const loadingTask = getDocument(buf.slice(0)); // Use slice to prevent detaching if needed
        const pdf = await loadingTask.promise;
        const total = pdf.numPages;
        
        const newPages: PageItem[] = [];
        
        // Staggered rendering to keep UI smooth
        for (let i = 1; i <= total; i++) {
          setInfo(`Rendering preview ${i} of ${total}...`);
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.4 }); // Small preview scale
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          
          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport, canvas }).promise;
            
            const thumbBlob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/jpeg", 0.6));
            if (thumbBlob) {
              newPages.push({
                pageNum: i,
                thumbUrl: URL.createObjectURL(thumbBlob),
                selected: true
              });
              // Update state incrementally for better feedback
              setPages([...newPages]);
            }
          }
        }
        setInfo("");
      } catch (err) { 
        console.error(err);
        setInfo("Failed to render previews.");
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
      handleFiles(files);
      if (autoExecute) {
        setAutoRun(true);
      }
    }
  }, "/dashboard/pdf/pdf-to-images");

  useEffect(() => {
    if (autoRun && selectedFile && pages.length > 0 && !isProcessing) {
      execute();
      setAutoRun(false);
    }
  }, [autoRun, selectedFile, pages.length, isProcessing]);

  const togglePage = (idx: number) => {
    const next = [...pages];
    next[idx].selected = !next[idx].selected;
    setPages(next);
    setResultUrl(null);
  };

  const setAllSelections = (selected: boolean) => {
    setPages(pages.map(p => ({ ...p, selected })));
    setResultUrl(null);
  };

  const downloadSinglePage = async (pageNum: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selectedFile) return;
    setIsProcessing(true);
    setInfo(`Rasterizing page ${pageNum}...`);

    try {
      const { version, GlobalWorkerOptions, getDocument } = await import("pdfjs-dist");
      GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const buffer = await selectedFile.arrayBuffer();
      const pdf = await getDocument(buffer).promise;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;

      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/png"));
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedFile.name.replace(/\.pdf$/i, '')}_Page_${pageNum}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
      setInfo("");
    }
  };

  const execute = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setInfo("Initializing browser PDF engine...");

    const selectedItems = pages.filter(p => p.selected);
    if (selectedItems.length === 0) return;

    setIsProcessing(true);
    setInfo(`Starting export for ${selectedItems.length} items...`);

    try {
      const { version, GlobalWorkerOptions, getDocument } = await import('pdfjs-dist');
      GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const buf = await selectedFile.arrayBuffer();
      const loadingTask = getDocument(buf);
      const pdf = await loadingTask.promise;
      
      if (selectedItems.length === 1) {
        // SINGLE PAGE EXPORT -> Direct PNG
        const targetPage = selectedItems[0].pageNum;
        setInfo(`Rasterizing single page (${targetPage})...`);
        const page = await pdf.getPage(targetPage);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/png"));
          if (blob) {
             const url = URL.createObjectURL(blob);
             setResultUrl(url);
             if (settings.autoDownload) {
                const a = document.createElement("a");
                a.href = url;
                a.download = `${selectedFile.name.replace(/\.pdf$/i, '')}_Page_${targetPage}.png`;
                a.click();
             }
          }
        }
      } else {
        // MULTI PAGE EXPORT -> ZIP
        const zip = new JSZip();
        for (const item of selectedItems) {
          setInfo(`Rasterizing page ${item.pageNum} of ${selectedItems.length}...`);
          const page = await pdf.getPage(item.pageNum);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) continue;
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport: viewport, canvas }).promise;

          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
          if (blob) zip.file(`Pixie_Page_${item.pageNum}.png`, blob);
        }

        setInfo(`Zipping ${selectedItems.length} images...`);
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        setResultUrl(url);
        
        if (settings.autoDownload) {
          const a = document.createElement("a");
          a.href = url;
          a.download = `${selectedFile.name.replace(/\.pdf$/i, '')}_Images.zip`;
          a.click();
        }
      }
      
      setInfo(`✨ Successfully extracted ${selectedItems.length} item(s)!`);
      
    } catch (err: any) { 
      console.error(err); 
      setInfo(`Extraction failed: ${err.message || 'Unknown error'}`);
    } finally { 
      setIsProcessing(false); 
    }
  };

  const resetAll = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    pages.forEach(p => URL.revokeObjectURL(p.thumbUrl));
    setSelectedFile(null);
    setPages([]);
    setInfo("");
    setResultUrl(null);
  };

  const selectedCount = pages.filter(p => p.selected).length;

  return (
    <ToolWrapper title="PDF to Images (ZIP)" description="Extract specific pages or all content as high-res PNG image files entirely offline." icon={ImgIcon}>
      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {selectedFile ? (
            <div className={styles.galleryGrid}>
               {pages.map((page, idx) => (
                 <div 
                  key={idx} 
                  className={`${styles.pageCard} ${page.selected ? styles.selected : ''}`}
                  onClick={() => togglePage(idx)}
                >
                    <div className={styles.thumbnailWrapper}>
                       <img src={page.thumbUrl} className={styles.thumbnailImage} alt={`Page ${page.pageNum}`} />
                       <div className={styles.selectionCircle}>
                          {page.selected ? <CheckCircle size={14} /> : null}
                       </div>
                       <div className={styles.pageNumberBadge}>P. {page.pageNum}</div>
                       
                       <div className={styles.actionOverlay}>
                          <button 
                            className={styles.miniActionBtn} 
                            onClick={(e) => downloadSinglePage(page.pageNum, e)}
                            title="Download this page instantly"
                          >
                            <Download size={18} />
                          </button>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          ) : (
            <DropZone 
              onFilesSelected={handleFiles} 
              accept="application/pdf"
              title="Select a PDF"
              subtitle="All pages will be rendered as visual thumbnails"
            />
          )}
        </div>
        
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><Download size={20} /><h2>Export Manager</h2></div>
          <div className={styles.configBody}>
            <div className={styles.infoBox}>
              <strong>Gallery Mode:</strong> Toggle checkboxes to select pages. Click "Extract" to generate a {selectedCount > 1 ? 'ZIP' : 'PNG'}.
            </div>

            {pages.length > 0 && (
              <div className={styles.selectionControls}>
                <button className={styles.selectionBtn} onClick={() => setAllSelections(true)}>Select All</button>
                <button className={styles.selectionBtn} onClick={() => setAllSelections(false)}>Deselect All</button>
              </div>
            )}

            {isProcessing && (
               <div className={styles.statusCard}>
                  <RefreshCw size={18} className={styles.spin} style={{ color: 'var(--pixie-teal)' }} />
                  <div className={styles.statusInfo}>
                     <div className={styles.statusTitle}>Processing</div>
                     <div className={styles.statusText}>{info}</div>
                  </div>
               </div>
            )}

            {resultUrl && (
               <div className={styles.statusCard} style={{ background: 'var(--soft-sage)', borderColor: 'var(--mint-green)' }}>
                  <CheckCircle size={18} style={{ color: 'var(--mint-green)' }} />
                  <div className={styles.statusInfo}>
                     <div className={styles.statusTitle}>Export Ready</div>
                     <div className={styles.statusText}>{selectedCount} Item(s) Prepared</div>
                  </div>
               </div>
            )}
            
            {!resultUrl ? (
              <button className={styles.executeBtn} onClick={execute} disabled={!selectedFile || isProcessing || selectedCount === 0}>
                {isProcessing ? <><RefreshCw size={18} className={styles.spin} /> Working...</> : <><ImgIcon size={18} /> {selectedCount > 1 ? `Extract ${selectedCount} to .ZIP` : selectedCount === 1 ? 'Extract to PNG' : 'Select Pages'}</>}
              </button>
            ) : (
              <a 
                href={resultUrl} 
                download={selectedCount > 1 ? `${selectedFile?.name.replace(/\.pdf$/i, '')}_Export.zip` : `${selectedFile?.name.replace(/\.pdf$/i, '')}_Page.png`}
                className={styles.downloadBtnLarge}
              >
                <Download size={20} /> Download {selectedCount > 1 ? 'ZIP' : 'Image'}
              </a>
            )}

            <button className={styles.resetBtn} onClick={resetAll}>Clear Selection</button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


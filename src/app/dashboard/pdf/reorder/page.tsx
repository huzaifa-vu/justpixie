"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, RefreshCw, Wand2, Download, ListOrdered, Trash2, ArrowUp, ArrowDown, Info, CheckCircle } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import { PDFDocument } from 'pdf-lib';
import styles from "../pdf-pro.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

interface PdfPage {
  id: string;
  index: number; // Original index
}

export default function ReorderPdf() {
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPdf = async (file: File) => {
    setSelectedPdf(file);
    setIsProcessing(true);
    setStatus("Loading document architecture...");
    
    // Clear old thumbnails
    Object.values(thumbnails).forEach(url => URL.revokeObjectURL(url));
    setThumbnails({});
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuffer);
      setPdfDoc(doc);
      
      const pageCount = doc.getPageCount();
      const initialPages = Array.from({ length: pageCount }).map((_, i) => ({
        id: `page-${Math.random().toString(36).substr(2, 9)}`,
        index: i
      }));
      setPages(initialPages);

      // Start thumbnail generation
      generateThumbnails(arrayBuffer, pageCount);
    } catch (err) {
      console.error(err);
      setStatus("Failed to load PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const generateThumbnails = async (buffer: ArrayBuffer, count: number) => {
    try {
      const { GlobalWorkerOptions, getDocument } = await import("pdfjs-dist");
      GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      
      const loadingTask = getDocument({ data: buffer });
      const pdf = await loadingTask.promise;

      for (let i = 0; i < count; i++) {
        setStatus(`Rendering page ${i + 1} of ${count}...`);
        const page = await pdf.getPage(i + 1);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/jpeg", 0.7));
          if (blob) {
            const url = URL.createObjectURL(blob);
            setThumbnails(prev => ({ ...prev, [i]: url }));
          }
        }
      }
      setStatus("Gallery ready.");
    } catch (err) {
      console.error("Thumbnail error:", err);
    }
  };

  const movePage = (currentIndex: number, direction: 'up' | 'down') => {
    const newPages = [...pages];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= newPages.length) return;
    
    const temp = newPages[currentIndex];
    newPages[currentIndex] = newPages[targetIndex];
    newPages[targetIndex] = temp;
    
    setPages(newPages);
    setResultUrl(null);
  };

  const handleDeletePage = (id: string) => {
    if (pages.length <= 1) return;
    setPages(pages.filter(p => p.id !== id));
    setResultUrl(null);
  };

  const executeReorder = async () => {
    if (!pdfDoc || !selectedPdf) return;
    setIsProcessing(true);
    setStatus("Building new PDF structure...");
    try {
      const newDoc = await PDFDocument.create();
      const indices = pages.map(p => p.index);
      const copiedPages = await newDoc.copyPages(pdfDoc, indices);
      copiedPages.forEach(page => newDoc.addPage(page));
      
      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStatus("Done!");

      if (settings.autoDownload) {
        const link = document.createElement("a");
        link.href = url;
        link.download = `reordered-${selectedPdf.name}`;
        link.click();
      }
    } catch (err) {
      console.error(err);
      setStatus("Export failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    Object.values(thumbnails).forEach(url => URL.revokeObjectURL(url));
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setSelectedPdf(null);
    setPdfDoc(null);
    setPages([]);
    setThumbnails({});
    setStatus("");
  };

  useAiHydration(({ files }) => {
    if (files && files.length > 0) {
      const pdfFile = files.find(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
      if (pdfFile) loadPdf(pdfFile);
    }
  }, "/dashboard/pdf/reorder");

  return (
    <ToolWrapper title="Reorder PDF Gallery" description="Visually organize, duplicate, or remove pages with a professional gallery interface." icon={ListOrdered}>
      <div className={styles.workspace}>
        <div className={styles.previewArea} style={{ flex: 1, padding: '2rem', display: 'block', overflowY: 'auto' }}>
          {!selectedPdf ? (
            <div style={{ maxWidth: '600px', margin: '4rem auto' }}>
              <DropZone 
                onFilesSelected={(files) => loadPdf(files[0])} 
                accept="application/pdf"
                title="Select PDF Document"
                subtitle="High-fidelity thumbnails will be generated for every page"
              />
            </div>
          ) : (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                 <div>
                    <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>Document Gallery</h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Drag cards or use arrows for rapid organization.</p>
                 </div>
                 <div className={styles.thumbnailBadge}>{pages.length} Pages</div>
              </div>

              <div className={styles.pageGrid}>
                {pages.map((page, screenIndex) => (
                  <div 
                    key={page.id} 
                    className={styles.pageCard}
                    style={{ cursor: 'default' }}
                  >
                    {thumbnails[page.index] ? (
                      <img src={thumbnails[page.index]} className={styles.pageThumb} alt={`Page ${page.index + 1}`} />
                    ) : (
                      <div className={styles.pageThumb} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <RefreshCw size={24} className={styles.spin} style={{ opacity: 0.2 }} />
                      </div>
                    )}

                    <div className={styles.cardFooter}>
                      <div className={styles.cardInfo}>
                         <span className={styles.cardLabel}>Position {screenIndex + 1}</span>
                         <span className={styles.cardIndex}>Original: {page.index + 1}</span>
                      </div>
                      <div className={styles.cardActions}>
                         <button className={styles.cardBtn} onClick={() => movePage(screenIndex, 'up')} disabled={screenIndex === 0} title="Move Up">
                            <ArrowUp size={16} />
                         </button>
                         <button className={styles.cardBtn} onClick={() => movePage(screenIndex, 'down')} disabled={screenIndex === pages.length - 1} title="Move Down">
                            <ArrowDown size={16} />
                         </button>
                         <button className={`${styles.cardBtn} ${styles.cardBtnDanger}`} onClick={() => handleDeletePage(page.id)} title="Remove Page">
                            <Trash2 size={16} />
                         </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <ListOrdered size={20} />
            <h2>Studio Manager</h2>
          </div>
          <div className={styles.configBody}>
            <div className={styles.infoBox}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--mint-green)', fontWeight: 700 }}>
                 <Info size={14} />
                 <span>Organize Efficiently</span>
              </div>
              Drag-and-drop cards to change order, or use the arrows for precise control. Click 'Build New PDF' to finalize your document structure.
            </div>

            {status && (
              <div className={styles.statusCard}>
                <RefreshCw size={18} className={status === "Done!" ? "" : styles.spin} style={{ color: 'var(--mint-green)' }} />
                <div className={styles.statusInfo}>
                  <div className={styles.statusTitle}>Studio Status</div>
                  <div className={styles.statusText}>{status}</div>
                </div>
              </div>
            )}

            {resultUrl && (
              <div className={styles.statusCard}>
                <CheckCircle size={18} style={{ color: 'var(--mint-green)' }} />
                <div className={styles.statusInfo}>
                  <div className={styles.statusTitle}>Structure Finalized</div>
                  <div className={styles.statusText}>Ready to Download</div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {!resultUrl ? (
                <button 
                  className={styles.executeBtn} 
                  onClick={executeReorder} 
                  disabled={!selectedPdf || isProcessing || pages.length === 0}
                >
                  {isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Processing...</> : <><Wand2 size={20} /> Build New PDF</>}
                </button>
              ) : (
                <a 
                  href={resultUrl} 
                  download={`reordered-${selectedPdf?.name}`} 
                  className={styles.downloadBtnLarge}
                >
                  <Download size={20} /> Download PDF
                </a>
              )}

              <button className={styles.resetBtn} onClick={resetAll}>
                <Trash2 size={16} /> Clear Workspace
              </button>
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

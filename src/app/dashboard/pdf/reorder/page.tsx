"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, RefreshCw, Wand2, Download, ListOrdered, GripVertical, Trash2 } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import { Reorder } from "framer-motion";
import { PDFDocument } from 'pdf-lib';
import styles from "../../dev/dev.module.css"; // Reuse general workspace layout or we can use local styles
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function ReorderPdf() {
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [pages, setPages] = useState<{ id: string, index: number }[]>([]);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPdf = async (file: File) => {
    setSelectedPdf(file);
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuffer);
      setPdfDoc(doc);
      
      const pageCount = doc.getPageCount();
      const initialPages = Array.from({ length: pageCount }).map((_, i) => ({
        id: `page-${i}`,
        index: i
      }));
      setPages(initialPages);
    } catch (err) {
      console.error(err);
      alert("Failed to load PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadPdf(e.target.files[0]);
    }
  };

  useAiHydration(({ files }) => {
    if (files && files.length > 0) {
      const pdfFile = files.find(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
      if (pdfFile) loadPdf(pdfFile);
    }
  }, "/dashboard/pdf/reorder");

  const executeReorder = async () => {
    if (!pdfDoc || !selectedPdf) return;
    setIsProcessing(true);
    try {
      const newDoc = await PDFDocument.create();
      
      const indices = pages.map(p => p.index);
      const copiedPages = await newDoc.copyPages(pdfDoc, indices);
      
      copiedPages.forEach(page => newDoc.addPage(page));
      
      const pdfBytes = await newDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
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

  const handleDeletePage = (id: string) => {
    if (pages.length <= 1) return;
    setPages(pages.filter(p => p.id !== id));
  };

  return (
    <ToolWrapper title="Reorder PDF" description="Visually drag-and-drop pages to change their order, or delete unwanted pages before exporting." icon={ListOrdered}>

      <div className={styles.workspace}>
        <div className={styles.editorArea} style={{ flex: 1 }}>
          {!selectedPdf ? (
            <DropZone 
              onFilesSelected={(files) => loadPdf(files[0])} 
              accept="application/pdf"
              title="Load a PDF Document"
              subtitle="Analyzed entirely in your browser"
            />
          ) : (
            <div style={{ background: 'var(--surface-card)', padding: '2rem', borderRadius: 'var(--radius-bento)', border: '1px solid var(--border)', flex: 1, overflowY: 'auto' }}>
               <h3 style={{ color: 'var(--foreground)', marginBottom: '1rem' }}>Pages ({pages.length})</h3>
               <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.875rem' }}>Drag by the grip handle to reorder.</p>
               
               <Reorder.Group axis="y" values={pages} onReorder={setPages} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 {pages.map((page, screenIndex) => (
                    <Reorder.Item 
                      key={page.id} 
                      value={page}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        background: 'var(--background)', 
                        padding: '1rem', 
                        borderRadius: 'var(--radius-inner)', 
                        border: '1px solid var(--border)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                      }}
                    >
                      <GripVertical size={20} style={{ color: 'var(--text-muted)', cursor: 'grab', marginRight: '1rem' }} />
                      <div style={{ flex: 1, display: 'flex', gap: '2rem' }}>
                         <span style={{ fontWeight: 'bold' }}>New Pos: {screenIndex + 1}</span>
                         <span style={{ color: 'var(--text-muted)' }}>Original Page: {page.index + 1}</span>
                      </div>
                      <button 
                        onClick={() => handleDeletePage(page.id)}
                        style={{ background: 'none', color: '#fca5a5', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                      >
                         <Trash2 size={18} />
                      </button>
                    </Reorder.Item>
                 ))}
               </Reorder.Group>
            </div>
          )}
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="application/pdf" onChange={handleFileChange} />
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Wand2 size={20} />
            <h2>Export Options</h2>
          </div>
          <div className={styles.configBody}>

            {!resultUrl ? (
               <button 
                 className={styles.actionBtnAlt} 
                 onClick={executeReorder} 
                 disabled={!selectedPdf || isProcessing}
                 style={{ background: 'var(--gentle-lilac)' }}
               >
                 {isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Processing...</> : <><ListOrdered size={20} /> Build New PDF</>}
               </button>
            ) : (
               <a 
                 href={resultUrl} 
                 download={`reordered-${selectedPdf?.name}`} 
                 className={styles.actionBtnAlt}
                 style={{ backgroundColor: 'var(--mint-green)', textDecoration: 'none' }}
               >
                 <Download size={20} /> Download PDF
               </a>
            )}

            <button 
              className={styles.copyBtn} 
              onClick={() => {
                setResultUrl(null);
                setSelectedPdf(null);
                setPdfDoc(null);
                setPages([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              style={{ marginTop: 'auto' }}
            >
              Clear Workspace
            </button>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


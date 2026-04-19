"use client";

import { useState, useRef, useEffect, MouseEvent } from "react";
import { UploadCloud, PenTool, Download, Settings2, Undo2 } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import styles from "./annotate.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { Eraser, Trash2, Plus, RotateCcw, RotateCw, RefreshCcw } from "lucide-react";

export default function ImageAnnotator() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [color, setColor] = useState<string>("#be123c");
  const [lineWidth, setLineWidth] = useState<number>(8);
  const [isEraser, setIsEraser] = useState(false);
  const { settings } = useSettings();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<any[][]>([]); 
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const currentPath = useRef<{x: number, y: number}[]>([]); 
  const [paths, setPaths] = useState<any[]>([]); 

  useAiHydration(({ files }) => {
    if (files && files.length > 0) {
      setSelectedImage(files[0]);
      setImageUrl(URL.createObjectURL(files[0]));
      setPaths([]);
      setHistory([]);
      setCurrentIndex(-1);
    }
  }, "/dashboard/image/annotate");

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    paths.forEach(p => {
       ctx.beginPath();
       ctx.globalCompositeOperation = p.mode === 'eraser' ? 'destination-out' : 'source-over';
       ctx.strokeStyle = p.color;
       ctx.lineWidth = p.width;
       ctx.lineCap = "round";
       ctx.lineJoin = "round";
       for (let i = 0; i < p.points.length; i++) {
         const pt = p.points[i];
         if (i === 0) ctx.moveTo(pt.x, pt.y);
         else ctx.lineTo(pt.x, pt.y);
       }
       ctx.stroke();
    });
    
    ctx.globalCompositeOperation = 'source-over';
  }, [paths]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
     imageRef.current = e.currentTarget;
     if (canvasRef.current) {
        const MAX_W = 800;
        const img = e.currentTarget;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        
        if (w > MAX_W) {
          const ratio = MAX_W / w;
          w = MAX_W;
          h = h * ratio;
        }
        
        canvasRef.current.width = w;
        canvasRef.current.height = h;
        
        setPaths([]);
        setHistory([]);
        setCurrentIndex(-1);
     }
  };

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const pos = getCanvasCoordinates(e.clientX, e.clientY);
    currentPath.current = [pos];
  };

  useEffect(() => {
    const handleMouseMove = (e: any) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

      if (!isDrawing || !canvasRef.current) return;
      
      const pos = getCanvasCoordinates(e.clientX, e.clientY);
      currentPath.current.push(pos);
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      const lastPos = currentPath.current[currentPath.current.length - 2];
      ctx.beginPath();
      ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    };

    const handleMouseUp = () => {
      if (!isDrawing) return;
      setIsDrawing(false);
      if (currentPath.current.length > 0) {
        const newPaths = [...paths, { color, width: lineWidth, points: [...currentPath.current], mode: isEraser ? 'eraser' : 'brush' }];
        setPaths(newPaths);
        
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newPaths);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
      }
      currentPath.current = [];
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDrawing, paths, color, lineWidth, isEraser, history, currentIndex]);

  const undo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setPaths(history[currentIndex - 1]);
    } else if (currentIndex === 0) {
       setCurrentIndex(-1);
       setPaths([]);
    }
  };

  const redo = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setPaths(history[currentIndex + 1]);
    }
  };

  const resetAll = () => {
    setCurrentIndex(-1);
    setPaths([]);
    setHistory([]);
  };

  const handleFiles = (files: File[]) => {
    if (files[0]) {
      setSelectedImage(files[0]);
      setImageUrl(URL.createObjectURL(files[0]));
      setPaths([]);
      setHistory([]);
      setCurrentIndex(-1);
    }
  };

  const handleSave = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasRef.current.width;
    tempCanvas.height = canvasRef.current.height;
    const tctx = tempCanvas.getContext('2d');
    if (!tctx) return;

    tctx.drawImage(imageRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
    tctx.drawImage(canvasRef.current, 0, 0);

    const url = tempCanvas.toDataURL('image/png');
    setResultUrl(url);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `annotated-${Date.now()}.png`;
    a.click();
  };

  useEffect(() => {
    if (resultUrl && settings.autoDownload) {
      const a = document.createElement("a");
      a.href = resultUrl;
      a.download = `pixie-${Date.now()}.png`;
      a.click();
    }
  }, [resultUrl, settings.autoDownload]);

  return (
    <ToolWrapper title="Image Annotator" description="Draw shapes, lines, and highlight imagery using the browser canvas directly." icon={PenTool}>

      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {imageUrl && (
            <div className={styles.historyBar}>
               <button className={styles.historyBtn} onClick={undo} disabled={currentIndex < 0} title="Undo">
                  <RotateCcw size={16} />
               </button>
               <button className={styles.historyBtn} onClick={redo} disabled={currentIndex >= history.length - 1} title="Redo">
                  <RotateCw size={16} />
               </button>
               <div style={{ width: '1px', background: 'var(--border)', height: '20px', margin: '0 0.25rem' }} />
               <button className={styles.historyBtn} onClick={resetAll} title="Reset All">
                  <RefreshCcw size={16} />
               </button>
            </div>
          )}

          {!imageUrl ? (
            <DropZone 
              onFilesSelected={handleFiles} 
              accept="image/*"
              title="Locate a source image"
            />
          ) : (
            <div className={styles.canvasContainer} ref={containerRef}>
               <div 
                  className={styles.ghostCursor}
                  style={{ 
                    left: cursorPos.x, 
                    top: cursorPos.y, 
                    width: lineWidth + 'px', 
                    height: lineWidth + 'px',
                    borderColor: isEraser ? 'rgba(255,255,255,0.8)' : color,
                    backgroundColor: isEraser ? 'transparent' : 'rgba(0,0,0,0.1)',
                    visibility: (cursorPos.x < 0 || cursorPos.y < 0) ? 'hidden' : 'visible'
                  }}
               />

               <div className={styles.canvasWrapper} style={{ width: canvasRef.current?.width, height: canvasRef.current?.height }}>
                  <img src={imageUrl} alt="Ref" className={styles.baseImage} onLoad={handleImageLoad} />
                  <canvas 
                    ref={canvasRef} 
                    onMouseDown={startDrawing}
                    className={styles.canvas}
                  />
               </div>
            </div>
          )}
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><Settings2 size={20} /><h2>Canvas Studio</h2></div>
          <div className={styles.configBody}>

            {/* Brush Settings */}
            <div className={styles.categoryHeader}>
              <PenTool size={14} />
              <span className={styles.categoryTitle}>Brush Settings</span>
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.label}>Ink Color</span>
              <div className={styles.colorGrid}>
                {['#000000', '#ffffff', '#be123c', '#047857', '#1d4ed8', '#fbbf24', '#e879f9', '#a7f3d0'].map(c => (
                   <div 
                     key={c}
                     onClick={() => { setColor(c); setIsEraser(false); }}
                     className={`${styles.swatch} ${color === c && !isEraser ? styles.swatchActive : ""}`}
                     style={{ backgroundColor: c }}
                   />
                ))}
                
                <div 
                  className={`${styles.swatch} ${styles.customSwatch} ${!isEraser && !['#000000', '#ffffff', '#be123c', '#047857', '#1d4ed8', '#fbbf24', '#e879f9', '#a7f3d0'].includes(color) ? styles.swatchActive : ""}`}
                  style={{ backgroundColor: color, position: 'relative' }}
                >
                  <Plus size={18} onClick={() => colorInputRef.current?.click()} />
                  <input 
                    type="color" 
                    ref={colorInputRef} 
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', display: 'block' }}
                    value={color}
                    onChange={(e) => { setColor(e.target.value); setIsEraser(false); }}
                  />
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup} style={{ marginTop: '0.5rem' }}>
              <div className={styles.rangeLabel}>
                <span className={styles.label}>Stroke Weight</span>
                <span className={styles.rangeValue}>{lineWidth}px</span>
              </div>
              <input 
                type="range" 
                min="1" max="50" 
                value={lineWidth}
                onChange={e => setLineWidth(Number(e.target.value))}
                className={styles.rangeInput}
              />
            </div>

            {/* Tools */}
            <div className={styles.categoryHeader} style={{ marginTop: '0.5rem' }}>
              <Settings2 size={14} />
              <span className={styles.categoryTitle}>Tools</span>
            </div>

            <div className={styles.toolGrid}>
               <button 
                className={`${styles.toolBtn} ${!isEraser ? styles.toolBtnActive : ""}`}
                onClick={() => setIsEraser(false)}
               >
                 <PenTool size={16} /> Brush
               </button>
               <button 
                className={`${styles.toolBtn} ${isEraser ? styles.toolBtnActive : ""}`}
                onClick={() => setIsEraser(true)}
               >
                 <Eraser size={16} /> Eraser
               </button>
            </div>



            {/* Export */}
            <div className={styles.categoryHeader} style={{ marginTop: 'auto' }}>
              <Download size={14} />
              <span className={styles.categoryTitle}>Finalize</span>
            </div>

            <button className={styles.executeBtn} onClick={handleSave} disabled={!imageUrl}>
              <Download size={20} /> Export Annotation
            </button>

            <button className={styles.resetBtn} onClick={() => { 
                setSelectedImage(null); setImageUrl(null); setPaths([]); setResultUrl(null);
                if(fileInputRef.current) fileInputRef.current.value = '';
            }}>
              <Trash2 size={18} /> Clear Workspace
            </button>

            <input 
              type="file" 
              ref={fileInputRef} 
              className={styles.hiddenInput} 
              onChange={(e) => e.target.files?.[0] && handleFileChange(e as any)} 
              accept="image/*"
            />

          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


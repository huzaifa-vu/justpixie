"use client";

import { useState, useRef, useEffect, MouseEvent } from "react";
import { UploadCloud, PenTool, Download, Settings2, Undo2 } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import styles from "./annotate.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { Eraser, Trash2, Plus } from "lucide-react";

export default function ImageAnnotator() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [color, setColor] = useState<string>("#be123c");
  const [lineWidth, setLineWidth] = useState<number>(8);
  const [isEraser, setIsEraser] = useState(false);
  const { settings } = useSettings();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<any[]>([]); // To support undo (simple version)
  const currentPath = useRef<{x: number, y: number}[]>([]); 

  useAiHydration(({ files }) => {
    if (files && files.length > 0) {
      setSelectedImage(files[0]);
      setImageUrl(URL.createObjectURL(files[0]));
      setPaths([]);
    }
  }, "/dashboard/image/annotate");

  useEffect(() => {
    if (!imageUrl || !canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear and redraw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    
    // Redraw all saved paths
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
    
    // Reset composite for next drawing
    ctx.globalCompositeOperation = 'source-over';

  }, [imageUrl, paths]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
     imageRef.current = e.currentTarget;
     if (canvasRef.current) {
        // scale to fit reasonable drawing bounds
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
        
        // initial draw handled by useEffect
        setPaths([]); // trigger effect
     }
  };

  const getCanvasCoordinates = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const pos = getCanvasCoordinates(e);
    currentPath.current = [pos];
  };

  const draw = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const pos = getCanvasCoordinates(e);
    currentPath.current.push(pos);
    
    // render immediate line snippet
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
    ctx.globalCompositeOperation = 'source-over'; // Reset immediately
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.current.length > 0) {
      setPaths([...paths, { color, width: lineWidth, points: [...currentPath.current], mode: isEraser ? 'eraser' : 'brush' }]);
    }
  };

  const handleUndo = () => {
    setPaths(paths.slice(0, -1));
  };

  const handleFiles = (files: File[]) => {
    if (files[0]) {
      setSelectedImage(files[0]);
      setImageUrl(URL.createObjectURL(files[0]));
      setPaths([]);
    }
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    setResultUrl(url);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `pixie-${Date.now()}.png`;
    a.click();
  };

  useEffect(() => {
    // If we have a result URL and auto-download is ON, trigger download
    // Note: In annotate, resultUrl is usually only set when handleSave is called manually
    // but this infrastructure keeps it consistent with other tools.
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
          {!imageUrl ? (
            <DropZone 
              onFilesSelected={handleFiles} 
              accept="image/*"
              title="Locate a source image"
            />
          ) : (
            <div className={styles.canvasContainer}>
               <img src={imageUrl} alt="Ref" onLoad={handleImageLoad} style={{ display: 'none' }} />
               <canvas 
                 ref={canvasRef} 
                 onMouseDown={startDrawing}
                 onMouseMove={draw}
                 onMouseUp={stopDrawing}
                 onMouseLeave={stopDrawing}
                 className={styles.canvas}
               />
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
                
                {/* Custom Color Swatch */}
                <div 
                  className={`${styles.swatch} ${styles.customSwatch} ${!isEraser && !['#000000', '#ffffff', '#be123c', '#047857', '#1d4ed8', '#fbbf24', '#e879f9', '#a7f3d0'].includes(color) ? styles.swatchActive : ""}`}
                  onClick={() => { colorInputRef.current?.click(); setIsEraser(false); }}
                  style={{ backgroundColor: color }}
                >
                  <Plus size={18} />
                  <input 
                    type="color" 
                    ref={colorInputRef} 
                    className={styles.hiddenInput} 
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
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

            <button className={styles.resetBtn} onClick={handleUndo} disabled={paths.length === 0} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Undo2 size={18} /> Undo Stroke
            </button>

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


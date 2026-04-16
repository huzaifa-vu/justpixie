"use client";

import { useState, useRef, useEffect, MouseEvent } from "react";
import { UploadCloud, PenTool, Download, Settings2, Undo2 } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import styles from "../format/page.module.css";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function ImageAnnotator() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [color, setColor] = useState<string>("#be123c");
  const [lineWidth, setLineWidth] = useState<number>(4);
  const { settings } = useSettings();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.current.length > 0) {
      setPaths([...paths, { color, width: lineWidth, points: [...currentPath.current] }]);
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
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--deep-charcoal)', padding: '2rem', overflow: 'auto' }}>
               <img src={imageUrl} alt="Ref" onLoad={handleImageLoad} style={{ display: 'none' }} />
               <canvas 
                 ref={canvasRef} 
                 onMouseDown={startDrawing}
                 onMouseMove={draw}
                 onMouseUp={stopDrawing}
                 onMouseLeave={stopDrawing}
                 style={{ 
                   cursor: 'crosshair', 
                   maxWidth: '100%', 
                   maxHeight: '70vh',
                   objectFit: 'contain',
                   boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                   backgroundColor: 'white' // default solid bg
                 }}
               />
            </div>
          )}
          {/* Hidden input removed in favor of DropZone */}
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><Settings2 size={20} /><h2>Brushes</h2></div>
          <div className={styles.configBody}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Ink Color</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                {['#000000', '#ffffff', '#be123c', '#047857', '#1d4ed8', '#fbbf24', '#e879f9', '#a7f3d0'].map(c => (
                   <div 
                     key={c}
                     onClick={() => setColor(c)}
                     style={{ 
                       height: '32px', 
                       backgroundColor: c, 
                       borderRadius: '4px', 
                       cursor: 'pointer',
                       border: color === c ? '2px solid var(--mint-green)' : '1px solid rgba(0,0,0,0.2)'
                     }}
                   />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Stroke Weight ({lineWidth}px)</span>
              <input 
                type="range" 
                min="1" max="20" 
                value={lineWidth}
                onChange={e => setLineWidth(Number(e.target.value))}
                style={{ accentColor: 'var(--mint-green)' }}
              />
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button className={styles.resetBtn} onClick={handleUndo} disabled={paths.length === 0} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Undo2 size={18} /> Undo Stroke
              </button>
              
              <button className={styles.executeBtn} onClick={handleSave} disabled={!imageUrl} style={{ background: 'var(--coral-pink)' }}>
                <Download size={20} /> Export Annotation
              </button>
            </div>

            <button className={styles.resetBtn} onClick={() => { 
                setSelectedImage(null); setImageUrl(null); setPaths([]); setResultUrl(null);
                if(fileInputRef.current) fileInputRef.current.value = '';
            }} style={{ marginTop: 'auto' }}>Clear Workspace</button>

          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


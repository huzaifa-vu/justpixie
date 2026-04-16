"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, Image as ImageIcon, RefreshCw, Settings2, Download } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../audio/page.module.css";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";
import JSZip from "jszip";

export default function VideoScreenshots() {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<{name: string, url: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [intervalSec, setIntervalSec] = useState("5");
  const [autoRun, setAutoRun] = useState(false);
  const { settings } = useSettings();

  const ffmpegRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      setSelectedVideo(files[0]);
      setVideoUrl(URL.createObjectURL(files[0]));
      setScreenshots([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      ffmpegRef.current = new FFmpeg();
      ffmpegRef.current.on('progress', ({ progress }: any) => { setProgress(Math.round(progress * 100)); });
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      try {
        await ffmpegRef.current.load({ 
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'), 
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm') 
        });
        setIsReady(true);
      } catch (err) { console.warn(err); }
    };
    const toBlobURL = async (url: string, type: string) => { const r = await fetch(url); const b = await r.arrayBuffer(); return URL.createObjectURL(new Blob([b], { type })); };
    load();
  }, []);

  useAiHydration(({ files, params, autoExecute }) => {
    if (files && files.length > 0) {
      handleFiles(files);
    }
    if (params?.interval) setIntervalSec(String(params.interval));
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/video/screenshots");

  useEffect(() => {
    if (autoRun && selectedVideo && isReady && !isProcessing) {
      execute();
      setAutoRun(false);
    }
  }, [autoRun, selectedVideo, isReady, isProcessing]);

  const execute = async () => {
    if (!selectedVideo || !isReady) return; 
    setIsProcessing(true); 
    setProgress(0);
    setScreenshots([]);
    
    try {
      const ffmpeg = ffmpegRef.current;
      await ffmpeg.writeFile('input.mp4', await fetchFile(selectedVideo));
      
      const rate = 1 / parseFloat(intervalSec);
      await ffmpeg.exec(['-i', 'input.mp4', '-vf', `fps=${rate}`, 'thumb%04d.png']);
      
      // Look for files starting with 'thumb'
      const dirList = await ffmpeg.listDir('/');
      const generatedFiles = dirList.filter((f: any) => f.name.startsWith('thumb') && f.name.endsWith('.png'));
      
      const newScreenshots = [];
      for (const file of generatedFiles) {
         const data = await ffmpeg.readFile(file.name);
         const url = URL.createObjectURL(new Blob([new Uint8Array(data as ArrayBuffer).buffer], { type: 'image/png' }));
         newScreenshots.push({ name: file.name, url });
      }
      
      setScreenshots(newScreenshots);
    } catch (e) { 
      console.error(e); 
      alert("Extraction failed."); 
    } finally { 
      setIsProcessing(false); 
      setProgress(100); 
    }
  };

  useEffect(() => {
    if (screenshots.length > 0 && settings.autoDownload && !isProcessing) {
      const timer = setTimeout(() => {
        downloadAll();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [screenshots, settings.autoDownload, isProcessing]);

  const downloadAll = async () => {
    if (screenshots.length === 0) return;
    const zip = new JSZip();
    
    for (const [i, s] of screenshots.entries()) {
      const response = await fetch(s.url);
      const blob = await response.blob();
      zip.file(`${selectedVideo?.name}-frame-${i + 1}.png`, blob);
    }
    
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedVideo?.name}_Screenshots.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ToolWrapper title="Video to Screenshots" description="Extract highly accurate PNG frames from videos at a specified time interval natively." icon={ImageIcon}>
      
      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {!videoUrl ? (
            <DropZone 
              onFilesSelected={handleFiles} 
              accept="video/*"
              title="Locate a source video"
              subtitle=".mp4, .mov, .webm"
            />
          ) : (
            <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
               {screenshots.length === 0 ? (
                 <video src={videoUrl} style={{ width: '100%', borderRadius: 'var(--radius-inner)' }} controls />
               ) : (
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                    {screenshots.map(s => (
                       <div key={s.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                         <img src={s.url} alt={s.name} style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border)' }} />
                         <a href={s.url} download={`${selectedVideo?.name}-${s.name}`} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gentle-lilac)', textDecoration: 'none', textAlign: 'center' }}>
                            <Download size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/>SAVE
                         </a>
                       </div>
                    ))}
                 </div>
               )}
            </div>
          )}
          {/* Hidden input removed in favor of DropZone */}
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><Settings2 size={20} /><h2>Settings</h2></div>
          <div className={styles.configBody}>
            {!isReady ? <div className={styles.infoBoxWarn}><strong>Loading FFmpeg...</strong></div> : <div className={styles.infoBox}><strong>Engine Ready</strong> WebAssembly initialized.</div>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Capture Every X Seconds</span>
               <input 
                 type="number" 
                 value={intervalSec} 
                 onChange={e => setIntervalSec(e.target.value)} 
                 style={{ padding: '0.75rem', borderRadius: 'var(--radius-inner)', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '1.25rem' }} 
                 min="0.1"
               />
            </div>
            
            {isProcessing && (
              <div className={styles.progressContainer}>
                <div className={styles.progressLabel}><span>Extracting...</span><span>{progress}%</span></div>
                <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>
              </div>
            )}

            {!screenshots.length ? (
              <button className={styles.executeBtn} onClick={execute} disabled={!selectedVideo || isProcessing || !isReady}>
                {isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Parsing Frames...</> : <><ImageIcon size={20} /> Extract Frames</>}
              </button>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                  <span className={styles.statLabel}>
                    Extracted {screenshots.length} distinct frames
                  </span>
                  <button className={styles.executeBtn} onClick={downloadAll}>
                    <Download size={20} /> Download All (ZIP)
                  </button>
                </div>
            )}
            
            <button className={styles.resetBtn} onClick={() => { 
              setScreenshots([]); setSelectedVideo(null); setVideoUrl(null); setProgress(0); 
              if (fileInputRef.current) fileInputRef.current.value = ''; 
            }}>Clear Memory</button>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
              Images stream physically out of FFmpeg into your local RAM without interacting with external servers.
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


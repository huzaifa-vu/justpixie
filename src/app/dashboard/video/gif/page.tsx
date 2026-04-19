"use client";

import { useState, useRef, useEffect } from "react";
import { 
  UploadCloud, Film, Wand2, RefreshCw, Download, 
  CheckCircle, Info, Settings, Trash2 
} from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "./page.module.css";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import Image from "next/image";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";
import { useFileDrop } from "@/hooks/useFileDrop";
import { motion, AnimatePresence } from "framer-motion";

export default function GIFMaker() {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const { settings } = useSettings();
  const ffmpegRef = useRef<any>(null);

  const [currentPass, setCurrentPass] = useState(1);
  const passRef = useRef(1);

  useEffect(() => {
    const load = async () => {
      ffmpegRef.current = new FFmpeg();
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      const ffmpeg = ffmpegRef.current;
      
      ffmpeg.on('progress', ({ progress }: any) => {
        // Use ref value to avoid dependency on state in the effect
        const offset = passRef.current === 1 ? 0 : 50;
        const multiplier = 0.5;
        setProgress(offset + Math.round(progress * 100 * multiplier));
      });

      try {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        setIsReady(true);
      } catch (err) {
         console.warn("WASM Engine Error:", err);
      }
    };
    
    const toBlobURL = async (url: string, type: string) => {
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        const blob = new Blob([buffer], { type });
        return URL.createObjectURL(blob);
    };
    load();
    return () => {
       if (videoUrl) URL.revokeObjectURL(videoUrl);
       if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, []);

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedVideo(file);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoUrl(URL.createObjectURL(file));
      setResultUrl(null);
      setProgress(0);
      setCurrentPass(1);
      passRef.current = 1;
    }
  };

  // Persistent Drop Listener
  useFileDrop({ onDrop: handleFiles, accept: "video/*" });

  useAiHydration(({ files }) => {
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, "/dashboard/video/gif");

  const executeExtraction = async () => {
    if (!selectedVideo || !isReady) return;
    setIsProcessing(true);
    setProgress(5);

    try {
      const ffmpeg = ffmpegRef.current;
      
      // Cleanup previous files if any
      const files = ['input.mp4', 'palette.png', 'output.gif'];
      for (const f of files) {
          try { await ffmpeg.deleteFile(f); } catch(e) {}
      }

      await ffmpeg.writeFile('input.mp4', await fetchFile(selectedVideo));
      
      // Pass 1: Palette Generation (0-50%)
      setCurrentPass(1);
      passRef.current = 1;
      await ffmpeg.exec([
        '-i', 'input.mp4', 
        '-vf', 'fps=10,scale=500:-1:flags=lanczos,palettegen', 
        'palette.png'
      ]);
      
      setProgress(50);

      // Pass 2: GIF Encoding (50-100%)
      setCurrentPass(2);
      passRef.current = 2;
      await ffmpeg.exec([
        '-i', 'input.mp4', 
        '-i', 'palette.png', 
        '-filter_complex', 'fps=10,scale=500:-1:flags=lanczos[x];[x][1:p]paletteuse', 
        '-loop', '0', 
        'output.gif'
      ]);
      
      const data = await ffmpeg.readFile('output.gif');
      const uint8data = new Uint8Array(data as ArrayBuffer);
      const blob = new Blob([uint8data.buffer], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      
      setResultUrl(url);
      
      if (settings.autoDownload) {
        const link = document.createElement("a");
        link.href = url;
        link.download = `anim-${selectedVideo.name.split('.')[0]}.gif`;
        link.click();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
      setProgress(100);
      setCurrentPass(1);
      passRef.current = 1;

      // Final Cleanup
      const ffmpeg = ffmpegRef.current;
      const files = ['input.mp4', 'palette.png'];
      for (const f of files) {
          try { await ffmpeg.deleteFile(f); } catch(e) {}
      }
    }
  };

  const resetAll = () => {
    setSelectedVideo(null);
    setResultUrl(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setProgress(0);
    setCurrentPass(1);
    passRef.current = 1;
  };

  return (
    <ToolWrapper 
      title="GIF Studio" 
      description="Advanced local GIF synthesis. High-fidelity palette generation without server-side processing." 
      icon={Film}
    >
      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {!videoUrl ? (
            <div style={{ width: '100%', maxWidth: '600px' }}>
              <DropZone 
                onFilesSelected={handleFiles} 
                accept="video/*"
                title="Synchronize Video Block"
                subtitle="High-quality palette generation works best for clips under 30s"
              />
            </div>
          ) : (
            <div className={styles.studioStage}>
               <div className={styles.viewerContainer}>
                  <AnimatePresence mode="wait">
                    {!resultUrl ? (
                      <motion.video 
                        key="video-player"
                        src={videoUrl} 
                        className={styles.videoPlayer} 
                        controls 
                        loop 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    ) : (
                      <motion.div 
                        key="gif-output"
                        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                         <img src={resultUrl} alt="Generated GIF" className={styles.gifOutput} />
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>

               {resultUrl && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                     <div className={styles.infoBox} style={{ textAlign: 'center', border: '1px solid var(--mint-green)', background: 'rgba(167, 243, 208, 0.05)' }}>
                        <h3 style={{ color: 'var(--mint-green)', marginBottom: '0.25rem' }}>GIF synthesis complete!</h3>
                        <p>High-fidelity output is ready for download.</p>
                     </div>
                  </motion.div>
               )}
            </div>
          )}
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Settings size={20} />
            <h2>Synthesis Block</h2>
          </div>
          
          <div className={styles.configBody}>
            <div className={styles.engineStatus}>
               {isReady ? <CheckCircle size={20} style={{ color: 'var(--mint-green)' }} /> : <RefreshCw size={20} className={styles.spin} style={{ color: 'var(--gentle-lilac)' }} />}
               <div className={styles.statusInfo}>
                  <div className={styles.statusTitle}>GIF Engine</div>
                  <div className={styles.statusText}>{isReady ? "Natively Ready" : "Initializing Modules..."}</div>
               </div>
            </div>

            <div className={styles.infoBox}>
               <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--foreground)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <Info size={14} />
                  <span>Local Palette Logic</span>
               </div>
               Pixie uses a two-pass encoding process to generate a custom 256-color palette for your video, ensuring maximum fidelity.
            </div>

            {isProcessing && (
              <div className={styles.progressContainer}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                   <span>SYNTHESIZING FRAMES</span>
                   <span>{progress}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {!resultUrl ? (
                <button 
                  className={styles.executeBtn} 
                  onClick={executeExtraction} 
                  disabled={!selectedVideo || isProcessing || !isReady}
                >
                  {isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Synthesizing...</> : <><Film size={20} /> Cast GIF</>}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <a href={resultUrl} download={`anim-${selectedVideo?.name.split('.')[0]}.gif`} className={styles.downloadBtnLarge}>
                    <Download size={20} /> Save GIF File
                  </a>
                  <button className={styles.resetBtn} onClick={resetAll}>
                    <Trash2 size={16} /> Reset Engine
                  </button>
                </div>
              )}
            </div>
            
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
              Files never leave your device. All processing happens locally in WASM.
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

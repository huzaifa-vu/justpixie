"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, Film, Wand2, RefreshCw, Download } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "./page.module.css";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import Image from "next/image";
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";

export default function GIFMaker() {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [autoRun, setAutoRun] = useState(false);
  const { settings } = useSettings();
  
  const ffmpegRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      ffmpegRef.current = new FFmpeg();
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      const ffmpeg = ffmpegRef.current;
      
      ffmpeg.on('progress', ({ progress }: any) => {
        setProgress(Math.round(progress * 100));
      });

      try {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        setIsReady(true);
      } catch (err) {
         console.warn(err);
      }
    }
    
    const toBlobURL = async (url: string, type: string) => {
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        const blob = new Blob([buffer], { type });
        return URL.createObjectURL(blob);
    };

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      setSelectedVideo(files[0]);
      setVideoUrl(URL.createObjectURL(files[0]));
      setResultUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  useAiHydration(({ files, autoExecute }) => {
    if (files && files.length > 0) {
      setSelectedVideo(files[0]);
      setVideoUrl(URL.createObjectURL(files[0]));
      setResultUrl(null);
    }
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/video/gif");

  useEffect(() => {
    if (autoRun && selectedVideo && isReady && !isProcessing) {
      executeExtraction();
      setAutoRun(false);
    }
  }, [autoRun, selectedVideo, isReady, isProcessing]);

  const executeExtraction = async () => {
    if (!selectedVideo || !isReady) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      const ffmpeg = ffmpegRef.current;
      await ffmpeg.writeFile('input.mp4', await fetchFile(selectedVideo));
      
      // Standard GIF creation scale and fps optimization
      await ffmpeg.exec(['-i', 'input.mp4', '-vf', 'fps=10,scale=500:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse', '-loop', '0', 'output.gif']);
      
      const data = await ffmpeg.readFile('output.gif');
      const uint8data = new Uint8Array(data as ArrayBuffer);
      const url = URL.createObjectURL(new Blob([uint8data.buffer], { type: 'image/gif' }));
      
      setResultUrl(url);
    } catch (error) {
      console.error(error);
      alert("Failed to render GIF limit sizes to smaller clips locally.");
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  useEffect(() => {
    if (resultUrl && settings.autoDownload && !isProcessing) {
      const timer = setTimeout(() => {
        const link = document.createElement("a");
        link.href = resultUrl;
        link.download = `pixie-${Date.now()}.gif`;
        link.click();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [resultUrl, settings.autoDownload, isProcessing]);

  return (
    <ToolWrapper title="GIF Engine" description="Slice heavy video chunks into intensely compressed, perfectly looping graphical formats." icon={Film}>

      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {!videoUrl ? (
            <DropZone 
              onFilesSelected={handleFiles} 
              accept="video/*"
              title="Locate a source video"
              subtitle="Keep under 30 seconds for optimal GIF limits"
            />
          ) : (
            <div className={styles.viewerContainer}>
               {!resultUrl ? (
                 <video src={videoUrl} className={styles.videoPlayer} controls loop />
               ) : (
                 <Image src={resultUrl} alt="Generated GIF" fill style={{ objectFit: 'contain' }} unoptimized />
               )}
            </div>
          )}
          {/* Hidden input removed in favor of DropZone */}
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Wand2 size={20} />
            <h2>Execution Block</h2>
          </div>
          
          <div className={styles.configBody}>
            {!isReady ? (
              <div className={styles.infoBoxWarn}><strong>Syncing Engines...</strong> Grabbing WASM logic modules.</div>
            ) : (
              <div className={styles.infoBox}><strong>Engine Ready:</strong> Palette Generation Online.</div>
            )}

            {isProcessing && (
              <div className={styles.progressContainer}>
                <div className={styles.progressLabel}>
                  <span>Encoding GIF frames...</span>
                  <span>{progress}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {!resultUrl ? (
              <button className={styles.executeBtn} onClick={executeExtraction} disabled={!selectedVideo || isProcessing || !isReady}>
                {isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Encoding GIF...</> : <><Film size={20} /> Cast GIF</>}
              </button>
            ) : (
               <div className={styles.resultDetails}>
                 <div className={styles.statLabel}>GIF Engine Complete.</div>
                 <a href={resultUrl} download={`anim-${selectedVideo?.name.split('.')[0]}.gif`} className={styles.downloadBtnLarge}>
                   <Download size={20} /> Save GIF File
                 </a>
               </div>
            )}
            
            <button className={styles.resetBtn} onClick={() => { setResultUrl(null); setSelectedVideo(null); setVideoUrl(null); setProgress(0); if(fileInputRef.current) fileInputRef.current.value = ''; }}>Clear Session</button>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
              Video processing runs locally in your browser. Depending on your hardware and video length, this may take a few minutes.
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


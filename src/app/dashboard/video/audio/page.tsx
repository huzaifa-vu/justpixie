"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, Music, Wand2, RefreshCw, Download } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "./page.module.css";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";

export default function VideoExtractor() {
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
      
      ffmpeg.on('log', ({ message }: any) => {
        console.log("FFmpeg Log:", message);
      });
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
        console.warn("WASM FFmpeg core failed.", err);
      }
    }
    
    const toBlobURL = async (url: string, type: string) => {
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        const blob = new Blob([buffer], { type });
        return URL.createObjectURL(blob);
    };

    load();
  }, []);

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedVideo(file);
      setVideoUrl(URL.createObjectURL(file));
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
      const file = files[0];
      setSelectedVideo(file);
      setVideoUrl(URL.createObjectURL(file));
      setResultUrl(null);
    }
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/video/audio");

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
      
      // Extract highest quality MP3 stream
      await ffmpeg.exec(['-i', 'input.mp4', '-q:a', '0', '-map', 'a', 'output.mp3']);
      
      const data = await ffmpeg.readFile('output.mp3');
      const uint8data = new Uint8Array(data as ArrayBuffer);
      const url = URL.createObjectURL(new Blob([uint8data.buffer], { type: 'audio/mp3' }));
      
      setResultUrl(url);
    } catch (error) {
      console.error(error);
      alert("Failed to extract MP3 audio.");
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
        link.download = `pixie-${Date.now()}.mp3`;
        link.click();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [resultUrl, settings.autoDownload, isProcessing]);

  return (
    <ToolWrapper title="Extract Audio" description="Pull high-quality MP3 data streams directly from video files without leaving your browser." icon={Music}>

      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {!videoUrl ? (
            <DropZone 
              onFilesSelected={handleFiles} 
              accept="video/*"
              title="Drop a video here"
              subtitle=".mp4, .webm"
            />
          ) : (
            <div className={styles.viewerContainer}>
              <video src={videoUrl} className={styles.videoPlayer} controls loop />
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
              <div className={styles.infoBoxWarn}><strong>Igniting FFmpeg Engine...</strong> Loading 30MB core logic into chromium memory.</div>
            ) : (
              <div className={styles.infoBox}><strong>Engine Ready:</strong> WASM architecture online.</div>
            )}

            {isProcessing && (
              <div className={styles.progressContainer}>
                <div className={styles.progressLabel}>
                  <span>Extracting...</span>
                  <span>{progress}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {!resultUrl ? (
              <button className={styles.executeBtn} onClick={executeExtraction} disabled={!selectedVideo || isProcessing || !isReady}>
                {isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Demuxing MP3...</> : <><Music size={20} /> Cast Extraction</>}
              </button>
            ) : (
               <div className={styles.resultDetails}>
                 <div className={styles.statLabel}>Extraction Success.</div>
                 <a href={resultUrl} download={`audio-${selectedVideo?.name.split('.')[0]}.mp3`} className={styles.downloadBtnLarge}>
                   <Download size={20} /> Download MP3
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


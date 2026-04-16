"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, Video, Wand2, RefreshCw, VolumeX, Download } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "./page.module.css";
// Verify these are installed: npm install @ffmpeg/ffmpeg @ffmpeg/util
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";

export default function VideoSilencer() {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [autoRun, setAutoRun] = useState(false);
  const { settings } = useSettings();
  
  // Use a ref to persist ffmpeg instance without re-instantiating entirely
  const ffmpegRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load ffmpeg when component mounts
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
        // if user hasn't successfully installed or configured cors
        console.warn("WASM FFmpeg core failed to load natively. Next.js local host issue or missing core.", err);
      }
    }
    
    // Helper since we aren't importing from deep util layers
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
  }, "/dashboard/video/silence");

  useEffect(() => {
    if (autoRun && selectedVideo && isReady && !isProcessing) {
      executeSilence();
      setAutoRun(false);
    }
  }, [autoRun, selectedVideo, isReady, isProcessing]);

  const executeSilence = async () => {
    if (!selectedVideo || !isReady) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      const ffmpeg = ffmpegRef.current;
      
      // Write file into WASM memory space
      await ffmpeg.writeFile('input.mp4', await fetchFile(selectedVideo));
      
      // Execute audio strip. -c:v copy copies video stream instantly. -an strips audio.
      await ffmpeg.exec(['-i', 'input.mp4', '-c:v', 'copy', '-an', 'output.mp4']);
      
      // Read processed file from WASM memory space
      const data = await ffmpeg.readFile('output.mp4');
      const uint8data = new Uint8Array(data as ArrayBuffer);
      const url = URL.createObjectURL(new Blob([uint8data.buffer], { type: 'video/mp4' }));
      
      setResultUrl(url);

    } catch (error) {
      console.error("FFmpeg execution error. This is common if SharedArrayBuffer isn't enabled via correct headers locally.", error);
      alert("Failed to silence video. (Note: ffmpeg.wasm requires cross-origin isolation headers on your server to function properly).");
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
        link.download = `pixie-${Date.now()}.mp4`;
        link.click();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [resultUrl, settings.autoDownload, isProcessing]);

  return (
    <ToolWrapper title="Video Silencer" description="Instantly strip audio tracks from videos natively without re-encoding." icon={VolumeX}>

      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {!videoUrl ? (
            <DropZone 
              onFilesSelected={handleFiles} 
              accept="video/*"
              title="Drop a video here (.mp4, .webm)"
              subtitle="Processed entirely offline securely via ffmpeg.wasm."
            />
          ) : (
            <div className={styles.viewerContainer}>
              <video 
                src={videoUrl} 
                className={styles.videoPlayer} 
                controls 
                autoPlay 
                muted 
                loop 
              />
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
            {!isReady && (
              <div className={styles.infoBoxWarn}>
                <strong>Igniting Engines...</strong> Loading the FFmpeg core bundle.
              </div>
            )}
            {isReady && (
              <div className={styles.infoBox}>
                <strong>Engine Ready:</strong> FFmpeg WebAssembly loaded.
              </div>
            )}

            {isProcessing && (
              <div className={styles.progressContainer}>
                <div className={styles.progressLabel}><span>Processing...</span><span>{progress}%</span></div>
                <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>
              </div>
            )}

            {!resultUrl ? (
              <button 
                className={styles.executeBtn}
                onClick={executeSilence}
                disabled={!selectedVideo || isProcessing || !isReady}
              >
                {isProcessing ? (
                  <><RefreshCw size={20} className={styles.spin} /> Demuxing...</>
                ) : (
                  <><VolumeX size={20} /> Cast Silence</>
                )}
              </button>
            ) : (
               <div className={styles.resultDetails}>
                 <div className={styles.statLabel}>Isolated successfully.</div>
                 <a 
                   href={resultUrl}
                   download={`silenced-${selectedVideo?.name}`}
                   className={styles.downloadBtnLarge}
                 >
                   <Download size={20} />
                   Download MP4
                 </a>
               </div>
            )}
            
            <button
              className={styles.resetBtn}
              onClick={() => {
                setResultUrl(null);
                setSelectedVideo(null);
                setVideoUrl(null);
                setProgress(0);
                if(fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              Clear Video
            </button>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
              Video processing runs locally in your browser. Depending on your hardware and video length, this may take a few minutes.
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


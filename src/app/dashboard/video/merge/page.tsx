"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, Music, Wand2, RefreshCw, Download, Film, Plus } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "./page.module.css";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";

export default function VideoAudioMerger() {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const { settings } = useSettings();
  
  const ffmpegRef = useRef<any>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

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

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedVideo(e.target.files[0]);
      setResultUrl(null);
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedAudio(e.target.files[0]);
      setResultUrl(null);
    }
  };

  const executeMerge = async () => {
    if (!selectedVideo || !selectedAudio || !isReady) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      const ffmpeg = ffmpegRef.current;
      
      // Write files to virtual FS
      await ffmpeg.writeFile('video.mp4', await fetchFile(selectedVideo));
      await ffmpeg.writeFile('audio.mp3', await fetchFile(selectedAudio));
      
      // Merge audio and video
      // -c:v copy: Copy video stream without re-encoding
      // -c:a aac: Re-encode audio to AAC for compatibility
      // -map 0:v:0 -map 1:a:0: Map first video from first input and first audio from second input
      // -shortest: End encoding when the shortest stream ends (optional, usually good for background music)
      await ffmpeg.exec([
        '-i', 'video.mp4', 
        '-i', 'audio.mp3', 
        '-c:v', 'copy', 
        '-c:a', 'aac', 
        '-map', '0:v:0', 
        '-map', '1:a:0', 
        'output.mp4'
      ]);
      
      const data = await ffmpeg.readFile('output.mp4');
      const uint8data = new Uint8Array(data as ArrayBuffer);
      const url = URL.createObjectURL(new Blob([uint8data.buffer], { type: 'video/mp4' }));
      
      setResultUrl(url);
    } catch (error) {
      console.error(error);
      alert("Failed to merge video and audio.");
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  return (
    <ToolWrapper 
      title="Merge Video & Audio" 
      description="Manually combine high-quality video streams with external audio tracks. Powered by local WASM technology." 
      icon={Plus}
    >
      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          <div className={styles.dualDropZone}>
            <div 
              className={`${styles.fileCard} ${selectedVideo ? styles.fileCardActive : ''}`}
              onClick={() => !selectedVideo && videoInputRef.current?.click()}
            >
              <Film className={styles.fileIcon} size={32} />
              <span className={styles.fileTitle}>Step 1: Video Track</span>
              <span className={styles.fileDesc}>Click to upload .mp4 or .webm</span>
              {selectedVideo && <span className={styles.fileName}>{selectedVideo.name}</span>}
              <input type="file" ref={videoInputRef} className={styles.hiddenInput} onChange={handleVideoSelect} accept="video/*" hidden />
            </div>

            <div 
              className={`${styles.fileCard} ${selectedAudio ? styles.fileCardActive : ''}`}
              onClick={() => !selectedAudio && audioInputRef.current?.click()}
            >
              <Music className={styles.fileIcon} size={32} />
              <span className={styles.fileTitle}>Step 2: Audio Track</span>
              <span className={styles.fileDesc}>Click to upload .mp3 or .m4a</span>
              {selectedAudio && <span className={styles.fileName}>{selectedAudio.name}</span>}
              <input type="file" ref={audioInputRef} className={styles.hiddenInput} onChange={handleAudioSelect} accept="audio/*" hidden />
            </div>
          </div>
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Wand2 size={20} />
            <h2>Merge Configuration</h2>
          </div>
          
          <div className={styles.configBody}>
            {!isReady ? (
              <div className={styles.infoBoxWarn}><strong>Loading Engine...</strong> Preparing local ffmpeg instance.</div>
            ) : (
              <div className={styles.infoBox}><strong>System Ready:</strong> Files will be processed locally on your machine.</div>
            )}

            {isProcessing && (
              <div className={styles.progressContainer}>
                <div className={styles.progressLabel}>
                  <span>Merging Streams...</span>
                  <span>{progress}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {!resultUrl ? (
              <button 
                className={styles.executeBtn} 
                onClick={executeMerge} 
                disabled={!selectedVideo || !selectedAudio || isProcessing || !isReady}
              >
                {isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Processing...</> : <><Film size={20} /> Start Merge</>}
              </button>
            ) : (
               <div className={styles.resultDetails}>
                 <div className={styles.statLabel}>Magic Success. Your file is ready.</div>
                 <a href={resultUrl} download={`merged-${selectedVideo?.name}`} className={styles.downloadBtnLarge}>
                   <Download size={20} /> Download Result
                 </a>
                 <button className={styles.resetBtn} onClick={() => { setSelectedVideo(null); setSelectedAudio(null); setResultUrl(null); }}>Reset Session</button>
               </div>
            )}
            
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
              Your files never leave your device. The merging happens entirely in your browser's memory.
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

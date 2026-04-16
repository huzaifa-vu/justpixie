"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, Scissors, RefreshCw, Download, Settings2 } from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../audio/page.module.css";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";

export default function VideoTrimmer() {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [startTime, setStartTime] = useState("00:00:00");
  const [endTime, setEndTime] = useState("00:00:10");
  const [autoRun, setAutoRun] = useState(false);
  const { settings } = useSettings();

  const ffmpegRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setSelectedVideo(files[0]);
      setVideoUrl(URL.createObjectURL(files[0]));
      setResultUrl(null);
    }
    if (params?.startTime) setStartTime(params.startTime);
    if (params?.endTime) setEndTime(params.endTime);
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/video/trim");

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
    try {
      const ffmpeg = ffmpegRef.current;
      await ffmpeg.writeFile('input.mp4', await fetchFile(selectedVideo));
      
      // Fast seek with -c copy is extremely quick. 
      // -ss before -i seeks input fast, -to after -i stops precisely.
      await ffmpeg.exec(['-ss', startTime, '-i', 'input.mp4', '-to', endTime, '-c', 'copy', 'output.mp4']);
      
      const data = await ffmpeg.readFile('output.mp4');
      setResultUrl(URL.createObjectURL(new Blob([new Uint8Array(data as ArrayBuffer).buffer], { type: 'video/mp4' })));
    } catch (e) { 
      console.error(e); 
      alert("Trimming failed."); 
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
    <ToolWrapper title="Video Trimmer" description="Slice videos using precise timestamps locally without re-encoding delays." icon={Scissors}>
      
      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {!videoUrl ? (
            <DropZone 
              onFilesSelected={(files) => {
                if (files[0]) {
                  setSelectedVideo(files[0]);
                  setVideoUrl(URL.createObjectURL(files[0]));
                  setResultUrl(null);
                }
              }} 
              accept="video/*"
              title="Locate a source video"
              subtitle=".mp4, .mov, .webm"
            />
          ) : (
            <div className={styles.viewerContainer}>
               <video src={resultUrl || videoUrl} className={styles.videoPlayer} controls preload="metadata" />
            </div>
          )}
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><Settings2 size={20} /><h2>Settings</h2></div>
          <div className={styles.configBody}>
            {!isReady ? <div className={styles.infoBoxWarn}><strong>Loading FFmpeg...</strong></div> : <div className={styles.infoBox}><strong>Engine Ready</strong> WebAssembly initialized.</div>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Start Time (HH:MM:SS)</span>
               <input 
                 type="text" 
                 value={startTime} 
                 onChange={e => setStartTime(e.target.value)} 
                 style={{ padding: '0.75rem', borderRadius: 'var(--radius-inner)', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '1.25rem' }} 
               />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>End Time (HH:MM:SS)</span>
               <input 
                 type="text" 
                 value={endTime} 
                 onChange={e => setEndTime(e.target.value)} 
                 style={{ padding: '0.75rem', borderRadius: 'var(--radius-inner)', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '1.25rem' }} 
               />
            </div>
            
            {isProcessing && (
              <div className={styles.progressContainer}>
                <div className={styles.progressLabel}><span>Slicing...</span><span>{progress}%</span></div>
                <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>
              </div>
            )}

            {!resultUrl ? (
              <button className={styles.executeBtn} onClick={execute} disabled={!selectedVideo || isProcessing || !isReady}>
                {isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Cutting...</> : <><Scissors size={20} /> Trim Video</>}
              </button>
            ) : (
              <a href={resultUrl} download={`trimmed-${selectedVideo?.name}`} className={styles.downloadBtnLarge}><Download size={20} /> Download Target</a>
            )}
            
            <button className={styles.resetBtn} onClick={() => { 
              setResultUrl(null); setSelectedVideo(null); setVideoUrl(null); setProgress(0); 
              if (fileInputRef.current) fileInputRef.current.value = ''; 
            }}>Clear Memory</button>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
              Trimming runs instantly without re-encoding via FFmpeg fast seek algorithms.
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


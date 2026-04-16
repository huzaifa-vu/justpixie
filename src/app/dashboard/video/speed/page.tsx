"use client";
import { useState, useRef, useEffect } from "react";
import { UploadCloud, Gauge, Wand2, RefreshCw, Download } from "lucide-react";
import Dropdown from "@/components/Dropdown";
import ToolWrapper from "@/components/ToolWrapper";
import styles from "../audio/page.module.css";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { DropZone } from "@/components/DropZone";

export default function VideoSpeed() {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState("2");
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
        await ffmpegRef.current.load({ coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'), wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm') });
        setIsReady(true);
      } catch (err) { console.warn(err); }
    };
    const toBlobURL = async (url: string, type: string) => { const r = await fetch(url); const b = await r.arrayBuffer(); return URL.createObjectURL(new Blob([b], { type })); };
    load();
  }, []);

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      setSelectedVideo(files[0]);
      setVideoUrl(URL.createObjectURL(files[0]));
      setResultUrl(null);
    }
  };

  useAiHydration(({ files, params, autoExecute }) => {
    if (files && files.length > 0) {
      handleFiles(files);
    }
    if (params?.speed) setSpeed(String(params.speed));
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/video/speed");

  useEffect(() => {
    if (autoRun && selectedVideo && isReady && !isProcessing) {
      execute();
      setAutoRun(false);
    }
  }, [autoRun, selectedVideo, isReady, isProcessing]);

  const execute = async () => {
    if (!selectedVideo || !isReady) return; setIsProcessing(true); setProgress(0);
    try {
      const ffmpeg = ffmpegRef.current;
      await ffmpeg.writeFile('input.mp4', await fetchFile(selectedVideo));
      const s = parseFloat(speed);
      const pts = (1 / s).toFixed(4);
      const atempo = s <= 2 ? `atempo=${s}` : `atempo=2.0,atempo=${(s / 2).toFixed(4)}`;
      await ffmpeg.exec(['-i', 'input.mp4', '-filter:v', `setpts=${pts}*PTS`, '-filter:a', atempo, '-c:v', 'libx264', '-preset', 'ultrafast', 'output.mp4']);
      const data = await ffmpeg.readFile('output.mp4');
      setResultUrl(URL.createObjectURL(new Blob([new Uint8Array(data as ArrayBuffer).buffer], { type: 'video/mp4' })));
    } finally { setIsProcessing(false); setProgress(100); }
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
    <ToolWrapper title="Video Speed" description="Speed up or slow down videos locally." icon={Gauge}>
      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {!videoUrl ? (
            <DropZone 
              onFilesSelected={handleFiles} 
              accept="video/*"
              title="Select a video"
              subtitle=".mp4"
            />
          ) : (
            <div className={styles.viewerContainer}>
              <video src={resultUrl || videoUrl} className={styles.videoPlayer} controls loop />
            </div>
          )}
          {/* Hidden input removed in favor of DropZone */}
        </div>
        <div className={styles.configSidebar}>
          <div className={styles.configHeader}><Wand2 size={20} /><h2>Config</h2></div>
          <div className={styles.configBody}>
            {!isReady ? <div className={styles.infoBoxWarn}><strong>Loading FFmpeg...</strong></div> : <div className={styles.infoBox}><strong>Engine Ready</strong></div>}
            
            <Dropdown options={[{ label: "0.5× (Slow Mo)", value: "0.5" }, { label: "0.75×", value: "0.75" }, { label: "1.5× Fast", value: "1.5" }, { label: "2× Fast", value: "2" }, { label: "3× Fast", value: "3" }, { label: "4× Fast", value: "4" }]} value={speed} onChange={(val) => setSpeed(val)} />
            
            {isProcessing && (
              <div className={styles.progressContainer}>
                <div className={styles.progressLabel}><span>Processing...</span><span>{progress}%</span></div>
                <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>
              </div>
            )}

            {!resultUrl ? (<button className={styles.executeBtn} onClick={execute} disabled={!selectedVideo || isProcessing || !isReady}>{isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Processing...</> : <><Gauge size={20} /> Change Speed</>}</button>) : (<a href={resultUrl} download={`speed-${selectedVideo?.name}`} className={styles.downloadBtnLarge}><Download size={20} /> Download</a>)}
            <button className={styles.resetBtn} onClick={() => { setResultUrl(null); setSelectedVideo(null); setVideoUrl(null); setProgress(0); if(fileInputRef.current) fileInputRef.current.value = ''; }}>Clear</button>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
              Video processing runs locally in your browser. Depending on your hardware and video length, this may take a few minutes.
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}


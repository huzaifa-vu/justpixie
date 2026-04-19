"use client";

import { useState, useRef, useEffect } from "react";
import { 
  UploadCloud, Music, Wand2, RefreshCw, Download, 
  Film, Plus, CheckCircle, Info, Settings, 
  Play, Volume2, Clock, Trash2 
} from "lucide-react";
import ToolWrapper from "@/components/ToolWrapper";
import { DropZone } from "@/components/DropZone";
import styles from "./page.module.css";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { useAiHydration } from "@/hooks/useAiHydration";
import { useSettings } from "@/hooks/useSettings";
import { useFileDrop } from "@/hooks/useFileDrop";
import { motion, AnimatePresence } from "framer-motion";

export default function VideoAudioMerger() {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [syncShortest, setSyncShortest] = useState(true);
  
  const { settings } = useSettings();
  const ffmpegRef = useRef<any>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

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
        console.warn("WASM FFmpeg core failed.", err);
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
       if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
       if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, []);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedVideo(file);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(URL.createObjectURL(file));
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
      await ffmpeg.writeFile('input_video', await fetchFile(selectedVideo));
      await ffmpeg.writeFile('input_audio', await fetchFile(selectedAudio));
      
      const args = [
        '-i', 'input_video', 
        '-i', 'input_audio', 
        '-c:v', 'copy', 
        '-c:a', 'aac', 
        '-map', '0:v:0', 
        '-map', '1:a:0'
      ];

      if (syncShortest) {
        args.push('-shortest');
      }

      args.push('output.mp4');
      
      await ffmpeg.exec(args);
      
      const data = await ffmpeg.readFile('output.mp4');
      const uint8data = new Uint8Array(data as ArrayBuffer);
      const url = URL.createObjectURL(new Blob([uint8data.buffer], { type: 'video/mp4' }));
      
      setResultUrl(url);
      if (settings.autoDownload) {
        const link = document.createElement("a");
        link.href = url;
        link.download = `merged-${selectedVideo.name}`;
        link.click();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const resetAll = () => {
    setSelectedVideo(null);
    setSelectedAudio(null);
    setResultUrl(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    setProgress(0);
  };

  const handleDrop = (files: File[]) => {
    const vid = files.find(f => f.type.startsWith("video/"));
    const aud = files.find(f => f.type.startsWith("audio/"));
    if (vid) {
      setSelectedVideo(vid);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(URL.createObjectURL(vid));
      setResultUrl(null);
    }
    if (aud) {
      setSelectedAudio(aud);
      setResultUrl(null);
    }
  };

  // Keep listener active throughout the entire session
  useFileDrop({ onDrop: handleDrop, accept: "video/*,audio/*" });

  useAiHydration(({ files }) => {
    if (files && files.length > 0) {
      handleDrop(files);
    }
  }, "/dashboard/video/merge");

  return (
    <ToolWrapper 
      title="A/V Merger Studio" 
      description="Professional-grade local stream merging. Combine high-bitrate video with custom audio tracks natively." 
      icon={Plus}
    >
      <div className={styles.workspace}>
        <div className={styles.previewArea}>
          {!selectedVideo && !selectedAudio ? (
            <div style={{ width: '100%', maxWidth: '600px' }}>
              <DropZone 
                onFilesSelected={handleDrop}
                accept="video/*,audio/*"
                title="Synchronize Media Streams"
                subtitle="Drop both a video and an audio track to begin"
              />
            </div>
          ) : (
            <div className={styles.studioStage}>
              <div className={styles.uploadGrid}>
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={selectedVideo ? "active-video" : "empty-video"}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${styles.fileSlot} ${selectedVideo ? styles.fileSlotActive : ''}`}
                    onClick={() => !selectedVideo && videoInputRef.current?.click()}
                    style={{ position: 'relative' }}
                  >
                    {!selectedVideo ? (
                      <>
                        <div className={styles.fileIcon} style={{ color: 'var(--gentle-lilac)' }}><Film size={40} /></div>
                        <span className={styles.fileTitle}>Base Video Track</span>
                        <span className={styles.fileDesc}>Select the visual stream source</span>
                      </>
                    ) : (
                      <div style={{ width: '100%' }}>
                         <video src={videoPreviewUrl!} className={styles.videoPreview} controls muted />
                         <div className={styles.audioBadge} style={{ marginTop: '1rem' }}>
                            <CheckCircle size={14} /> Video Stream Loaded
                         </div>
                         <button 
                           onClick={(e) => { e.stopPropagation(); setSelectedVideo(null); setVideoPreviewUrl(null); }}
                           style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '5px', color: 'white', cursor: 'pointer' }}
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                    )}
                    <input type="file" ref={videoInputRef} onChange={handleVideoSelect} accept="video/*" hidden />
                  </motion.div>

                  <motion.div 
                     key={selectedAudio ? "active-audio" : "empty-audio"}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className={`${styles.fileSlot} ${selectedAudio ? styles.fileSlotActive : ''}`}
                     onClick={() => !selectedAudio && audioInputRef.current?.click()}
                     style={{ position: 'relative' }}
                  >
                    {!selectedAudio ? (
                      <>
                        <div className={styles.fileIcon} style={{ color: 'var(--mint-green)' }}><Music size={40} /></div>
                        <span className={styles.fileTitle}>New Audio Track</span>
                        <span className={styles.fileDesc}>Select the sound stream source</span>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                         <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--mint-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--deep-charcoal)' }}>
                            <Volume2 size={32} />
                         </div>
                         <div className={styles.audioBadge}>{selectedAudio.name}</div>
                         <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Ready to Overlay</span>
                         <button 
                           onClick={(e) => { e.stopPropagation(); setSelectedAudio(null); }}
                           style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '5px', color: 'white', cursor: 'pointer' }}
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                    )}
                    <input type="file" ref={audioInputRef} onChange={handleAudioSelect} accept="audio/*" hidden />
                  </motion.div>
                </AnimatePresence>
              </div>
              
              {resultUrl && (
                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <div className={styles.infoBox} style={{ textAlign: 'center', border: '1px solid var(--mint-green)', background: 'rgba(167, 243, 208, 0.05)' }}>
                       <h3 style={{ color: 'var(--mint-green)', marginBottom: '0.5rem' }}>Merge Complete!</h3>
                       <p>Your combined streams are ready for download below.</p>
                    </div>
                 </motion.div>
              )}
            </div>
          )}
        </div>

        <div className={styles.configSidebar}>
          <div className={styles.configHeader}>
            <Settings size={20} />
            <h2>Studio Config</h2>
          </div>
          
          <div className={styles.configBody}>
            <div className={styles.engineStatus}>
               {isReady ? <CheckCircle size={20} style={{ color: 'var(--mint-green)' }} /> : <RefreshCw size={20} className={styles.spin} style={{ color: 'var(--gentle-lilac)' }} />}
               <div className={styles.statusInfo}>
                  <div className={styles.statusTitle}>FFmpeg Engine</div>
                  <div className={styles.statusText}>{isReady ? "Natively Active" : "Initializing WASM..."}</div>
               </div>
            </div>

            <div className={styles.infoBox}>
               <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--foreground)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <Info size={14} />
                  <span>Stream Mapping</span>
               </div>
               Pixie will use the primary video data from Slot 1 and replace its audio track with the content from Slot 2. No re-encoding happens for video.
            </div>

            <div className={styles.fieldGroup}>
               <label className={styles.label}>Merge Strategy</label>
               <div className={styles.toggleContainer} onClick={() => setSyncShortest(!syncShortest)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                     <Clock size={18} style={{ color: syncShortest ? 'var(--mint-green)' : 'var(--text-muted)' }} />
                     <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Sync to Shortest</span>
                  </div>
                  <div style={{ width: 40, height: 20, background: syncShortest ? 'var(--mint-green)' : 'var(--border)', borderRadius: 10, position: 'relative', transition: 'background 0.2s' }}>
                     <div style={{ width: 16, height: 16, background: 'white', borderRadius: '50%', position: 'absolute', top: 2, left: syncShortest ? 22 : 2, transition: 'all 0.2s' }} />
                  </div>
               </div>
               <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Automatically end the video when the shorter of the two tracks finishes.</p>
            </div>

            {isProcessing && (
              <div className={styles.progressContainer}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                   <span>SYNCHRONIZING</span>
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
                  onClick={executeMerge} 
                  disabled={!selectedVideo || !selectedAudio || isProcessing || !isReady}
                >
                  {isProcessing ? <><RefreshCw size={20} className={styles.spin} /> Merging...</> : <><Wand2 size={20} /> Combine Streams</>}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <a href={resultUrl} download={`merged-${selectedVideo?.name}`} className={styles.downloadBtnLarge}>
                    <Download size={20} /> Download Result
                  </a>
                  <button className={styles.resetBtn} onClick={resetAll}>
                    <Trash2 size={16} /> Reset Studio
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}

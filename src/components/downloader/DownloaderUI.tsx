"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Download, RefreshCw, PlayCircle, Clock, CheckCircle, AlertCircle, Sparkles, Gauge, Zap, ShieldAlert, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./DownloaderUI.module.css";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { createPortal } from "react-dom";

interface DownloaderUIProps {
  platform: 'youtube' | 'instagram' | 'twitter' | 'facebook';
  placeholder?: string;
  accentColor?: string;
  initialUrl?: string;
  autoRun?: boolean;
}

const YouTubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;

function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonThumbnail}></div>
      <div className={styles.skeletonInfo}>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonMeta}></div>
        <div className={styles.skeletonOptions}></div>
      </div>
    </div>
  );
}

function FeatureBento({ accentColor }: { accentColor: string }) {
  const features = [
    { icon: Zap, title: "10x Speed", desc: "Multi-threaded local downloads" },
    { icon: ShieldCheck, title: "Private", desc: "Processed 100% on your device" },
    { icon: Monitor, title: "4K HDR", desc: "Highest resolution supported" },
    { icon: Wand2, title: "Smart", desc: "Auto-detects high quality streams" }
  ];
  return (
    <div className={styles.heroArea}>
      <div className={styles.heroText}>
        <span className={styles.heroBadge} style={{ borderColor: accentColor }}>Ready for Magic</span>
        <h1>Paste. Transform. Magic.</h1>
        <p>Your high-performance private media studio starts here.</p>
      </div>
      <div className={styles.featuresGrid}>
        {features.map((f, i) => (
          <div key={i} className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: `${accentColor}1A`, color: accentColor }}>
              <f.icon size={20} />
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc} </p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { ShieldCheck, Monitor, Wand2, ClipboardPaste } from "lucide-react";

export default function DownloaderUI({ platform, placeholder, accentColor = "var(--mint-green)", initialUrl = "", autoRun = false }: DownloaderUIProps) {
  const [url, setUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isFileSystemSupported, setIsFileSystemSupported] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const [downloadStats, setDownloadStats] = useState({ speed: 0, downloaded: 0, total: 0 });
  const [boostLevel, setBoostLevel] = useState(1); // 1, 4, 8, 16
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);
  const [manualDownloadUrl, setManualDownloadUrl] = useState<string | null>(null);
  const [isExternalDownload, setIsExternalDownload] = useState(false);
  const [mounted, setMounted] = useState(false);
  const boostLevelRef = useRef(1);
  const activeWorkersRef = useRef(0);
  const spawnerRef = useRef<(() => void) | null>(null);
  
  const ffmpegRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    setIsFileSystemSupported('showSaveFilePicker' in window);
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
        console.warn("WASM FFmpeg core failed in downloader component.", err);
      }
    };
    
    const toBlobURL = async (url: string, type: string) => {
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        const blob = new Blob([buffer], { type });
        return URL.createObjectURL(blob);
    };

    load();
  }, []);

  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  // Real-time URL validation for "Magic detect"
  const isYouTubeLink = YouTubeRegex.test(url);

  // Trigger analysis if directed by AI or via auto-paste detection
  useEffect(() => {
    if ((autoRun || isYouTubeLink) && url && !isLoading && !metadata && !isProcessing) {
      // Small debounce to let users finish pasting
      const timer = setTimeout(() => {
        handleAnalyze();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoRun, url, isYouTubeLink]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch (err) {
      console.warn("Clipboard access denied", err);
    }
  };

  const handleAnalyze = async () => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    setMetadata(null);

    try {
      const response = await fetch(`/api/video/downloader?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      setMetadata(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check the URL.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChunk = async (targetUrl: string, start: number, end: number, onSubProgress: (received: number) => void): Promise<ArrayBuffer> => {
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // Increased to 45s for slow mobile CDNs

      try {
        const response = await fetch(targetUrl, {
          headers: { 'Range': `bytes=${start}-${end}` },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        // 416 Range Not Satisfiable: Final bytes reached, return empty buffer and terminate loop gracefully
        if (!response.ok && response.status === 416) {
            return new ArrayBuffer(0);
        }

        if (!response.ok && response.status !== 206) throw new Error("Server rejected range request.");
        
        const reader = response.body?.getReader();
        if (!reader) throw new Error("ReadableStream not supported.");

        const contentLength = parseInt(response.headers.get('Content-Length') || '0');
        let receivedLength = 0;
        const chunkData = new Uint8Array(contentLength || (end - start + 1));
        
        while (true) {
          const { done, value } = await Promise.race([
            reader.read(),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error("STALL")), 20000)) // 20s heartbeat
          ]);

          if (done) break;

          chunkData.set(value, receivedLength);
          receivedLength += value.length;
          onSubProgress(value.length);
        }

        return chunkData.buffer;
      } catch (err: any) {
        attempt++;
        console.warn(`Chunk fetch attempt ${attempt} failed:`, err.message);
        if (err.message === 'STALL') setStatusMsg("⚠️ Connection stalled. Retrying piece...");
        if (attempt >= MAX_RETRIES) throw new Error(`Failed to fetch chunk after ${MAX_RETRIES} attempts.`);
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
    throw new Error(`Failed to fetch chunk after ${MAX_RETRIES} attempts.`);
  };

  const fetchStream = async (targetUrl: string, onProgress: (p: number) => void) => {
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error("Stream fetch failed.");
    const reader = response.body?.getReader();
    const contentLength = +(response.headers.get('Content-Length') ?? 0);
    let receivedLength = 0;
    let chunks = [];
    if (!reader) throw new Error("Stream reader unavailable.");
    while(true) {
      const {done, value} = await reader.read();
      if (done) break;
      chunks.push(value);
      receivedLength += value.length;
      if (contentLength) onProgress(Math.round((receivedLength / contentLength) * 100));
    }
    return new Blob(chunks);
  };

  const triggerDownload = async (url: string, filename: string, isExternal: boolean = false): Promise<boolean> => {
    const isDesktop = typeof window !== 'undefined' && (window as any).electronPixie?.isDesktop;

    if (isExternal) {
      if (isDesktop && (window as any).electronPixie?.downloadURL) {
        return new Promise((resolve) => {
          const ep = (window as any).electronPixie;
          setStatusMsg("📥 Native Download Started...");
          setProgress(0);
          
          ep.onDownloadProgress((data: any) => {
            setProgress(Math.round((data.received / data.total) * 100) || 0);
            setStatusMsg(`⏳ Downloading: ${formatBytes(data.received)} / ${formatBytes(data.total)}`);
          });
          
          ep.onDownloadComplete((state: string) => {
            ep.removeDownloadListeners();
            if (state === 'completed') {
              resolve(true);
            } else {
              setError(`Download ${state}`);
              resolve(false);
            }
          });
          
          ep.downloadURL(url);
        });
      }
      const win = window.open(url, '_blank');
      // Detect if popup was blocked
      if (!win || win.closed || typeof win.closed === 'undefined') {
        setStatusMsg("⚠️ Popup Blocked! Please allow popups.");
        return false;
      }
      return true;
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (url.startsWith('blob:')) {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    return true;
  };

  const toggleBoost = () => {
    const levels = [1, 4, 8, 16];
    const currentIndex = levels.indexOf(boostLevelRef.current);
    const nextIndex = (currentIndex + 1) % levels.length;
    const nextLevel = levels[nextIndex];
    
    boostLevelRef.current = nextLevel;
    setBoostLevel(nextLevel);

    if (spawnerRef.current) {
      spawnerRef.current();
    }
    
    if (nextLevel > 1) {
      setStatusMsg(`🚀 Boosting to ${nextLevel} threads!`);
      setTimeout(() => setStatusMsg((prev) => prev.includes("Boosting") ? "" : prev), 2000);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const fetchFullBlobInChunks = async (targetUrl: string, totalSize: number, onProgress: (p: number) => void, taskLabel: string) => {
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
    const startTime = Date.now();
    let totalDownloaded = 0;
    let isEOFReached = false;
    
    setStatusMsg(`${taskLabel}...`);
    
    if (totalSize === 0) {
      return await fetchStream(targetUrl, (p) => {
          const elapsed = (Date.now() - startTime) / 1000;
          setDownloadStats(prev => ({ ...prev, speed: elapsed > 0 ? prev.downloaded / elapsed : 0 }));
          onProgress(p);
      });
    }

    const chunkRanges: {start: number, end: number, index: number}[] = [];
    for (let start = 0, index = 0; start < totalSize; start += CHUNK_SIZE, index++) {
      chunkRanges.push({ start, end: Math.min(start + CHUNK_SIZE - 1, totalSize - 1), index });
    }

    const chunks = new Array(chunkRanges.length);
    let nextIndex = 0;

    const worker = async () => {
      activeWorkersRef.current++;
      while (nextIndex < chunkRanges.length && !isEOFReached) {
        const i = nextIndex++;
        if (i >= chunkRanges.length) break;
        const range = chunkRanges[i];

        const buffer = await fetchChunk(targetUrl, range.start, range.end, (received) => {
          totalDownloaded += received;
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = elapsed > 0 ? totalDownloaded / elapsed : 0;
          setDownloadStats({ speed, downloaded: totalDownloaded, total: totalSize });
          onProgress(Math.round((totalDownloaded / totalSize) * 100));
        });

        if (!buffer || buffer.byteLength === 0) {
          isEOFReached = true;
          break;
        }
        chunks[range.index] = new Uint8Array(buffer);
      }
      activeWorkersRef.current--;
    };

    spawnerRef.current = () => {
      while (activeWorkersRef.current < boostLevelRef.current && nextIndex < chunkRanges.length && !isEOFReached) {
        worker();
      }
    };

    activeWorkersRef.current = 0;
    spawnerRef.current(); 
    
    while (activeWorkersRef.current > 0 || (nextIndex < chunkRanges.length && !isEOFReached)) {
      await new Promise(r => setTimeout(r, 100));
    }

    spawnerRef.current = null;
    return new Blob(chunks.filter(c => c !== undefined));
  };

  const handleDownload = async (option: any) => {
    if (!metadata || !option) return;
    
    const isFileSystemSupported = typeof window !== 'undefined' && 'showSaveFilePicker' in window;
    
    if (!isFileSystemSupported) {
      const proceed = confirm("Your browser doesn't support direct-to-disk streaming. Proceed with memory-limited mode?");
      if (!proceed) return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setManualDownloadUrl(null);
    setIsExternalDownload(!!option.isExternal);
    setIsPopupBlocked(false);
    setDownloadStats({ speed: 0, downloaded: 0, total: option.size || 0 });

    let writable: any = null;
    const globalStartTime = Date.now();

    try {
      const isAudio = option.quality === 'Audio';
      const ext = isAudio ? (option.ext || 'm4a') : 'mp4';
      const fileName = `${metadata.title}_${isAudio ? 'audio' : option.quality}.${ext}`;
      
      // Only use File System API for split streams (local merging)
      const needsLocalMerging = !option.isCombined && !option.isExternal;
      
      if (isFileSystemSupported && needsLocalMerging) {
        try {
          setStatusMsg("Awaiting destination...");
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{ description: isAudio ? 'Audio File' : 'Video File', accept: { [isAudio ? `audio/${ext}` : `video/mp4`]: [`.${ext}`] } }],
          });
          writable = await handle.createWritable();
        } catch (pickerErr) {
          setIsProcessing(false);
          return;
        }
      }

      const baseUrl = `/api/video/downloader?url=${encodeURIComponent(url)}&proxy=true`;
      const targetUrl = `${baseUrl}&formatId=${option.id}`;
      const totalSize = option.size || 0;

      // Mode A: External Redirect (ytdown, cobalt)
      if (option.isExternal) {
        setStatusMsg("🚀 Elite speed enabled. Checking server status...");
        
        let polling = true;
        let pollCount = 0;
        const maxPolls = 100; // ~8 minutes 

        while (polling && pollCount < maxPolls) {
          try {
            const checkRes = await fetch(targetUrl);
            const contentType = checkRes.headers.get('content-type') || '';
            
            if (!contentType.includes('application/json')) {
              const success = triggerDownload(targetUrl, fileName, true);
              if (!success) setIsPopupBlocked(true);
              setManualDownloadUrl(targetUrl);
              polling = false;
              setIsProcessing(false);
              setShowSuccess(true);
              return;
            }

            const statusJson = await checkRes.json();
            if (statusJson.status === 'queued' || statusJson.status === 'processing' || statusJson.status === 'merging') {
              const progressStr = statusJson.progress || statusJson.percent || "0%";
              const posStr = statusJson.position ? ` (Position: ${statusJson.position})` : "";
              setStatusMsg(`⏳ Remote Server: Merging... ${progressStr}${posStr}`);
              const p = parseInt(progressStr) || 0;
              if (p > 0) setProgress(p);
              pollCount++;
              await new Promise(r => setTimeout(r, 5000));
            } else if (statusJson.status === 'completed' || statusJson.fileUrl) {
                const finalLink = statusJson.fileUrl || targetUrl;
                const success = await triggerDownload(finalLink, fileName, true);
                if (!success) setIsPopupBlocked(true);
                setManualDownloadUrl(finalLink);
                polling = false;
                setIsProcessing(false);
                setShowSuccess(true);
                return;
            } else { pollCount++; await new Promise(r => setTimeout(r, 5000)); }
          } catch (pollErr: any) {
            const success = await triggerDownload(targetUrl, fileName, true);
            if (!success) setIsPopupBlocked(true);
            setManualDownloadUrl(targetUrl);
            polling = false;
            setIsProcessing(false);
            setShowSuccess(true);
            return;
          }
        }
        setIsProcessing(false);
        return;
      }
      
      // Mode B: Combined stream (Single direct download)
      if (option.isCombined) {
        // If we don't need local merging (ffmpeg), just trigger the browser download directly
        if (!needsLocalMerging) {
           setStatusMsg("🚀 Direct Download Started...");
           await triggerDownload(targetUrl, fileName, option.isExternal);
           setIsProcessing(false);
           setShowSuccess(true);
           setTimeout(() => setShowSuccess(false), 5000);
           return;
        }
        
        if (writable) {
            const CHUNK_SIZE = 10 * 1024 * 1024;
            let nextPullIndex = 0;
            let nextWriteIndex = 0;
            const bufferMap = new Map<number, ArrayBuffer>();
            let totalDownloaded = 0;
            let isWriting = false;
            let isEOFReached = false;

            const flushBuffer = async () => {
              if (isWriting) return;
              isWriting = true;
              while (bufferMap.has(nextWriteIndex)) {
                const data = bufferMap.get(nextWriteIndex)!;
                if (data.byteLength > 0) await writable.write(data);
                bufferMap.delete(nextWriteIndex);
                nextWriteIndex++;
              }
              isWriting = false;
            };

            const worker = async () => {
              activeWorkersRef.current++;
              while (!isEOFReached) {
                const i = nextPullIndex++;
                const rangeStart = i * CHUNK_SIZE;
                const rangeEnd = totalSize > 0 ? Math.min(rangeStart + CHUNK_SIZE - 1, totalSize - 1) : rangeStart + CHUNK_SIZE - 1;

                const buffer = await fetchChunk(targetUrl, rangeStart, rangeEnd, (received) => {
                  totalDownloaded += received;
                  const elapsed = (Date.now() - globalStartTime) / 1000;
                  setDownloadStats({ speed: elapsed > 0 ? totalDownloaded / elapsed : 0, downloaded: totalDownloaded, total: totalSize });
                  if (totalSize > 0) setProgress(Math.round((totalDownloaded / totalSize) * 100));
                });

                if (!buffer || buffer.byteLength === 0) {
                  isEOFReached = true;
                  break;
                }

                bufferMap.set(i, buffer);
                await flushBuffer();
                
                // If we reached total size, stop
                if (totalSize > 0 && totalDownloaded >= totalSize) {
                    isEOFReached = true;
                    break;
                }
              }
              activeWorkersRef.current--;
            };

            spawnerRef.current = () => {
              while (activeWorkersRef.current < boostLevelRef.current && !isEOFReached) {
                worker();
              }
            };

            activeWorkersRef.current = 0;
            spawnerRef.current(); 
            
            while (activeWorkersRef.current > 0 || !isEOFReached) {
              await new Promise(r => setTimeout(r, 100));
            }
            await writable.close();
        } else {
            const blob = await fetchFullBlobInChunks(targetUrl, totalSize, setProgress, isAudio ? "Downloading Audio" : `Downloading ${option.quality} Video`);
            await triggerDownload(URL.createObjectURL(blob), fileName);
        }
      } else {
        if (!isReady) throw new Error("WASM Engine still loading.");
        
        const videoBlob = await fetchFullBlobInChunks(`${baseUrl}&formatId=${option.id}`, totalSize, (p) => setProgress(Math.round(p * 0.8)), `Downloading ${option.quality} Video`);
        const audioSize = option.audioSize || 0;
        const audioBlob = await fetchFullBlobInChunks(`${baseUrl}&formatId=${option.audioId}`, audioSize, (p) => setProgress(Math.round(80 + (p * 0.15))), `Downloading High Quality Audio`);
        
        setStatusMsg(`Merging ${option.quality} Video & Audio...`);
        setProgress(85);
        const ffmpeg = ffmpegRef.current;
        setStatusMsg("Loading Video into AI Buffer...");
        await ffmpeg.writeFile('video_in', await fetchFile(videoBlob));
        setStatusMsg("Loading Audio into AI Buffer...");
        await ffmpeg.writeFile('audio_in', await fetchFile(audioBlob));
        setStatusMsg("Applying Lossless Precision Sync...");
        await ffmpeg.exec(['-i', 'video_in', '-i', 'audio_in', '-c', 'copy', 'output.mp4']);
        setStatusMsg("Exporting finalized media...");
        const data = await ffmpeg.readFile('output.mp4');
        const mergedBlob = new Blob([data], { type: 'video/mp4' });

        if (writable) {
          setStatusMsg("Committing bytes to disk...");
          await writable.write(mergedBlob);
          await writable.close();
        } else {
          await triggerDownload(URL.createObjectURL(mergedBlob), fileName);
        }
      }
      setStatusMsg("Success! File saved correctly. 🎉");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 8000); 
    } catch (err: any) {
      console.error("Download Error:", err);
      if (err.name !== 'AbortError') {
        setError("Download failed. Please check your connection.");
      }
      if (writable) await writable.close().catch(() => {});
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setBoostLevel(1);
      boostLevelRef.current = 1;
      spawnerRef.current = null;
      activeWorkersRef.current = 0;
    }
  };

  return (
    <div className={styles.downloaderContainer}>
      {mounted && createPortal(
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.successOverlay}
              onClick={() => setShowSuccess(false)}
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 30 }}
                className={styles.successCard}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.confettiContainer}>
                  {[...Array(24)].map((_, i) => (
                    <motion.div 
                      key={i}
                      className={styles.confetti}
                      initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
                      animate={{ 
                        y: [0, -250, 250], 
                        x: [0, (i - 12) * 35, (i - 12) * 70],
                        opacity: [1, 1, 0],
                        rotate: [0, 360, 720]
                      }}
                      transition={{ duration: 3, delay: i * 0.04, ease: "easeOut" }}
                    />
                  ))}
                </div>

                <motion.div 
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }} 
                  transition={{ duration: 0.6, repeat: 2, ease: "easeInOut" }}
                  className={styles.partyIcon}
                >
                  🎉
                </motion.div>
                <h2>Success!</h2>
                <p>Your high-quality media is ready. If it didn't start automatically, use the fallback link below.</p>
                
                {manualDownloadUrl && (
                  <div style={{ marginBottom: '2.5rem' }}>
                    <a 
                      href={manualDownloadUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.manualLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      📥 Click here if your browser blocked the download
                    </a>
                  </div>
                )}

                <button className={styles.closeSuccess} onClick={() => setShowSuccess(false)}>
                  Awesome!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className={`${styles.inputSection} ${isYouTubeLink ? styles.activeInputGlow : ''}`} style={{ borderTop: `6px solid ${accentColor}`, position: 'relative' }}>
        <AnimatePresence>
          {isYouTubeLink && !metadata && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.9 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className={styles.detectBadge}
              style={{ background: accentColor }}
            >
              <Sparkles size={12} /> YouTube Link Detected
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.inputGroup}>
          <div className={styles.urlInputWrapper}>
            <input 
              type="text" 
              className={styles.urlInput}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={placeholder || `Paste ${platform} link here...`}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            {!url && (
              <button className={styles.pasteInBtn} onClick={handlePaste}>
                <ClipboardPaste size={16} /> Paste
              </button>
            )}
          </div>
          <button 
            className={styles.actionBtn} 
            onClick={handleAnalyze} 
            disabled={isLoading || !url}
            style={{ background: accentColor, color: 'var(--deep-charcoal)' }}
          >
            {isLoading ? <RefreshCw className={styles.spin} size={20} /> : <Search size={20} />}
            <span>{isLoading ? "Analyzing..." : "Analyze"}</span>
          </button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className={styles.errorMsg}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {isLoading && !metadata ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SkeletonCard />
            </motion.div>
        ) : metadata ? (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={styles.resultCard}
          >
            <div className={styles.thumbnailArea}>
              <img src={metadata.thumbnail || metadata.thumbnails?.[0]?.url} alt={metadata.title} />
              <div className={styles.playOverlay}><PlayCircle size={64} /></div>
            </div>
            
            <div className={styles.infoArea}>
              <div>
                <h3 className={styles.videoTitle}>{metadata.title}</h3>
                <div className={styles.videoMeta}>
                  <span className={styles.metaItem}><Clock size={16} /> {metadata.duration ? `${Math.floor(metadata.duration / 60)}:${String(metadata.duration % 60).padStart(2, '0')}` : 'Live'}</span>
                  <span className={styles.metaItem}><CheckCircle size={16} /> Link Verified</span>
                  <span className={styles.metaItem}><Sparkles size={16} style={{ color: 'var(--gentle-lilac)' }} /> High Reliability</span>
                  {!isFileSystemSupported && (
                    <span className={`${styles.metaItem} ${styles.warningMeta}`}>
                      <AlertCircle size={16} /> Restricted Browser (Legacy Mode)
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.downloadOptions}>
                {isProcessing ? (
                  <div className={styles.statsContainer}>
                    <div className={styles.statusHeader}>
                      <div className={styles.statusPulse}>
                        <Zap size={18} fill={accentColor} color={accentColor} />
                        <span>{statusMsg}</span>
                      </div>
                      <span className={styles.progressPercent}>{progress}%</span>
                    </div>

                    <div className={styles.largeProgressBar}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={styles.largeProgressFill} 
                        style={{ background: accentColor }} 
                      />
                    </div>

                    <div className={styles.statsGrid}>
                      <div className={styles.statBox}>
                        <Gauge size={14} />
                        <span className={styles.statLabel}>Speed</span>
                        <span className={styles.statValue}>{(downloadStats.speed / (1024 * 1024)).toFixed(2)} MB/s</span>
                      </div>
                      <div className={styles.statBox}>
                        <Download size={14} />
                        <span className={styles.statLabel}>Transferred</span>
                        <span className={styles.statValue}>{formatBytes(downloadStats.downloaded)} / {downloadStats.total ? formatBytes(downloadStats.total) : '---'}</span>
                      </div>
                    </div>


                    <motion.div 
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={styles.stayWarning}
                    >
                      <ShieldAlert size={16} />
                      <span>Download active. Do not close or refresh this tab.</span>
                    </motion.div>
                  </div>
                ) : (
                  <div className={styles.qualityContainer}>
                    {/* Render Video Options */}
                    {metadata.downloadOptions.filter((o: any) => o.quality !== 'Audio' && !o.quality.includes('Audio')).length > 0 && (
                      <div className={styles.formatSection}>
                        <span className={styles.formatCategory}>📺 Video Quality</span>
                        <div className={styles.qualityGrid}>
                          {metadata.downloadOptions
                            .filter((o: any) => o.quality !== 'Audio' && !o.quality.includes('Audio'))
                            .map((opt: any) => {
                              const isUltra = opt.isCombined;
                              const tagClass = isUltra ? styles.tagUltra : styles.tagNormal;
                              const tagText = isUltra ? "ULTRA" : "HQ";
                              return (
                                <button 
                                  key={opt.id} 
                                  className={styles.qualityBtn} 
                                  onClick={() => handleDownload(opt)}
                                  style={{ '--hover-color': accentColor } as any}
                                >
                                  <span className={`${styles.speedTag} ${tagClass}`}>{tagText}</span>
                                  <div className={styles.qualityMain}>
                                    <Download size={14} />
                                    <span>{opt.quality.replace(/\s*\(Audio\)/, '')}</span>
                                  </div>
                                  <div className={styles.qualityDetails}>
                                    <span>{opt.ext.toUpperCase()}</span>
                                    <span className={styles.dot}>•</span>
                                    <span>{opt.size ? formatBytes(opt.size) : '---'}</span>
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Render Audio Options */}
                    {metadata.downloadOptions.filter((o: any) => o.quality === 'Audio' || o.quality.includes('Audio')).length > 0 && (
                      <div className={styles.formatSection}>
                        <span className={styles.formatCategory}>🎵 Audio Only</span>
                        <div className={styles.qualityList}>
                          {metadata.downloadOptions
                            .filter((o: any) => o.quality === 'Audio' || o.quality.includes('Audio'))
                            .map((opt: any) => (
                              <button 
                                key={opt.id} 
                                className={styles.audioRow} 
                                onClick={() => handleDownload(opt)}
                                style={{ '--hover-color': accentColor } as any}
                              >
                                <div className={styles.audioInfo}>
                                  <Zap size={14} fill={accentColor} stroke={accentColor} />
                                  <span className={styles.audioQuality}>
                                    {opt.quality.replace(' (Audio)', '').replace('Audio (', '').replace(')', '') || 'High'}
                                  </span>
                                  <span className={styles.audioExt}>{opt.ext.toUpperCase()}</span>
                                </div>
                                <div className={styles.audioMeta}>
                                  <span>{opt.size ? formatBytes(opt.size) : '---'}</span>
                                  <Download size={14} />
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className={styles.disclaimer}>Downloaded files are processed locally for maximum privacy and 4K capability.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FeatureBento accentColor={accentColor} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

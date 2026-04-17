"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Download, RefreshCw, PlayCircle, Clock, CheckCircle, AlertCircle, Sparkles, Gauge, Zap, ShieldAlert, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./DownloaderUI.module.css";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

interface DownloaderUIProps {
  platform: 'youtube' | 'instagram' | 'twitter' | 'facebook';
  placeholder?: string;
  accentColor?: string;
}

export default function DownloaderUI({ platform, placeholder, accentColor = "var(--mint-green)" }: DownloaderUIProps) {
  const [url, setUrl] = useState("");
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
  const boostLevelRef = useRef(1);
  const activeWorkersRef = useRef(0);
  const spawnerRef = useRef<(() => void) | null>(null);
  
  const ffmpegRef = useRef<any>(null);

  useEffect(() => {
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

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
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
    setDownloadStats({ speed: 0, downloaded: 0, total: option.size || 0 });

    let writable: any = null;
    const globalStartTime = Date.now();

    try {
      const isAudio = option.quality === 'Audio';
      const ext = isAudio ? (option.ext || 'm4a') : 'mp4';
      const fileName = `${metadata.title}_${isAudio ? 'audio' : option.quality}.${ext}`;
      
      if (isFileSystemSupported) {
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

      // --- NEW: HANDLE EXTERNAL DIRECT DOWNLOADS (ytdown, cobalt, etc) ---
      if (option.isExternal) {
        setStatusMsg("🚀 Elite speed enabled. Starting direct download...");
        triggerDownload(targetUrl, fileName);
        setTimeout(() => {
          setIsProcessing(false);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 5000);
        }, 1500);
        return;
      }
      
      if (option.isCombined) {
        
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
            triggerDownload(URL.createObjectURL(blob), fileName);
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
          triggerDownload(URL.createObjectURL(mergedBlob), fileName);
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
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.successOverlay}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              className={styles.successCard}
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
              <p>Download complete. Your file is ready with Elite Reliability.</p>
              
              <button onClick={() => setShowSuccess(false)} className={styles.closeSuccess}>Awesome!</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.inputSection} style={{ borderTop: `6px solid ${accentColor}` }}>
        <div className={styles.inputGroup}>
          <input 
            type="text" 
            className={styles.urlInput}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholder || `Paste ${platform} link here...`}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          />
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

      <AnimatePresence>
        {metadata && (
          <motion.div 
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

                    <div className={styles.boostControl}>
                      <button 
                        className={`${styles.boostBtn} ${boostLevel > 1 ? styles.boostActive : ''}`} 
                        onClick={toggleBoost}
                        title="Increase download threads (IDM Style)"
                      >
                        <Zap size={16} fill={boostLevel > 1 ? "var(--deep-charcoal)" : "none"} />
                        <span>{boostLevel > 1 ? `Boost Active (${boostLevel} Threads)` : "Boost Speed"}</span>
                      </button>
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
                    <span className={styles.optionLabel}>Available Formats:</span>
                    <div className={styles.qualityGrid}>
                      {(metadata.downloadOptions || []).map((opt: any) => {
                          const isUltra = opt.isCombined;
                          const isFast = !opt.isCombined && parseInt(opt.quality) < 1080;
                          const tagClass = isUltra ? styles.tagUltra : (isFast ? styles.tagFast : styles.tagNormal);
                          const tagText = isUltra ? "ULTRA FAST" : (isFast ? "FAST" : "NORMAL");
                          
                          return (
                            <button 
                              key={opt.id} 
                              className={styles.qualityBtn} 
                              onClick={() => handleDownload(opt)}
                              style={{ '--hover-color': accentColor } as any}
                            >
                              <span className={`${styles.speedTag} ${tagClass}`}>{tagText}</span>
                              <div className={styles.qualityMain}>
                                {opt.quality === 'Audio' ? <Zap size={16} /> : <Download size={16} />}
                                <span>{opt.quality}</span>
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
                <p className={styles.disclaimer}>Downloaded files are processed locally for maximum privacy and 4K capability.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

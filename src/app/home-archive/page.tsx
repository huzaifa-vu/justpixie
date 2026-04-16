"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import MarketingWrapper from "@/components/MarketingWrapper";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wand2, ArrowRight, UploadCloud, Shield, Zap, Layers, Image as ImageIcon, Video, FileText, Code, Lock, RefreshCw, AlertCircle, ChevronDown, ArrowDown, FileCode, X, Scissors, Merge, Music, FileJson } from "lucide-react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import { setAiState } from "@/utils/aiTransferCache";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const FilePreview = ({ file, onRemove }: { file: File, onRemove: () => void }) => {
  const [thumb, setThumb] = useState<string | null>(null);
  
  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setThumb(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div className={styles.fileChip}>
      {thumb ? (
        <img src={thumb} alt="thumb" className={styles.fileThumb} />
      ) : (
        <div className={styles.fileIconThumb}>
          <FileText size={12} />
        </div>
      )}
      <span>{file.name.length > 20 ? file.name.slice(0, 17) + "..." : file.name}</span>
      <X size={14} className={styles.chipRemove} onClick={(e) => { e.stopPropagation(); onRemove(); }} />
    </div>
  );
};

const TypewriterPlaceholder = () => {
  const placeholders = [
    "Compress this image to 200kb...",
    "Remove audio from this video...",
    "Turn this PDF into images...",
    "Remove the background from this JPG...",
    "Merge these PDFs together...",
  ];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isDeleting) {
      if (currentText === "") {
        setIsDeleting(false);
        setCurrentIndex((prev) => (prev + 1) % placeholders.length);
        timeout = setTimeout(() => {}, 500); // Wait before typing next
      } else {
        timeout = setTimeout(() => {
          setCurrentText(currentText.slice(0, -1));
        }, 50); // Deleting speed
      }
    } else {
      if (currentText === placeholders[currentIndex]) {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 2000); // Wait before deleting
      } else {
        timeout = setTimeout(() => {
          setCurrentText(placeholders[currentIndex].slice(0, currentText.length + 1));
        }, 100); // Typing speed
      }
    }

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentIndex]);

  return currentText;
};

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [dataText, setDataText] = useState("");
  const [dataExpanded, setDataExpanded] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- GSAP REFS ---
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const bentoRef = useRef<HTMLDivElement>(null);
  const horizontalWrapRef = useRef<HTMLDivElement>(null);
  const horizontalTrackRef = useRef<HTMLDivElement>(null);
  const stepsWrapRef = useRef<HTMLDivElement>(null);
  const vaultRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // 1. Initial Hero Stagger (Aggressive 3D Physics)
    const tl = gsap.timeline();
    tl.fromTo(titleRef.current, 
      { y: 120, rotateX: -50, scale: 0.9, opacity: 0 }, 
      { y: 0, rotateX: 0, scale: 1, opacity: 1, duration: 1.6, ease: "elastic.out(1, 0.4)", transformOrigin: "bottom center" }
    )
    .fromTo(subtitleRef.current, 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
      "-=1.2"
    )
    .fromTo(promptRef.current,
      { y: 60, opacity: 0, scale: 0.85, rotateX: -20 },
      { y: 0, opacity: 1, scale: 1, rotateX: 0, duration: 1.4, ease: "elastic.out(1.2, 0.5)", transformOrigin: "bottom center" },
      "-=0.9"
    );

    // 2. Slow Orbiting Blobs with Parallax Scroll mapping
    const blobs = gsap.utils.toArray(`.${styles.bgBlob}`);
    blobs.forEach((blob: any, i: number) => {
      // Continuous float
      gsap.to(blob, {
        x: "random(-200, 200)",
        y: "random(-200, 200)",
        rotation: "random(-90, 90)",
        duration: "random(15, 25)",
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      
      // Intense scroll parallax
      gsap.to(blob, {
        yPercent: i === 0 ? 60 : -40,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.5
        }
      });
    });

    // 3. Cinematic Horizontal Scroll Pin (Why Sorcerers Love Pixie)
    if (horizontalWrapRef.current && horizontalTrackRef.current) {
      const distance = horizontalTrackRef.current.scrollWidth - window.innerWidth;
      gsap.to(horizontalTrackRef.current, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: horizontalWrapRef.current,
          pin: true,
          scrub: 1.5,
          end: () => "+=" + (distance * 1.5), // Extend scroll bounds so it animates smoother and slower
        }
      });
    }

    // 4. Parallax Bento Explosion
    if (bentoRef.current) {
      const items = gsap.utils.toArray(bentoRef.current.children);
      items.forEach((item: any, i) => {
        gsap.fromTo(item, 
          { y: 150 + (i * 30), opacity: 0, scale: 0.9 },
          { 
            y: 0, opacity: 1, scale: 1,
            ease: "back.out(1)",
            scrollTrigger: {
              trigger: item,
              start: "top 95%",
              end: "top 60%",
              scrub: 1.5
            }
          }
        );
      });
    }
    
    // 5. Steps Vertical Slide-Up Reveal
    if (stepsWrapRef.current) {
      gsap.fromTo(gsap.utils.toArray('.stepRevealItem'),
        { y: 100, opacity: 0, scale: 0.9 },
        { 
          y: 0, opacity: 1, scale: 1,
          stagger: 0.2, 
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: stepsWrapRef.current,
            start: "top 60%",
            end: "bottom 80%",
            scrub: 1
          }
        }
      );
    }

    // 6. Local Privacy Vault (Doors start closed, then unveil)
    if (vaultRef.current) {
      const leftDoor = vaultRef.current.querySelector('.vaultDoorLeft');
      const rightDoor = vaultRef.current.querySelector('.vaultDoorRight');
      
      // Initialize doors closed
      gsap.set(leftDoor, { xPercent: 0 });
      gsap.set(rightDoor, { xPercent: 0 });

      const tlVault = gsap.timeline({
        scrollTrigger: {
          trigger: vaultRef.current,
          start: "top top",
          end: "+=150%",
          scrub: 1,
          pin: true
        }
      });
      
      tlVault.to(leftDoor, { xPercent: -100, ease: "power2.inOut" }, 0)
             .to(rightDoor, { xPercent: 100, ease: "power2.inOut" }, 0)
             .fromTo('.vaultIconPulse', { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 }, 0.2)
             .fromTo('.vaultTextReveal', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.1 }, 0.3);
    }
  }, { scope: containerRef });

  // Detect if user accidentally pasted data into the instruction bar
  const dataInPromptWarning = useMemo(() => {
    if (prompt.length < 150) return false;
    const looksLikeData = /^[\[{]/.test(prompt.trim()) || 
                          prompt.includes("\n") ||
                          (prompt.split(",").length > 4 && prompt.length > 150);
    return looksLikeData;
  }, [prompt]);

  // Auto-expand data zone if error is thrown
  useEffect(() => {
    if (dataInPromptWarning && !dataExpanded) {
      setDataExpanded(true);
    }
  }, [dataInPromptWarning, dataExpanded]);

  // Auto-expand/collapse data zone when prompt transitions between empty/non-empty
  const prevPromptLen = useRef(0);
  useEffect(() => {
    if (prompt.trim().length > 0 && prevPromptLen.current === 0) {
      setDataExpanded(true);
    } else if (prompt.trim().length === 0 && prevPromptLen.current > 0) {
      if (dataText.trim().length === 0 && selectedFiles.length === 0) {
        setDataExpanded(false);
      }
    }
    prevPromptLen.current = prompt.trim().length;
  }, [prompt, dataText, selectedFiles.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      if (!dataExpanded) setDataExpanded(true);
    }
  };

  const handlePromptPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      const newFiles = Array.from(e.clipboardData.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      if (!dataExpanded) setDataExpanded(true);
    }
  };

  const handlePromptMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!promptRef.current) return;
    const rect = promptRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPct = x / rect.width - 0.5;
    const yPct = y / rect.height - 0.5;
    
    gsap.to(promptRef.current, {
      rotateY: xPct * 15,
      rotateX: -yPct * 15,
      duration: 0.5,
      ease: "power2.out",
      transformPerspective: 1000
    });
  };

  const handlePromptMouseLeave = () => {
    if (!promptRef.current) return;
    gsap.to(promptRef.current, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.8,
      ease: "elastic.out(1, 0.5)"
    });
  };

  const removeFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePromptSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!prompt.trim() && !dataText.trim() && selectedFiles.length === 0) || isThinking || dataInPromptWarning) return;
    
    setIsThinking(true);
    
    try {
      const res = await fetch("/api/ai/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt })
      });

      if (!res.ok) {
        if (res.status === 403 || res.status === 429) {
          router.push("/dashboard");
          return;
        }
        throw new Error("Failed to resolve route");
      }

      const data = await res.json();
      
      const mergedParams = { ...data.params };
      if (dataText.trim()) {
        if (!mergedParams.inputText) mergedParams.inputText = dataText;
        if (data.route.includes("/diff") && !mergedParams.oldText) mergedParams.oldText = dataText;
      }

      setAiState({
        targetRoute: data.route,
        files: selectedFiles,
        params: mergedParams,
        autoExecute: data.autoExecute ?? false
      });
      
      router.push(data.route);
    } catch (err) {
      console.error(err);
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handlePromptSubmit();
  };

  return (
    <MarketingWrapper>
      <div ref={containerRef} style={{ width: '100%' }}>
        {/* Magical Background Blobs */}
        <div className={`${styles.bgBlob} ${styles.blobTeal}`} />
        <div className={`${styles.bgBlob} ${styles.blobGold}`} />

        {/* Hero Content */}
        <main className={styles.main}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.badge}>
              <Sparkles size={16} /> Effortless Local File Magic
            </div>
            
            <h1 ref={titleRef} className={styles.title} style={{ opacity: 0 }}>
              Transform your files with a <span className={styles.titleHighlight}>single command.</span>
            </h1>
            
            <p ref={subtitleRef} className={styles.subtitle} style={{ opacity: 0 }}>
              Upload a file, tell Pixie what to do, and watch the magic happen instantly. 
              Everything runs locally in your browser—no servers, no waiting.
            </p>

            <div 
              ref={promptRef} 
              style={{ opacity: 0 }} 
              className={`${styles.promptForm} ${dataInPromptWarning ? styles.promptFormHighlighted : ''}`}
              onMouseMove={handlePromptMouseMove}
              onMouseLeave={handlePromptMouseLeave}
            >
            <div className={styles.trapIcon}>
              <Wand2 size={24} />
            </div>
            
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePromptPaste}
                maxLength={200}
                disabled={isThinking}
                className={styles.promptInput}
                placeholder={TypewriterPlaceholder()}
              />
            </div>

            <button 
              className={styles.submitBtn}
              disabled={(!prompt.trim() && !dataText.trim() && selectedFiles.length === 0) || isThinking || dataInPromptWarning}
              onClick={() => handlePromptSubmit()}
            >
              {isThinking ? <RefreshCw size={24} className={styles.spinIcon || styles.spin} /> : <ArrowRight size={24} />}
            </button>
          </div>
          
          <div className={styles.inputHint}>
            <span>Press <strong>Enter</strong> to cast spell</span>
          </div>

          {/* Soft Error when user pastes large data in the prompt */}
          <AnimatePresence>
            {dataInPromptWarning && (
              <motion.div 
                initial={{ opacity: 0, y: -10, height: 0 }} 
                animate={{ opacity: 1, y: 0, height: 'auto' }} 
                exit={{ opacity: 0, y: -10, height: 0 }}
                className={styles.dataErrorPrompt}
                style={{ position: 'relative', zIndex: 10, maxWidth: '800px', margin: '1rem auto 0' }}
              >
                <div className={styles.errorIconBox}>
                  <AlertCircle size={16} />
                </div>
                <div className={styles.errorContent}>
                  <strong>Whoops! That's a bit too much text for a prompt.</strong>
                  <span>To process this securely, please cut the large data from the box above and paste it into the highlighted Data Zone below.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Zone 2: Data Payload Toggle */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button 
              className={styles.dataToggle}
              onClick={() => setDataExpanded(!dataExpanded)}
              style={{ color: 'var(--text-muted)' }}
            >
              <motion.div animate={{ rotate: dataExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={16} />
              </motion.div>
              <span>{dataExpanded ? 'Collapse Data' : 'Attach Data'}</span>
              <span className={styles.localBadge}><Lock size={10} /> Local only</span>
              {!dataExpanded && (dataText.trim() || selectedFiles.length > 0) && (
                <span className={styles.dataDot} />
              )}
            </button>
          </div>

          {/* Overlay to dim background when there's a data placement error */}
          <AnimatePresence>
            {dataInPromptWarning && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.focusOverlay} 
              />
            )}
          </AnimatePresence>

          {/* Zone 2: Data Payload Content */}
          <AnimatePresence>
            {dataExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                style={{ overflow: 'hidden', width: '100%', maxWidth: '800px', margin: '0 auto' }}
              >
                {dataInPromptWarning && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.pointerLabelData}>
                    <ArrowDown size={14} /> Paste your massive data here
                  </motion.div>
                )}
                <div className={`${styles.dataZone} ${dataInPromptWarning ? styles.dataZoneHighlighted : ''}`}>
                  {/* Text Payload */}
                  <div className={styles.dataTextPanel}>
                    <div className={styles.dataPanelLabel}>
                      <FileCode size={14} />
                      <span>Text / JSON / CSV / Code</span>
                    </div>
                    <textarea
                      className={styles.dataTextarea}
                      value={dataText}
                      onChange={(e) => setDataText(e.target.value)}
                      placeholder="Paste your data here — it stays 100% on your device and never reaches the AI model."
                    />
                    {dataText.trim() && (
                      <div className={styles.dataStats}>
                        {dataText.length.toLocaleString()} chars
                      </div>
                    )}
                  </div>

                  {/* File Drop Zone */}
                  <div className={styles.dataFilePanel}>
                    <div className={styles.dataPanelLabel}>
                      <UploadCloud size={14} />
                      <span>Files</span>
                    </div>
                    <div 
                      className={styles.fileDropArea}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud size={24} style={{ opacity: 0.4 }} />
                      <span>Click or drag files here</span>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className={styles.uploadInput}
                      onChange={handleFileChange}
                      multiple
                    />
                    
                    {/* File chips */}
                    {selectedFiles.length > 0 && (
                      <div className={styles.fileChips}>
                        {selectedFiles.map((f, i) => (
                          <FilePreview key={`${f.name}-${i}`} file={f} onRemove={() => removeFile(i)} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Horizontal Scroll Track - Full Bleed Cinematic */}
      <section ref={horizontalWrapRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'transparent', position: 'relative', marginTop: '4rem', display: 'flex', flexDirection: 'column' }}>
        <div className={styles.sectionHeader} style={{ flexShrink: 0, padding: '4rem 0 0 0', textAlign: 'center', zIndex: 10 }}>
          <h2 style={{ fontSize: '3rem' }}>Why Sorcerers Love Pixie</h2>
          <p style={{ fontSize: '1.25rem' }}>The ultimate toolkit, natively processed on your hardware.</p>
        </div>
        
        <div ref={horizontalTrackRef} style={{ display: 'flex', width: '300vw', flex: 1, alignItems: 'center' }}>
          <div style={{ width: '100vw', padding: '0 5rem' }}>
             <div className={styles.horizontalSlide}>
                <div className={styles.featureIcon}><Code size={48} /></div>
                <h3 className={styles.featureTitle}>Zero Servers</h3>
                <p className={styles.featureDesc}>All operations run inside your browser using WebAssembly. Your files never touch a cloud API or server database.</p>
             </div>
          </div>
          <div style={{ width: '100vw', padding: '0 5rem' }}>
             <div className={styles.horizontalSlide}>
                <div className={styles.featureIcon}><Zap size={48} /></div>
                <h3 className={styles.featureTitle}>Lightning Fast</h3>
                <p className={styles.featureDesc}>No upload waiting times. No download speeds. Pixie forces your device's native CPU and memory to compute file buffers directly.</p>
             </div>
          </div>
          <div style={{ width: '100vw', padding: '0 5rem' }}>
             <div className={styles.horizontalSlide}>
                <div className={styles.featureIcon}><Lock size={48} /></div>
                <h3 className={styles.featureTitle}>Absolute Privacy</h3>
                <p className={styles.featureDesc}>Perfect for enterprise codebase diffing and HIPAA PDF parsing. What enters your tab, dies when you close the tab. Guaranteed.</p>
             </div>
          </div>
        </div>
      </section>

      {/* The Sticky Stacking Deck of Cards */}
      <section className={styles.sectionAlt} style={{ paddingBottom: '10vh' }}>
        <div className={styles.sectionHeader}>
          <h2 style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>A Spell For Every Format</h2>
          <p style={{ fontSize: '1.25rem' }}>Stacked deep with native client-side processing tools.</p>
        </div>
        
        <div className={styles.stackDeck}>
          {/* Card 1 */}
          <div className={styles.stackCard} style={{ background: 'linear-gradient(135deg, rgba(254, 215, 170, 0.4), rgba(253, 186, 116, 0.4))', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', top: '15vh' }}>
            <div className={styles.stackCardContent}>
              <div className={styles.stackIcon} style={{ background: '#ea580c', color: '#fff' }}><ImageIcon size={32} /></div>
              <h3 className={styles.stackTitle}>Image Alchemy</h3>
              <p className={styles.stackDesc}>Automatically strip backgrounds natively via browser tensors. Bulk compress formats, transform layers to WebP, and extract palette matrices instantly.</p>
            </div>
          </div>
          {/* Card 2 */}
          <div className={styles.stackCard} style={{ background: 'linear-gradient(135deg, rgba(191, 219, 254, 0.4), rgba(147, 197, 253, 0.4))', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', top: '18vh' }}>
            <div className={styles.stackCardContent}>
              <div className={styles.stackIcon} style={{ background: '#2563eb', color: '#fff' }}><FileText size={32} /></div>
              <h3 className={styles.stackTitle}>PDF Conjuring</h3>
              <p className={styles.stackDesc}>Shatter PDFs into individual SVGs. Merge invoices, rip watermarks via OCR extraction, and shrink huge documentation stacks natively.</p>
            </div>
          </div>
          {/* Card 3 */}
          <div className={styles.stackCard} style={{ background: 'linear-gradient(135deg, rgba(233, 213, 255, 0.4), rgba(216, 180, 254, 0.4))', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', top: '21vh' }}>
            <div className={styles.stackCardContent}>
              <div className={styles.stackIcon} style={{ background: '#9333ea', color: '#fff' }}><Code size={32} /></div>
              <h3 className={styles.stackTitle}>Developer Matrix</h3>
              <p className={styles.stackDesc}>Diff massive code repositories locally. Format complex SQL payloads, validate nested JSON, and transpile TSX to raw JS without sending source to a remote host.</p>
            </div>
          </div>
          {/* Card 4 */}
          <div className={styles.stackCard} style={{ background: 'linear-gradient(135deg, rgba(254, 205, 211, 0.4), rgba(253, 164, 175, 0.4))', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', top: '24vh' }}>
            <div className={styles.stackCardContent}>
              <div className={styles.stackIcon} style={{ background: '#e11d48', color: '#fff' }}><Video size={32} /></div>
              <h3 className={styles.stackTitle}>WASM Media Vault</h3>
              <p className={styles.stackDesc}>We ported FFmpeg directly to WebAssembly. Strip audio channels from gigabyte MP4s right in the browser. Pure computational magic.</p>
            </div>
          </div>
        </div>
      </section>

      {/* New Vault Section */}
      <section ref={vaultRef} className={styles.vaultWrapper}>
        <div className={`vaultDoorLeft ${styles.vaultDoorLeft}`} />
        <div className={`vaultDoorRight ${styles.vaultDoorRight}`} />
        
        <div className={styles.vaultContent}>
          <div className={`vaultIconPulse ${styles.vaultIconPulse}`}>
            <Shield size={64} />
          </div>
          <h2 className={`vaultTextReveal ${styles.vaultTitle}`}>Total Local Isolation</h2>
          <p className={`vaultTextReveal`} style={{ fontSize: '1.5rem', color: '#9ca3af', maxWidth: '600px', lineHeight: 1.6 }}>
            When you operate inside Pixie, the tab becomes a sealed environment. Data enters, but it never connects to an external database.
          </p>
        </div>
      </section>

      {/* Sticky Scroll Reveal - Magic in Three Steps */}
      <section ref={stepsWrapRef} style={{ display: 'flex', flexWrap: 'wrap', width: '100%', maxWidth: '1400px', margin: '15rem auto 5rem auto', position: 'relative' }}>
        <div style={{ flex: '1 1 400px', padding: '4rem' }}>
          <div style={{ position: 'sticky', top: '35vh' }}>
            <h2 className={styles.sectionTitle} style={{ fontSize: '4rem', lineHeight: 1.1 }}>Magic in<br/>Three Steps</h2>
            <p className={styles.sectionSubtitle} style={{ textAlign: 'left', margin: '2rem 0 0 0', fontSize: '1.25rem' }}>You don't need to know complex terminal commands. Just tell Faye exactly what you need.</p>
          </div>
        </div>
        
        <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '30vh', paddingBottom: '20vh', paddingRight: '2rem' }}>
          <div className={`stepRevealItem ${styles.featureCard}`} style={{ padding: '4rem', textAlign: 'left', width: '100%' }}>
            <div className={styles.stepNumber} style={{ margin: '0 0 2rem 0', width: '64px', height: '64px', fontSize: '1.5rem' }}>1</div>
            <h3 className={styles.stepTitle} style={{ fontSize: '2.5rem' }}>Upload Context</h3>
            <p className={styles.featureDesc} style={{ fontSize: '1.25rem' }}>Securely drop your image, PDF, audio, or video file into the heavy glass Pixie Trap. It never leaves your PC.</p>
          </div>

          <div className={`stepRevealItem ${styles.featureCard}`} style={{ padding: '4rem', textAlign: 'left', width: '100%' }}>
            <div className={styles.stepNumber} style={{ margin: '0 0 2rem 0', width: '64px', height: '64px', fontSize: '1.5rem' }}>2</div>
            <h3 className={styles.stepTitle} style={{ fontSize: '2.5rem' }}>Cast a Spell</h3>
            <p className={styles.featureDesc} style={{ fontSize: '1.25rem' }}>Type your intent like "Remove background" or "Compress this PDF". The Gemini AI matrix translates your natural language instantly.</p>
          </div>

          <div className={`stepRevealItem ${styles.featureCard}`} style={{ padding: '4rem', textAlign: 'left', width: '100%' }}>
            <div className={styles.stepNumber} style={{ margin: '0 0 2rem 0', width: '64px', height: '64px', fontSize: '1.5rem' }}>3</div>
            <h3 className={styles.stepTitle} style={{ fontSize: '2.5rem' }}>Download Result</h3>
            <p className={styles.featureDesc} style={{ fontSize: '1.25rem' }}>Our browser-based WASM engine processes your file parameter at warp speed. Grab the returned file.</p>
          </div>
        </div>
      </section>

      {/* Massive Glowing CTA Footplate */}
      <section className={styles.ctaSection}>
        <div style={{ position: 'relative', zIndex: 10 }}>
            <h2>Ready to cast your first spell?</h2>
            <p style={{ fontSize: '1.5rem', marginBottom: '3rem', color: 'var(--text-muted)' }}>Join thousands of super-users privately transforming their files locally.</p>
            <button className={styles.loginBtn} onClick={() => router.push('/dashboard')} style={{ padding: '1.5rem 4rem', fontSize: '1.25rem' }}>Enter The Trap</button>
        </div>
      </section>
      </div>
    </MarketingWrapper>
  );
}

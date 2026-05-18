"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, UploadCloud, ArrowRight, FileImage, FileText, Film, Code, Sparkles, Type, Loader2, X, AlertCircle, ChevronDown, Lock, FileCode, LogIn, ArrowDown, Download, HelpCircle, CornerDownLeft, WifiOff } from "lucide-react";
import styles from "./page.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setAiState } from "@/utils/aiTransferCache";
import { createClient } from "@/utils/supabase/client";
import { useQuota } from "@/hooks/useQuota";
import { useFileDrop } from "@/hooks/useFileDrop";
import { useFileDropContext } from "@/contexts/FileDropContext";
import { TOOLS_REGISTRY } from "@/utils/toolsRegistry";

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

// Typewriter effect custom hook for dashboard input
const useTypewriter = () => {
  const placeholders = [
    "Compress this image to 200kb...",
    "Remove audio from this video...",
    "Turn this PDF into images...",
    "Remove the background from this JPG...",
    "Merge these PDFs together...",
    "Convert my CSV to JSON...",
  ];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentText, setCurrentText] = useState("Compress this image to 200kb...");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isDeleting) {
      if (currentText === "") {
        setIsDeleting(false);
        setCurrentIndex((prev) => (prev + 1) % placeholders.length);
        timeout = setTimeout(() => {}, 500);
      } else {
        timeout = setTimeout(() => {
          setCurrentText(currentText.slice(0, -1));
        }, 30);
      }
    } else {
      if (currentText === placeholders[currentIndex]) {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 1800);
      } else {
        timeout = setTimeout(() => {
          setCurrentText(placeholders[currentIndex].slice(0, currentText.length + 1));
        }, 60);
      }
    }

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentIndex]);

  return currentText;
};

export default function DashboardHome() {
  const [instruction, setInstruction] = useState("");
  const [dataText, setDataText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiError, setAiError] = useState("");
  const [showUnsupportedModal, setShowUnsupportedModal] = useState(false);
  const [dataExpanded, setDataExpanded] = useState(false); // Collapsed by default
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const { guestUsed, guestLimit, guestRemaining, syncLimitReached } = useQuota(user);
  const { setInternalDragging } = useFileDropContext();

  // Onboarding & Trust Helpers
  const typewriterPlaceholder = useTypewriter();
  const [showTipBanner, setShowTipBanner] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("pixie_onboarded");
      if (!dismissed) {
        setShowTipBanner(true);
      }
    }
  }, []);

  const dismissTipBanner = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pixie_onboarded", "1");
    }
    setShowTipBanner(false);
  };

  // Sample load helpers
  const handleSampleCSV = () => {
    setInstruction("Convert my CSV to JSON");
    setDataText(`id,name,role,department\n1,Alice Vance,Software Engineer,Engineering\n2,Bob Miller,UX Designer,Product\n3,Charlie Dev,WASM Wizard,Core`);
    setSelectedFiles([]);
    setDataExpanded(true);
  };

  const handleSampleImage = async () => {
    setInstruction("Compress this image");
    setDataText("");
    setDataExpanded(true);
    setIsThinking(true);
    try {
      const res = await fetch("/apple-touch-icon.png");
      const blob = await res.blob();
      const file = new File([blob], "apple-touch-icon.png", { type: "image/png" });
      setSelectedFiles([file]);
    } catch (e) {
      console.error("Failed to load sample image", e);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSampleWordCount = () => {
    setInstruction("Count the words in my text");
    setDataText("Pixie is a high-performance, local-first, serverless file conversion application.\n100% of processing happens inside your browser using WebAssembly (WASM). No files are ever uploaded to a server, ensuring absolute privacy and zero lag!");
    setSelectedFiles([]);
    setDataExpanded(true);
  };

  // Register with global D&D system
  useFileDrop({
    onDrop: (files) => {
      setSelectedFiles(prev => [...prev, ...files]);
      setDataExpanded(true); // Open the panel so the user sees the attached files
    }
  });

  // Check auth state
  useEffect(() => {
    const supabase = createClient();

    // If user just returned from a successful Lemon Squeezy checkout, force-refresh their JWT token 
    if (typeof window !== "undefined" && window.location.search.includes("success=true")) {
      supabase.auth.refreshSession().then(() => {
        // Clean up URL silently
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
      setUser(session?.user ?? null);
    }).catch(() => {
      // Supabase unreachable — treat as guest
      setIsLoggedIn(false);
      setUser(null);
    });
  }, []);

  // Detect if user accidentally pasted data into the instruction bar
  const dataInPromptWarning = useMemo(() => {
    if (instruction.length < 150) return false;
    const looksLikeData = /^[\[{]/.test(instruction.trim()) || 
                          instruction.includes("\n") ||
                          (instruction.split(",").length > 4 && instruction.length > 150);
    return looksLikeData;
  }, [instruction]);

  // Auto-expand data zone if error is thrown
  useEffect(() => {
    if (dataInPromptWarning && !dataExpanded) {
      setDataExpanded(true);
    }
  }, [dataInPromptWarning, dataExpanded]);

  // Auto-expand/collapse data zone when instruction transitions between empty/non-empty
  const prevInstructionLen = useRef(0);
  useEffect(() => {
    if (instruction.trim().length > 0 && prevInstructionLen.current === 0) {
      setDataExpanded(true);
    } else if (instruction.trim().length === 0 && prevInstructionLen.current > 0) {
      if (dataText.trim().length === 0 && selectedFiles.length === 0) {
        setDataExpanded(false);
      }
    }
    prevInstructionLen.current = instruction.trim().length;
  }, [instruction, dataText, selectedFiles.length]);

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

  const removeFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const guestLimitReached = isLoggedIn === false && guestUsed >= guestLimit;
  const guestPromptsRemaining = Math.max(0, guestLimit - guestUsed);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!instruction.trim() || isThinking) return;

    if (isLoggedIn === false && guestUsed >= guestLimit) {
      setAiError("");
      setAiMessage("");
      return; 
    }
    
    setIsThinking(true);
    setAiError("");
    setAiMessage("Pixie is interpreting your request...");

    try {
      const res = await fetch("/api/ai/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: instruction })
      });

      if (!res.ok) {
        let friendlyMsg = "Pixie couldn't process that right now. Please try again later.";
        try {
          const errData = await res.json();
          if (res.status === 402) {
            if (!isLoggedIn) {
              syncLimitReached();
            } else {
              // Trigger event for auth users to refresh sidebar metadata
              window.dispatchEvent(new CustomEvent("pixie_quota_changed"));
            }
            friendlyMsg = errData.error || "You've reached your daily limit.";
          } else if (errData.error?.includes("No prompt")) {
            friendlyMsg = "Please enter an instruction for Pixie.";
          } else if (errData.error?.includes("API key")) {
            friendlyMsg = "Pixie AI is temporarily unavailable. All tools still work — browse them below!";
          }
        } catch {
          // JSON parse failed
        }
        throw new Error(friendlyMsg);
      }

      const data = await res.json();

      if (!data.route || data.params?.unsupported === true) {
        setShowUnsupportedModal(true);
        setIsThinking(false);
        setAiMessage("");
        return;
      }

      // Sync quota state across components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("pixie_quota_changed"));
      }

      setAiMessage(data.message || "Routing you to the right tool...");

      // Merge: Gemini's extracted params + local data payload
      const mergedParams = { ...data.params };
      
      // If user pasted text in the data zone, inject it as inputText
      // but don't overwrite if Gemini already set a specific inputText from the instruction
      if (dataText.trim()) {
        if (!mergedParams.inputText) {
          mergedParams.inputText = dataText;
        }
        // For diff checker — if route targets diff and there's no oldText set
        if (data.route.includes("/diff") && !mergedParams.oldText) {
          mergedParams.oldText = dataText;
        }
      }

      setAiState({
        targetRoute: data.route,
        files: selectedFiles,
        params: mergedParams,
        autoExecute: data.autoExecute ?? false
      });

      setTimeout(() => {
        router.push(data.route);
      }, 800);

    } catch (err: any) {
      setAiError(err.message || "Something went wrong. Please try again.");
      setAiMessage("");
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  const categories = [
    { id: 'image', name: "Image Magic", icon: FileImage, color: "#D0EFFF", text: "#007799", href: "/dashboard/image", desc: "Resize, compress, remove backgrounds & filter images." },
    { id: 'pdf', name: "PDF Spells", icon: FileText, color: "#FFE4E6", text: "#E11D48", href: "/dashboard/pdf", desc: "Merge, split, compress, watermark & secure PDF files." },
    { id: 'video', name: "Video Alchemy", icon: Film, color: "#E0E7FF", text: "#4338CA", href: "/dashboard/video", desc: "Convert, speed, trim, silence & extract video soundtracks." },
    { id: 'dev', name: "Dev Utilities", icon: Code, color: "#DCFCE7", text: "#15803D", href: "/dashboard/dev", desc: "JSON formatting, Base64 codecs, UUIDs, diffs & QR codes." },
    { id: 'text', name: "Text & Data", icon: Type, color: "#FDE8EF", text: "#BE185D", href: "/dashboard/text", desc: "Word counters, case conversion, CSV-to-JSON & voice output." },
  ];

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const displayName = user?.email ? user.email.split('@')[0] : "Explorer";

  return (
    <div className={styles.dashboardHome}>
      {!isOnline && (
        <div className={styles.offlineBanner}>
          <div className={styles.offlineIconBox}>
            <WifiOff size={18} />
          </div>
          <div className={styles.offlineContent}>
            <strong>⚡ Offline Mode Active</strong>
            <span>Pixie runs 100% locally on your machine. You can convert, edit, and compress files completely offline!</span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showTipBanner && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: '1.5rem' }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className={styles.tipBanner}
          >
            <div className={styles.tipIconBox}>
              <Sparkles size={18} />
            </div>
            <div className={styles.tipContent}>
              <strong>New here?</strong>
              <span>Pixie is a local-first playground. Everything runs entirely inside your browser using WebAssembly. Type what you want to convert below, or click any category to browse tools.</span>
            </div>
            <button onClick={dismissTipBanner} className={styles.tipDismissBtn} type="button">
              Got it ✓
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.headerArea}>
        <div className={styles.welcomeBlock}>
          <h1 className={styles.title}>
            {greeting}
            {user?.email ? `, ${user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1)}` : ""}
          </h1>
          <p className={styles.subtitle}>
            Your private, local-first media playground. Type a task below or press <kbd className={styles.kbdInline}>⌘K</kbd> to run any utility instantly with zero server uploads.
          </p>
        </div>
        
        <div className={styles.aiCommandBox}>
          <div className={styles.aiHeader}>
            <Sparkles size={18} className={styles.wandStar} />
            <span className={styles.aiHeaderTitle}>Ask Pixie Anything</span>
          </div>

          <AnimatePresence>
            {dataInPromptWarning && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.pointerLabel}>
                <ArrowDown size={14} /> Write your short instruction here
              </motion.div>
            )}
          </AnimatePresence>
          <div className={`${styles.promptForm} ${dataInPromptWarning ? styles.promptFormHighlighted : ''}`}>
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePromptPaste}
              maxLength={200}
              className={styles.promptInput}
              placeholder={typewriterPlaceholder}
              disabled={isThinking}
            />
            {instruction.trim() && (
              <span className={styles.keyboardBadge} title="Press Enter to submit">
                <CornerDownLeft size={10} /> Enter
              </span>
            )}
            <button 
              className={styles.submitBtn}
              disabled={!instruction.trim() || isThinking || guestLimitReached || dataInPromptWarning}
              onClick={() => handleSubmit()}
            >
              {isThinking ? <Loader2 size={18} className={styles.spinIcon} /> : <ArrowRight size={18} />}
            </button>
          </div>

          <div className={styles.suggestionsContainer}>
            <span className={styles.suggestionLabel}>Try a quick spell:</span>
            <button onClick={handleSampleCSV} className={styles.suggestionChip} type="button">
              📄 CSV to JSON
            </button>
            <button onClick={handleSampleImage} className={styles.suggestionChip} type="button">
              📸 Compress Image
            </button>
            <button onClick={handleSampleWordCount} className={styles.suggestionChip} type="button">
              📝 Word Count
            </button>
          </div>

          <AnimatePresence>
            {guestLimitReached && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={styles.guestLimitBox}
              >
                <LogIn size={16} />
                <div className={styles.guestLimitContent}>
                  <strong>You've used all {guestLimit} free AI prompts</strong>
                  <span>Sign in for unlimited AI prompts. All tools remain free to use without an account!</span>
                </div>
                <Link href="/login" className={styles.guestLoginBtn}>Sign In</Link>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoggedIn === false && !guestLimitReached && guestUsed > 0 && (
            <div className={styles.promptCounter}>
              <Sparkles size={12} />
              <span>{guestPromptsRemaining} free prompt{guestPromptsRemaining !== 1 ? 's' : ''} remaining · <Link href="/login" style={{ color: 'inherit', fontWeight: 700 }}>Sign in</Link> for unlimited</span>
            </div>
          )}

          <AnimatePresence>
            {dataInPromptWarning && (
              <motion.div 
                initial={{ opacity: 0, y: -10, height: 0 }} 
                animate={{ opacity: 1, y: 0, height: 'auto' }} 
                exit={{ opacity: 0, y: -10, height: 0 }}
                className={styles.dataErrorPrompt}
                style={{ position: 'relative', zIndex: 10 }}
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

          <button 
            className={styles.dataToggle}
            onClick={() => setDataExpanded(!dataExpanded)}
          >
            <motion.div animate={{ rotate: dataExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={16} />
            </motion.div>
            <span>{dataExpanded ? 'Hide Attachment Panel' : 'Attach a File or Paste Data'}</span>
            <span className={styles.localBadgeWrapper}>
              <span className={styles.localBadge}><Lock size={10} /> Local only</span>
              <span className={styles.localTooltip}>
                <strong>100% Private & Offline</strong>
                <span>Everything runs directly inside your browser using WebAssembly. No files or data ever leave your machine. Try turning off your Wi-Fi—it still works!</span>
              </span>
            </span>
            {!dataExpanded && (dataText.trim() || selectedFiles.length > 0) && (
              <span className={styles.dataDot} />
            )}
          </button>

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

          <AnimatePresence>
            {dataExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                style={{ overflow: 'hidden' }}
              >
                {dataInPromptWarning && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.pointerLabelData}>
                    <ArrowDown size={14} /> Paste your massive data here
                  </motion.div>
                )}
                <div className={`${styles.dataZone} ${dataInPromptWarning ? styles.dataZoneHighlighted : ''}`}>
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
                      rows={6}
                    />
                    {dataText.trim() && (
                      <div className={styles.dataStats}>
                        {dataText.length.toLocaleString()} chars · {dataText.split(/\s+/).filter(w => w.length > 0).length.toLocaleString()} words
                      </div>
                    )}
                  </div>

                  <div className={styles.dataFilePanel}>
                    <div className={styles.dataPanelLabel}>
                      <UploadCloud size={14} />
                      <span>Files</span>
                    </div>
                    <div 
                      className={`${styles.fileDropArea} ${dataInPromptWarning ? styles.dataZoneHighlighted : ""}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setInternalDragging(true); }}
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

          {aiMessage && (
            <div className={styles.aiStatus}>
              {isThinking && <Loader2 size={16} className={styles.spinIcon} />}
              <Sparkles size={16} /> {aiMessage}
            </div>
          )}
          {aiError && (
            <div className={styles.aiErrorMsg}>
              <AlertCircle size={16} /> {aiError}
            </div>
          )}
        </div>
        
        <div className={styles.onboardingSection}>
          <div className={styles.onboardingHeader}>
            <Wand2 size={22} className={styles.wandStar} />
            <h2>Magic in 3 steps</h2>
          </div>
          <div className={styles.onboardingGrid}>
            <div className={styles.onboardingCard}>
              <div className={styles.stepIconHeader}>
                <div className={styles.stepNum}>1</div>
                <UploadCloud size={20} className={styles.stepIcon} style={{ color: '#06b6d4' }} />
              </div>
              <h3 className={styles.stepTitle}>Drop your Media</h3>
              <p className={styles.stepDesc}>Attach your image, PDF, or video. Everything stays 100% private on your machine.</p>
            </div>
            <div className={styles.onboardingCard}>
              <div className={styles.stepIconHeader}>
                <div className={styles.stepNum}>2</div>
                <Type size={20} className={styles.stepIcon} style={{ color: '#a855f7' }} />
              </div>
              <h3 className={styles.stepTitle}>Type your Intent</h3>
              <p className={styles.stepDesc}>Tell Pixie what you need. Our local router directs you to the perfect tool instantly.</p>
            </div>
            <div className={styles.onboardingCard}>
              <div className={styles.stepIconHeader}>
                <div className={styles.stepNum}>3</div>
                <Download size={20} className={styles.stepIcon} style={{ color: '#10b981' }} />
              </div>
              <h3 className={styles.stepTitle}>Grab your File</h3>
              <p className={styles.stepDesc}>Our local WASM engine processes it at warp speed. Download it with zero server logs.</p>
            </div>
          </div>
        </div>

        <div className={styles.sectionHeader} style={{ marginTop: '2rem' }}>
          <h2>✨ Popular Spells</h2>
        </div>

        <div className={styles.toolsGrid}>
          {[
            { name: 'YouTube Downloader', type: 'Download', desc: 'Securely extract high-quality video.', href: '/dashboard/video/youtube' },
            { name: 'Background Remover', type: 'Image', desc: 'AI-powered precise subject cutout.', href: '/dashboard/image/bg-remove' },
            { name: 'Compress PDF', type: 'PDF', desc: 'Reduce megabytes in seconds.', href: '/dashboard/pdf/compress' },
            { name: 'Video to Audio', type: 'Video', desc: 'Extract MP3 directly in browser.', href: '/dashboard/video/audio' }
          ].map((tool, idx) => (
            <Link href={tool.href} key={idx} style={{ textDecoration: 'none' }}>
              <div className={styles.toolCard}>
                <div className={styles.toolHeader}>
                  <span className={styles.toolBadge}>{tool.type}</span>
                  <Wand2 size={24} className={styles.toolIcon} />
                </div>
                <h4 className={styles.toolName}>{tool.name}</h4>
                <p className={tool.desc ? styles.toolDesc : ''}>{tool.desc}</p>
                <div className={styles.toolArrowBtn}>
                  <ArrowRight size={18} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <h2>Categories</h2>
      </div>

      <div className={styles.categoriesGrid}>
        {categories.map((cat, idx) => (
          <Link href={cat.href} key={idx} style={{ textDecoration: 'none' }}>
            <motion.div 
              className={styles.categoryCard}
              whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}
            >
              <div className={styles.iconBox} style={{ backgroundColor: cat.color, color: cat.text }}>
                <cat.icon size={32} />
              </div>
              <div className={styles.catInfo}>
                <h3>{cat.name}</h3>
                <span className={styles.catCount}>{TOOLS_REGISTRY[cat.id]?.length || 0} Tools</span>
                <p className={styles.catDesc}>{cat.desc}</p>
              </div>
              <button className={styles.catAction}>View All</button>
            </motion.div>
          </Link>
        ))}
      </div>

      <AnimatePresence>
        {showUnsupportedModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={() => setShowUnsupportedModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalIcon}>
                <HelpCircle size={32} />
              </div>
              <h3 className={styles.modalTitle}>Spell Not Found</h3>
              <p className={styles.modalText}>
                We can't do this yet! Pixie's local engine does not currently support this specific file action or conversion spell.
                <br /><br />
                If you'd like to use this feature, please request it in our Wishlist sandbox!
              </p>
              <div className={styles.modalActions}>
                <button 
                  className={styles.modalButtonSecondary}
                  onClick={() => setShowUnsupportedModal(false)}
                >
                  Close
                </button>
                <button 
                  className={styles.modalButtonPrimary}
                  onClick={() => {
                    setShowUnsupportedModal(false);
                    router.push("/dashboard/features-request");
                  }}
                >
                  <span>Request Feature</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Video, 
  Sparkles, 
  Download, 
  ArrowRight,
  ImageIcon,
  Wand2
} from "lucide-react";

interface FileType {
  id: string;
  name: string;
  type: "image" | "pdf" | "video";
  size: string;
  icon: React.ReactNode;
  resultName: string;
  resultSize: string;
  actionText: string;
}

export default function InteractiveWidget() {
  const [activeFile, setActiveFile] = useState<FileType | null>(null);
  const [transforming, setTransforming] = useState(false);
  const [result, setResult] = useState<FileType | null>(null);

  const sampleFiles: FileType[] = [
    {
      id: "img",
      name: "raw_photo.png",
      type: "image",
      size: "8.4 MB",
      icon: <ImageIcon className="h-6 w-6 text-[var(--pixie-teal)]" />,
      resultName: "optimized.webp",
      resultSize: "420 KB (95% saved)",
      actionText: "WebP Alchemy"
    },
    {
      id: "pdf",
      name: "unsigned_contract.pdf",
      type: "pdf",
      size: "2.1 MB",
      icon: <FileText className="h-6 w-6 text-[var(--gentle-lilac)]" />,
      resultName: "signed_watermarked.pdf",
      resultSize: "2.1 MB (Client Secures)",
      actionText: "PDF Alchemy"
    },
    {
      id: "vid",
      name: "raw_footage.mov",
      type: "video",
      size: "145 MB",
      icon: <Video className="h-6 w-6 text-rose-500" />,
      resultName: "compressed_h264.mp4",
      resultSize: "12 MB (Fast WASM)",
      actionText: "WASM Alchemy"
    }
  ];

  const handleSelectFile = (file: FileType) => {
    if (transforming) return;
    setActiveFile(file);
    setResult(null);
  };

  const triggerTransformation = () => {
    if (!activeFile || transforming) return;
    setTransforming(true);
    
    // Simulate WASM / local transformation speed
    setTimeout(() => {
      setTransforming(false);
      setResult(activeFile);
    }, 1500);
  };

  return (
    <div className="relative mx-auto w-full max-w-3xl rounded-[48px] border border-[var(--border)] bg-[var(--pure-white)]/80 p-8 md:p-10 backdrop-blur-xl shadow-[var(--shadow-bento)] transition-all duration-300">
      {/* Subtle organic ambient inner glow */}
      <div className="absolute -inset-px rounded-[48px] bg-gradient-to-r from-[var(--gentle-lilac)]/5 to-[var(--mint-green)]/5 opacity-40 blur-sm pointer-events-none" />

      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left side: Source File Picker */}
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--pixie-teal)]">Step 1</span>
            <h3 className="text-2xl font-extrabold text-[var(--foreground)] mt-1 font-sans">Select a File</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1 font-sans">Simulate local file conversion inside your browser.</p>
          </div>

          <div className="flex flex-col gap-3">
            {sampleFiles.map((file) => {
              const isSelected = activeFile?.id === file.id;
              return (
                <button
                  key={file.id}
                  onClick={() => handleSelectFile(file)}
                  className={`flex items-center justify-between p-4 rounded-[24px] border text-left transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? "border-[var(--pixie-teal)] bg-[var(--pixie-teal)]/10 shadow-[0_8px_32px_0_rgba(20,184,166,0.05)]"
                      : "border-[var(--border)] bg-[var(--foreground)]/[0.01] hover:bg-[var(--foreground)]/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-[16px] bg-[var(--pure-white)] border border-[var(--border)] shadow-sm">
                      {file.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--foreground)] font-sans">{file.name}</p>
                      <p className="text-xs text-[var(--text-muted)] font-sans">{file.size}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                    isSelected ? "bg-[var(--pixie-teal)]/20 text-[var(--pixie-teal)]" : "bg-[var(--foreground)]/[0.05] text-[var(--text-muted)]"
                  }`}>
                    {file.type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side: The Transformation Crucible */}
        <div className="flex flex-col items-center justify-center p-8 rounded-[32px] bg-[var(--foreground)]/[0.01] border border-[var(--border)] min-h-[320px] transition-all duration-300">
          <AnimatePresence mode="wait">
            {!activeFile ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center flex flex-col items-center gap-3"
              >
                <div className="h-16 w-16 rounded-[24px] bg-[var(--pure-white)] border border-dashed border-[var(--border)] flex items-center justify-center shadow-sm">
                  <Sparkles className="h-6 w-6 text-[var(--text-muted)] animate-pulse" />
                </div>
                <p className="text-sm font-bold text-[var(--foreground)] font-sans">Waiting for a file...</p>
                <p className="text-xs text-[var(--text-muted)] font-sans">Select a source file on the left.</p>
              </motion.div>
            ) : transforming ? (
              <motion.div
                key="transforming"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center flex flex-col items-center gap-4"
              >
                <div className="relative flex items-center justify-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="h-20 w-20 rounded-full border-2 border-t-[var(--pixie-teal)] border-r-transparent border-b-[var(--gentle-lilac)] border-l-transparent"
                  />
                  <Wand2 className="h-8 w-8 text-[var(--pixie-teal)] absolute animate-pulse" />
                </div>
                <h4 className="text-base font-extrabold text-[var(--foreground)] mt-2 font-sans">Performing Alchemy...</h4>
                <p className="text-xs text-[var(--text-muted)] font-sans">Processing file 100% locally in browser memory</p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full text-center flex flex-col items-center gap-5"
              >
                <div className="h-16 w-16 rounded-[24px] bg-[var(--mint-green)] border border-[var(--border)] flex items-center justify-center shadow-md">
                  <Wand2 className="h-8 w-8 text-neutral-900" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-neutral-900 tracking-wider uppercase bg-[var(--mint-green)] px-3 py-1 rounded-full shadow-sm">
                    Success
                  </span>
                  <h4 className="text-base font-extrabold text-[var(--foreground)] mt-3 font-sans">{result.resultName}</h4>
                  <p className="text-xs text-[var(--pixie-teal)] font-bold mt-1 font-sans">{result.resultSize}</p>
                </div>
                <div className="w-full flex flex-col gap-2 mt-2">
                  <button className="flex items-center justify-center gap-2 w-full py-3 rounded-[20px] bg-[var(--foreground)] hover:opacity-90 text-[var(--pure-white)] font-bold text-sm transition-all duration-200 cursor-pointer shadow-md">
                    <Download className="h-4 w-4" /> Download Result
                  </button>
                  <button 
                    onClick={() => {
                      setActiveFile(null);
                      setResult(null);
                    }}
                    className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                  >
                    Reset Spell
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full text-center flex flex-col items-center gap-5"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] shadow-sm">
                    {activeFile.icon}
                  </div>
                  <ArrowRight className="h-5 w-5 text-[var(--text-muted)]" />
                  <div className="p-3.5 rounded-[20px] bg-[var(--pure-white)] border border-[var(--border)] shadow-sm animate-pulse">
                    <Wand2 className="h-6 w-6 text-[var(--pixie-teal)]" />
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-[var(--foreground)] font-sans">{activeFile.name}</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-sans">Ready for transformation</p>
                </div>

                <button 
                  onClick={triggerTransformation}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-[20px] bg-[var(--foreground)] hover:opacity-90 text-[var(--pure-white)] font-bold text-sm transition-all duration-200 cursor-pointer shadow-md"
                >
                  <Sparkles className="h-4 w-4" /> Cast {activeFile.actionText}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

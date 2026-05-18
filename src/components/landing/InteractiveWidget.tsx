"use client";

import React, { useState, useRef } from "react";
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
  
  const crucibleRef = useRef<HTMLDivElement>(null);

  const sampleFiles: FileType[] = [
    {
      id: "img",
      name: "raw_photo.png",
      type: "image",
      size: "8.4 MB",
      icon: <ImageIcon className="h-6 w-6 text-indigo-400" />,
      resultName: "optimized.webp",
      resultSize: "420 KB (95% saved)",
      actionText: "WebP Alchemy"
    },
    {
      id: "pdf",
      name: "unsigned_contract.pdf",
      type: "pdf",
      size: "2.1 MB",
      icon: <FileText className="h-6 w-6 text-amber-400" />,
      resultName: "signed_watermarked.pdf",
      resultSize: "2.1 MB (Client Secures)",
      actionText: "PDF Alchemy"
    },
    {
      id: "vid",
      name: "raw_footage.mov",
      type: "video",
      size: "145 MB",
      icon: <Video className="h-6 w-6 text-rose-400" />,
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
    <div className="relative mx-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0a0a0a]/60 p-6 backdrop-blur-xl shadow-2xl shadow-indigo-500/5">
      {/* Dynamic ambient background glow inside the card */}
      <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-indigo-500/10 via-teal-500/10 to-rose-500/10 opacity-30 blur-sm pointer-events-none" />

      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left side: Source File Picker */}
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Step 1</span>
            <h3 className="text-xl font-bold text-white mt-1">Select a File</h3>
            <p className="text-sm text-neutral-400 mt-1">Simulate local file conversion inside your browser.</p>
          </div>

          <div className="flex flex-col gap-3">
            {sampleFiles.map((file) => {
              const isSelected = activeFile?.id === file.id;
              return (
                <button
                  key={file.id}
                  onClick={() => handleSelectFile(file)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/5"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-neutral-900 border border-white/5">
                      {file.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{file.name}</p>
                      <p className="text-xs text-neutral-500">{file.size}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    isSelected ? "bg-indigo-500/20 text-indigo-300" : "bg-neutral-800 text-neutral-400"
                  }`}>
                    {file.type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side: The Transformation Crucible */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.01] border border-white/5 min-h-[300px]">
          <AnimatePresence mode="wait">
            {!activeFile ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center flex flex-col items-center gap-3"
              >
                <div className="h-16 w-16 rounded-full bg-neutral-900 border border-dashed border-white/20 flex items-center justify-center animate-pulse">
                  <Sparkles className="h-6 w-6 text-neutral-500" />
                </div>
                <p className="text-sm font-medium text-neutral-400">Waiting for a file selection...</p>
                <p className="text-xs text-neutral-500">Pick a source file on the left.</p>
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
                    className="h-20 w-20 rounded-full border-2 border-t-indigo-500 border-r-transparent border-b-teal-500 border-l-transparent"
                  />
                  <Wand2 className="h-8 w-8 text-teal-400 absolute animate-pulse" />
                </div>
                <h4 className="text-base font-bold text-white mt-2">Performing Alchemy...</h4>
                <p className="text-xs text-neutral-500">Processing file 100% locally in browser memory</p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full text-center flex flex-col items-center gap-4"
              >
                <div className="h-16 w-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                  <Wand2 className="h-8 w-8 text-teal-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-teal-400 tracking-widest uppercase bg-teal-500/10 px-2 py-0.5 rounded-full">Success</span>
                  <h4 className="text-base font-bold text-white mt-2">{result.resultName}</h4>
                  <p className="text-xs text-teal-300 font-medium mt-1">{result.resultSize}</p>
                </div>
                <div className="w-full flex flex-col gap-2 mt-2">
                  <button className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-neutral-900 font-bold text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-teal-500/10">
                    <Download className="h-4 w-4" /> Download Result
                  </button>
                  <button 
                    onClick={() => {
                      setActiveFile(null);
                      setResult(null);
                    }}
                    className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
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
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-neutral-900 border border-white/5">
                    {activeFile.icon}
                  </div>
                  <ArrowRight className="h-5 w-5 text-neutral-500" />
                  <div className="p-3 rounded-xl bg-neutral-900 border border-white/5 animate-pulse">
                    <Wand2 className="h-6 w-6 text-teal-400" />
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">{activeFile.name}</h4>
                  <p className="text-xs text-neutral-400 mt-1">Ready for transformation</p>
                </div>

                <button 
                  onClick={triggerTransformation}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-500/20"
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

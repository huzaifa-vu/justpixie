"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, LucideIcon } from "lucide-react";
import { useFileDrop } from "@/hooks/useFileDrop";
import styles from "./DropZone.module.css";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  className?: string;
}

export function DropZone({
  onFilesSelected,
  accept,
  multiple = false,
  title = "Drop your file here",
  subtitle = "Or click to browse securely",
  icon: Icon = UploadCloud,
  className = ""
}: DropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLocalDragging, setIsLocalDragging] = useState(false);

  // Register with global system
  useFileDrop({ onDrop: onFilesSelected, accept });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsLocalDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsLocalDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsLocalDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      // Hook handles global, here we handle local specific logic if needed
      // Actually, standardizing on the hook's filter:
      onFilesSelected(droppedFiles); 
    }
  };

  return (
    <div
      className={`${styles.dropZone} ${isLocalDragging ? styles.dragging : ""} ${className}`}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Icon size={48} className={styles.dropIcon} />
      <h3>{title}</h3>
      <p>{subtitle}</p>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files) {
            onFilesSelected(Array.from(e.target.files));
          }
        }}
        accept={accept}
        multiple={multiple}
        className={styles.hiddenInput}
      />
    </div>
  );
}

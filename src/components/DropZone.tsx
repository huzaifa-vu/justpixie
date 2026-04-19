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
  compact?: boolean;
  previewUrl?: string | null;
  children?: React.ReactNode;
}

export function DropZone({
  onFilesSelected,
  accept,
  multiple = false,
  title = "Drop your file here",
  subtitle = "Or click to browse securely",
  icon: Icon = UploadCloud,
  className = "",
  compact = false,
  previewUrl = null,
  children
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
      className={`${styles.dropZone} ${isLocalDragging ? styles.dragging : ""} ${compact ? styles.compact : ""} ${className}`}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children ? (
        children
      ) : (
        <>
          <Icon size={compact ? 24 : 48} className={styles.dropIcon} />
          <h3>{title}</h3>
          {!compact && <p>{subtitle}</p>}
        </>
      )}

      {previewUrl && (
        <div className={`${styles.previewOverlay} ${styles.checkerboard}`}>
          <img src={previewUrl} alt="Preview" className={styles.previewImage} />
          <div className={styles.changeBadge}>Change</div>
        </div>
      )}
      
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

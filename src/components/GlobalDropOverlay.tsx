"use client";

import React from "react";
import { UploadCloud } from "lucide-react";
import styles from "./GlobalDropOverlay.module.css";
import { useFileDropContext } from "@/contexts/FileDropContext";

export function GlobalDropOverlay() {
  const { isDragging } = useFileDropContext();

  if (!isDragging) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <UploadCloud size={40} />
        </div>
        <div className={styles.text}>
          Drop to Wizardry
          <div className={styles.subtext}>Release to upload files instantly</div>
        </div>
      </div>
    </div>
  );
}

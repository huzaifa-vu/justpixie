"use client";

import { useEffect, useCallback } from "react";
import { useFileDropContext } from "@/contexts/FileDropContext";

interface UseFileDropOptions {
  onDrop: (files: File[]) => void;
  accept?: string;
}

export function useFileDrop({ onDrop, accept }: UseFileDropOptions) {
  const { registerHandler, unregisterHandler } = useFileDropContext();

  const handleFilteredDrop = useCallback((files: File[]) => {
    if (!accept || accept === "*") {
      onDrop(files);
      return;
    }

    const filtered = files.filter(file => {
      const ext = "." + file.name.split('.').pop()?.toLowerCase();
      const mime = file.type.toLowerCase();
      const allowed = accept.split(',').map(a => a.trim().toLowerCase());
      
      return allowed.some(pattern => {
        if (pattern.startsWith('.')) return ext === pattern;
        if (pattern === 'video/*' || pattern === 'audio/*') {
          const mainType = pattern.split('/')[0];
          if (mime.startsWith(mainType + '/')) return true;
          
          // Extension fallback for missing MIME types
          const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
          const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
          if (mainType === 'video' && videoExtensions.includes(ext)) return true;
          if (mainType === 'audio' && audioExtensions.includes(ext)) return true;
        }
        if (pattern.includes('/*')) {
          const mainType = pattern.split('/')[0];
          return mime.startsWith(mainType + '/');
        }
        return mime === pattern;
      });
    });

    if (filtered.length > 0) {
      onDrop(filtered);
    }
  }, [onDrop, accept]);

  useEffect(() => {
    registerHandler(handleFilteredDrop);
    return () => unregisterHandler(handleFilteredDrop);
  }, [registerHandler, unregisterHandler, handleFilteredDrop]);

  return {
    // We can return more helpers here if needed
  };
}

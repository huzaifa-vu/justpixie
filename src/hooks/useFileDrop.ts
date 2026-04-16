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
      // Basic extension check for simplicity, can be expanded
      const ext = "." + file.name.split('.').pop()?.toLowerCase();
      const mime = file.type.toLowerCase();
      
      const allowed = accept.split(',').map(a => a.trim().toLowerCase());
      
      return allowed.some(pattern => {
        if (pattern.startsWith('.')) return ext === pattern;
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

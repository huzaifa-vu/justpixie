"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

interface FileDropContextType {
  isDragging: boolean;
  registerHandler: (handler: (files: File[]) => void) => void;
  unregisterHandler: (handler: (files: File[]) => void) => void;
  notifyDrop: (files: File[]) => void;
  setInternalDragging: (dragging: boolean) => void;
}

const FileDropContext = createContext<FileDropContextType | undefined>(undefined);

export function FileDropProvider({ children }: { children: React.ReactNode }) {
  const [isDragging, setIsDragging] = useState(false);
  const [hasHandler, setHasHandler] = useState(false);
  const handlersRef = useRef<((files: File[]) => void)[]>([]);
  const dragCounter = useRef(0);

  const registerHandler = useCallback((handler: (files: File[]) => void) => {
    handlersRef.current = [...handlersRef.current, handler];
    setHasHandler(true);
  }, []);

  const unregisterHandler = useCallback((handler: (files: File[]) => void) => {
    handlersRef.current = handlersRef.current.filter((h) => h !== handler);
    setHasHandler(handlersRef.current.length > 0);
  }, []);

  const notifyDrop = useCallback((files: File[]) => {
    handlersRef.current.forEach((handler) => handler(files));
    setIsDragging(false);
    dragCounter.current = 0;
  }, []);

  const setInternalDragging = useCallback((dragging: boolean) => {
    setIsDragging(dragging);
  }, []);

  // Window-level drag detection
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      // Only trigger if we have a handler registered for the current page
      if (!hasHandler) return;
      
      e.preventDefault();
      dragCounter.current++;
      if (dragCounter.current === 1) {
        setIsDragging(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      if (!hasHandler) return;
      e.preventDefault();
    };

    const handleDragLeave = (e: DragEvent) => {
      if (!hasHandler) return;
      
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      if (!hasHandler) return;
      
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        notifyDrop(Array.from(e.dataTransfer.files));
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [hasHandler, notifyDrop]);

  return (
    <FileDropContext.Provider value={{ isDragging, registerHandler, unregisterHandler, notifyDrop, setInternalDragging }}>
      {children}
    </FileDropContext.Provider>
  );
}

export function useFileDropContext() {
  const context = useContext(FileDropContext);
  if (!context) {
    throw new Error("useFileDropContext must be used within a FileDropProvider");
  }
  return context;
}

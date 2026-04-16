"use client";

import DownloaderUI from "@/components/downloader/DownloaderUI";
import ToolWrapper from "@/components/ToolWrapper";
import { Globe } from "lucide-react";

export default function FacebookPage() {
  return (
    <ToolWrapper 
      title="Facebook Downloader" 
      description="Save Facebook videos and Reels for offline viewing. Private, local-first architecture ensures no data leaks." 
      icon={Globe}
    >
      <DownloaderUI 
        platform="facebook" 
        accentColor="var(--gentle-lilac)" 
        placeholder="Paste Facebook video or Reel link here..." 
      />
    </ToolWrapper>
  );
}

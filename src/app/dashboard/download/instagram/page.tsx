"use client";

import DownloaderUI from "@/components/downloader/DownloaderUI";
import ToolWrapper from "@/components/ToolWrapper";
import { Camera } from "lucide-react";

export default function InstagramPage() {
  return (
    <ToolWrapper 
      title="Instagram Downloader" 
      description="Download Instagram Reels, IGTV, and feed videos instantly. Higher reliability through client-side stream fetching." 
      icon={Camera}
    >
      <DownloaderUI 
        platform="instagram" 
        accentColor="var(--gentle-lilac)" 
        placeholder="Paste Instagram Reel or Video link here..." 
      />
    </ToolWrapper>
  );
}

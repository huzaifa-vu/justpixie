"use client";

import DownloaderUI from "@/components/downloader/DownloaderUI";
import ToolWrapper from "@/components/ToolWrapper";
import { Play } from "lucide-react";

export default function YoutubePage() {
  return (
    <ToolWrapper 
      title="YouTube Downloader" 
      description="Save high-quality YouTube videos directly to your device. Pixie uses a lightweight resolver but performs all data handling locally on your machine." 
      icon={Play}
    >
      <DownloaderUI 
        platform="youtube" 
        accentColor="var(--mint-green)" 
        placeholder="Paste YouTube video or Shorts link here..." 
      />
    </ToolWrapper>
  );
}

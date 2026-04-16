"use client";

import DownloaderUI from "@/components/downloader/DownloaderUI";
import ToolWrapper from "@/components/ToolWrapper";
import { Share2 } from "lucide-react";

export default function TwitterPage() {
  return (
    <ToolWrapper 
      title="X / Twitter Downloader" 
      description="Extract videos and GIFs from X/Twitter posts securely. All processing happens in your browser." 
      icon={Share2}
    >
      <DownloaderUI 
        platform="twitter" 
        accentColor="var(--mint-green)" 
        placeholder="Paste X (Twitter) post link here..." 
      />
    </ToolWrapper>
  );
}

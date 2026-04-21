"use client";

import { useState } from "react";
import DownloaderUI from "@/components/downloader/DownloaderUI";
import ToolWrapper from "@/components/ToolWrapper";
import { Play } from "lucide-react";
import { useAiHydration } from "@/hooks/useAiHydration";

export default function YoutubePage() {
  const [initialUrl, setInitialUrl] = useState("");
  const [autoRun, setAutoRun] = useState(false);

  useAiHydration(({ params, autoExecute }) => {
    if (params.inputText) setInitialUrl(params.inputText);
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/video/youtube");

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
        initialUrl={initialUrl}
        autoRun={autoRun}
      />
    </ToolWrapper>
  );
}

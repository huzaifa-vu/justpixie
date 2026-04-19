"use client";

import { useState } from "react";
import DownloaderUI from "@/components/downloader/DownloaderUI";
import ToolWrapper from "@/components/ToolWrapper";
import { Camera } from "lucide-react";
import { useAiHydration } from "@/hooks/useAiHydration";

export default function InstagramPage() {
  const [initialUrl, setInitialUrl] = useState("");
  const [autoRun, setAutoRun] = useState(false);

  useAiHydration(({ params, autoExecute }) => {
    if (params.inputText) setInitialUrl(params.inputText);
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/download/instagram");

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
        initialUrl={initialUrl}
        autoRun={autoRun}
      />
    </ToolWrapper>
  );
}

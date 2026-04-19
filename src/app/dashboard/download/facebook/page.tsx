"use client";

import { useState } from "react";
import DownloaderUI from "@/components/downloader/DownloaderUI";
import ToolWrapper from "@/components/ToolWrapper";
import { Globe } from "lucide-react";
import { useAiHydration } from "@/hooks/useAiHydration";

export default function FacebookPage() {
  const [initialUrl, setInitialUrl] = useState("");
  const [autoRun, setAutoRun] = useState(false);

  useAiHydration(({ params, autoExecute }) => {
    if (params.inputText) setInitialUrl(params.inputText);
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/download/facebook");

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
        initialUrl={initialUrl}
        autoRun={autoRun}
      />
    </ToolWrapper>
  );
}

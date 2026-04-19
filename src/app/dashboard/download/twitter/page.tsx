"use client";

import { useState } from "react";
import DownloaderUI from "@/components/downloader/DownloaderUI";
import ToolWrapper from "@/components/ToolWrapper";
import { Share2 } from "lucide-react";
import { useAiHydration } from "@/hooks/useAiHydration";

export default function TwitterPage() {
  const [initialUrl, setInitialUrl] = useState("");
  const [autoRun, setAutoRun] = useState(false);

  useAiHydration(({ params, autoExecute }) => {
    if (params.inputText) setInitialUrl(params.inputText);
    if (autoExecute) setAutoRun(true);
  }, "/dashboard/download/twitter");

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
        initialUrl={initialUrl}
        autoRun={autoRun}
      />
    </ToolWrapper>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getAiState, clearAiState, AiTransferState } from "@/utils/aiTransferCache";

/**
 * A custom hook to pull AI routed parameters and files into any tool effortlessly.
 * 
 * @param onHydrate - Callback trigger when the tool is opened via AI router. Provide your state setters here.
 * @param requiredRoute - If provided, ensures the hook only triggers if the AI actively targeted this route.
 */
export function useAiHydration(
  onHydrate: (state: Omit<AiTransferState, "targetRoute">) => void,
  requiredRoute?: string
) {
  const [didHydrate, setDidHydrate] = useState(false);

  useEffect(() => {
    const currentState = getAiState();

    // If there is no specific targetRoute, or the route doesn't match where we intended to go, do not hydrate.
    if (!currentState.targetRoute) return;
    if (requiredRoute && !currentState.targetRoute.includes(requiredRoute)) return;

    // Trigger consumer callback with parameters and files
    onHydrate({
      files: currentState.files,
      params: currentState.params,
      autoExecute: currentState.autoExecute
    });

    setDidHydrate(true);
    
    // Clear out the state immediately so it doesn't accidentally trigger again if user navigates back
    clearAiState();
  }, []);

  return { didHydrate };
}

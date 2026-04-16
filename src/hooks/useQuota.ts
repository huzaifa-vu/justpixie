import { useState, useEffect, useCallback } from 'react';

export const GUEST_PROMPT_LIMIT = 3;
const PROMPT_STORAGE_KEY = "pixie_guest_prompts_used";
const QUOTA_CHANGED_EVENT = "pixie_quota_changed";

export function useQuota(user?: any) {
  const [guestUsed, setGuestUsed] = useState(0);

  const refreshGuestQuota = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const val = parseInt(localStorage.getItem(PROMPT_STORAGE_KEY) || "0", 10);
      setGuestUsed(val);
    } catch {
      setGuestUsed(0);
    }
  }, []);

  useEffect(() => {
    refreshGuestQuota();

    const handleUpdate = () => refreshGuestQuota();
    window.addEventListener(QUOTA_CHANGED_EVENT, handleUpdate);
    
    // Also listen for changes from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === PROMPT_STORAGE_KEY) refreshGuestQuota();
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(QUOTA_CHANGED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshGuestQuota]);

  const incrementGuestQuota = useCallback(() => {
    if (typeof window === 'undefined') return;
    const current = parseInt(localStorage.getItem(PROMPT_STORAGE_KEY) || "0", 10);
    const next = current + 1;
    localStorage.setItem(PROMPT_STORAGE_KEY, String(next));
    setGuestUsed(next);
    window.dispatchEvent(new CustomEvent(QUOTA_CHANGED_EVENT));
    return next;
  }, []);

  const syncLimitReached = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PROMPT_STORAGE_KEY, String(GUEST_PROMPT_LIMIT));
    setGuestUsed(GUEST_PROMPT_LIMIT);
    window.dispatchEvent(new CustomEvent(QUOTA_CHANGED_EVENT));
  }, []);

  // Auth user metadata logic (shared with layout)
  const metadata = user?.user_metadata || {};
  const isUnlimited = metadata.tier === 'unlimited';
  const today = new Date().toISOString().split('T')[0];
  const currentUsage = metadata.last_prompt_date === today ? (metadata.prompts_used || 0) : 0;
  const currentLimit = 100;

  return {
    guestUsed,
    guestLimit: GUEST_PROMPT_LIMIT,
    guestRemaining: Math.max(0, GUEST_PROMPT_LIMIT - guestUsed),
    incrementGuestQuota,
    syncLimitReached,
    authPromptsUsed: currentUsage,
    isUnlimited,
    authLimit: currentLimit
  };
}

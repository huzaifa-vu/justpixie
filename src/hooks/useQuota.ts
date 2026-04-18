import { useState, useEffect, useCallback } from 'react';

export const GUEST_PROMPT_LIMIT = 3;
const QUOTA_CHANGED_EVENT = "pixie_quota_changed";

export function useQuota(user?: any) {
  const [quotaData, setQuotaData] = useState({
    used: 0,
    limit: 100,
    remaining: 100,
    isUnlimited: false,
    loading: true
  });

  const fetchQuota = useCallback(async () => {
    try {
      const res = await fetch('/api/user/quota');
      if (res.ok) {
        const data = await res.json();
        setQuotaData({
          used: data.used,
          limit: data.limit,
          remaining: data.remaining,
          isUnlimited: data.isUnlimited,
          loading: false
        });
      }
    } catch (err) {
      console.error("Failed to fetch fresh quota:", err);
    }
  }, []);

  useEffect(() => {
    fetchQuota();

    const handleUpdate = () => fetchQuota();
    window.addEventListener(QUOTA_CHANGED_EVENT, handleUpdate);
    
    return () => {
      window.removeEventListener(QUOTA_CHANGED_EVENT, handleUpdate);
    };
  }, [fetchQuota, user?.id]); // Re-fetch if user ID changes (login/logout)

  const syncLimitReached = useCallback(() => {
    // Optimistic local update before server re-fetch
    setQuotaData(prev => ({ 
      ...prev, 
      used: prev.limit, 
      remaining: 0 
    }));
    window.dispatchEvent(new CustomEvent(QUOTA_CHANGED_EVENT));
  }, []);

  return {
    used: quotaData.used,
    limit: quotaData.limit,
    remaining: quotaData.remaining,
    isUnlimited: quotaData.isUnlimited,
    loading: quotaData.loading,
    syncLimitReached,
    // Aliases for compatibility with existing layout code
    guestUsed: quotaData.limit - quotaData.remaining,
    guestLimit: GUEST_PROMPT_LIMIT,
    guestRemaining: quotaData.remaining,
    authPromptsUsed: quotaData.used,
    authLimit: quotaData.limit,
  };
}

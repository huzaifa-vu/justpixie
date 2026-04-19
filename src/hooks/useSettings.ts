import { useState, useEffect } from 'react';

interface PixieSettings {
  notifications: boolean;
  autoDownload: boolean;
  autoCopy: boolean;
}

const DEFAULT_SETTINGS: PixieSettings = {
  notifications: true,
  autoDownload: false,
  autoCopy: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<PixieSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pixie_settings');
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to load settings", e);
    }
    setIsLoaded(true);
  }, []);

  const updateSetting = <K extends keyof PixieSettings>(key: K, value: PixieSettings[K]) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('pixie_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const saveAll = () => {
     localStorage.setItem('pixie_settings', JSON.stringify(settings));
  };

  return {
    settings,
    updateSetting,
    setSettings,
    saveAll,
    isLoaded
  };
}

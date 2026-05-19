// Helper functions to detect which target host environment the application is executing in.

export const isDesktop = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).electronPixie?.isDesktop;
};

export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
};

export const isWeb = (): boolean => {
  return !isDesktop() && !isMobile();
};

export const getPlatform = (): 'web' | 'desktop' | 'mobile' => {
  if (isDesktop()) return 'desktop';
  if (isMobile()) return 'mobile';
  return 'web';
};

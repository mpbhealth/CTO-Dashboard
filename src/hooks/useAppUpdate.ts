import { useState, useEffect, useCallback, useRef } from 'react';

interface AppUpdateState {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string | null;
  applyUpdate: () => void;
  dismissUpdate: () => void;
}

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useAppUpdate(): AppUpdateState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const currentHash = useRef(__BUILD_HASH__);

  const checkForUpdate = useCallback(async () => {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.hash && data.hash !== currentHash.current) {
        setUpdateAvailable(true);
        setLatestVersion(data.version || null);
      }
    } catch {
      // Silently fail — version check is non-critical
    }
  }, []);

  const applyUpdate = useCallback(() => {
    const reg = (window as unknown as Record<string, unknown>).__SW_REGISTRATION__ as ServiceWorkerRegistration | undefined;
    if (reg) {
      reg.update().then(() => window.location.reload()).catch(() => window.location.reload());
    } else {
      window.location.reload();
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    setDismissed(true);
  }, []);

  // Poll for updates
  useEffect(() => {
    // Initial check after a short delay
    const initialTimer = setTimeout(checkForUpdate, 30_000);
    const interval = setInterval(checkForUpdate, POLL_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [checkForUpdate]);

  // Listen for service worker controller change
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      setUpdateAvailable(true);
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  return {
    updateAvailable: updateAvailable && !dismissed,
    currentVersion: __APP_VERSION__,
    latestVersion,
    applyUpdate,
    dismissUpdate,
  };
}

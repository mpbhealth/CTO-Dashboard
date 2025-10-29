import { Environment } from './environment';
import { logger } from './logger';

export class ProductionDiagnostics {
  static logEnvironment() {
    if (!Environment.shouldShowDebugLogs() && !import.meta.env.PROD) {
      return;
    }

    if (Environment.isStackBlitz()) {
      logger.info('Running in StackBlitz/WebContainer environment');
      return;
    }

    logger.group('Production Environment Check');
    logger.log('Build time:', import.meta.env.VITE_BUILD_TIME || 'Unknown');
    logger.log('Environment:', import.meta.env.MODE);
    logger.log('Base URL:', import.meta.env.BASE_URL);
    logger.log(
      'Supabase configured:',
      !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
    );
    logger.log('Document ready state:', document.readyState);
    logger.log('Root element:', !!document.getElementById('root'));
    logger.groupEnd();
  }

  static testAssetLoading() {
    if (!Environment.shouldShowDebugLogs()) {
      return;
    }

    logger.group('Asset Loading Test');

    const hasStyles = Array.from(document.styleSheets).some(
      sheet => sheet.href?.includes('assets/index-') || sheet.href?.includes('main.'),
    );
    logger.log('CSS loaded:', hasStyles);

    const hasMainJS = Array.from(document.scripts).some(
      script => script.src?.includes('assets/index-') || script.src?.includes('main.'),
    );
    logger.log('Main JS loaded:', hasMainJS);

    logger.groupEnd();
  }

  static async performHealthCheck() {
    if (!Environment.shouldShowDebugLogs() && Environment.isStackBlitz()) {
      return;
    }

    logger.group('Application Health Check');

    try {
      const rootElement = document.getElementById('root');
      logger.log('Root element exists:', !!rootElement);
      logger.log('Root has content:', rootElement?.innerHTML.length || 0);

      const envCheck = {
        hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        mode: import.meta.env.MODE,
        dev: import.meta.env.DEV,
        prod: import.meta.env.PROD,
      };
      logger.table(envCheck);

      const apiCheck = {
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        crypto: typeof crypto !== 'undefined',
        serviceWorker: 'serviceWorker' in navigator,
      };
      logger.table(apiCheck);
    } catch (error) {
      logger.error('Health check failed', error);
    }

    logger.groupEnd();
  }

  static clearAllCaches() {
    logger.group('Cache Clearing');

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        logger.log(`Unregistering ${registrations.length} service workers`);
        registrations.forEach(registration => registration.unregister());
      });
    }

    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        logger.log(`Deleting ${cacheNames.length} cache entries:`, cacheNames);
        cacheNames.forEach(cacheName => caches.delete(cacheName));
      });
    }

    try {
      localStorage.clear();
      sessionStorage.clear();
      logger.log('Storage cleared');
    } catch (error) {
      logger.warn('Could not clear storage', { error });
    }

    logger.groupEnd();
    logger.log('All caches cleared. Reloading page...');

    setTimeout(() => window.location.reload(), 1000);
  }
}

declare global {
  interface Window {
    diagnose: () => Promise<void>;
    clearAllCaches: () => void;
  }
}

if (import.meta.env.PROD || Environment.shouldShowDebugLogs()) {
  document.addEventListener('DOMContentLoaded', () => {
    ProductionDiagnostics.logEnvironment();
    ProductionDiagnostics.testAssetLoading();

    window.diagnose = ProductionDiagnostics.performHealthCheck;
    window.clearAllCaches = ProductionDiagnostics.clearAllCaches;

    if (Environment.shouldShowDebugLogs()) {
      logger.log('Debug tools available: diagnose(), clearAllCaches()');
    }
  });
}

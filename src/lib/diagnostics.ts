// Production diagnostics utility
export class ProductionDiagnostics {
  static logEnvironment() {
    console.group('Production Environment Check');
    console.log('Build time:', import.meta.env.VITE_BUILD_TIME || 'Unknown');
    console.log('Environment:', import.meta.env.MODE);
    console.log('Base URL:', import.meta.env.BASE_URL);
    console.log(
      'Supabase configured:',
      !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
    );
    console.log('Document ready state:', document.readyState);
    console.log('Root element:', !!document.getElementById('root'));
    console.groupEnd();
  }

  static testAssetLoading() {
    console.group('Asset Loading Test');

    // Test if main CSS loaded
    const hasStyles = Array.from(document.styleSheets).some(
      sheet => sheet.href?.includes('assets/index-') || sheet.href?.includes('main.'),
    );
    console.log('CSS loaded:', hasStyles);

    // Test if main JS loaded
    const hasMainJS = Array.from(document.scripts).some(
      script => script.src?.includes('assets/index-') || script.src?.includes('main.'),
    );
    console.log('Main JS loaded:', hasMainJS);

    // Check for common missing assets
    const checkImage = (src: string) => {
      const img = new Image();
      img.onload = () => console.log(`Icon loaded: ${src}`);
      img.onerror = () => console.warn(`Icon failed to load: ${src}`);
      img.src = src;
    };

    // Run image checks for core favicons/icons if they exist
    const iconPaths = ['favicon.ico', '/icons/icon-192.png', '/icons/icon-512.png'];
    iconPaths.forEach(checkImage);

    console.groupEnd();
  }

  static async performHealthCheck() {
    console.group('Application Health Check');

    try {
      // Check if React is working
      const rootElement = document.getElementById('root');
      console.log('Root element exists:', !!rootElement);
      console.log('Root has content:', rootElement?.innerHTML.length || 0);

      // Check if environment variables are accessible
      const envCheck = {
        hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        mode: import.meta.env.MODE,
        dev: import.meta.env.DEV,
        prod: import.meta.env.PROD,
      };
      console.table(envCheck);

      // Test basic browser APIs
      const apiCheck = {
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        crypto: typeof crypto !== 'undefined',
        serviceWorker: 'serviceWorker' in navigator,
      };
      console.table(apiCheck);
    } catch (error) {
      console.error('Health check failed:', error);
    }

    console.groupEnd();
  }

  static clearAllCaches() {
    console.group('Cache Clearing');

    // Clear service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log(`Unregistering ${registrations.length} service workers`);
        registrations.forEach(registration => registration.unregister());
      });
    }

    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        console.log(`Deleting ${cacheNames.length} cache entries:`, cacheNames);
        cacheNames.forEach(cacheName => caches.delete(cacheName));
      });
    }

    // Clear storage
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('Storage cleared');
    } catch (error) {
      console.warn('Could not clear storage:', error);
    }

    console.groupEnd();
    console.log('All caches cleared. Reloading page...');

    setTimeout(() => window.location.reload(), 1000);
  }
}

// Auto-run diagnostics in production
if (import.meta.env.PROD) {
  document.addEventListener('DOMContentLoaded', () => {
    ProductionDiagnostics.logEnvironment();
    ProductionDiagnostics.testAssetLoading();

    // Add global diagnostic functions for debugging
    (window as any).diagnose = ProductionDiagnostics.performHealthCheck;
    (window as any).clearAllCaches = ProductionDiagnostics.clearAllCaches;

    console.log('Debug tools available: diagnose(), clearAllCaches()');
  });
}

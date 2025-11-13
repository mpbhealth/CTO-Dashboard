export class Environment {
  static isStackBlitz(): boolean {
    return window.location.hostname.includes('stackblitz') ||
           window.location.hostname.includes('webcontainer');
  }

  static isProduction(): boolean {
    return import.meta.env.PROD;
  }

  static isDevelopment(): boolean {
    return import.meta.env.DEV;
  }

  static shouldShowDebugLogs(): boolean {
    return (
      this.isDevelopment() &&
      !this.isStackBlitz() &&
      localStorage.getItem('debug') === 'true'
    );
  }

  static shouldSuppressPlatformErrors(): boolean {
    return this.isStackBlitz();
  }

  static getPlatformInfo() {
    return {
      isStackBlitz: this.isStackBlitz(),
      isProduction: this.isProduction(),
      isDevelopment: this.isDevelopment(),
      hostname: window.location.hostname,
      mode: import.meta.env.MODE,
    };
  }

  static isPlatformError(error: Error | string): boolean {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const platformErrorPatterns = [
      'ad_conversions',
      'Tracking has already been taken',
      'sendAdConversions',
      'Contextify',
      'IPC flooding',
      'stackblitz.com/api',
      'preloaded using link preload',
      'not used within a few seconds',
      'webcontainer',
      's3.us-west-2.amazonaws.com',
      'user/tokens/registries',
      'Failed to fetch',
      'analytics.client',
      'performance-',
      'fetch-',
    ];

    return platformErrorPatterns.some(pattern =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  static shouldSuppressWarning(message: string): boolean {
    const suppressPatterns = [
      'preloaded using link preload',
      'not used within a few seconds',
      'Failed to load resource',
      'webcontainer',
      'stackblitz',
      'Contextify',
    ];

    return suppressPatterns.some(pattern =>
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  static log(message: string, data?: unknown) {
    if (this.shouldShowDebugLogs()) {
      console.log(`[MPB Health] ${message}`, data || '');
    }
  }

  static warn(message: string, data?: unknown) {
    if (this.shouldSuppressWarning(message)) {
      return;
    }
    if (!this.isStackBlitz() || this.shouldShowDebugLogs()) {
      console.warn(`[MPB Health] ${message}`, data || '');
    }
  }

  static error(message: string, error?: unknown) {
    if (!this.isPlatformError(error || message)) {
      console.error(`[MPB Health] ${message}`, error || '');
    }
  }

  static suppressPlatformWarnings() {
    if (this.isStackBlitz()) {
      const originalWarn = console.warn;
      const originalError = console.error;

      console.warn = (...args: unknown[]) => {
        const message = args.join(' ');
        if (!this.shouldSuppressWarning(message)) {
          originalWarn.apply(console, args);
        }
      };

      console.error = (...args: unknown[]) => {
        const message = args.join(' ');
        if (!this.isPlatformError(message)) {
          originalError.apply(console, args);
        }
      };
    }
  }
}

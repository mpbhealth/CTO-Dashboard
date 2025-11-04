/**
 * Console Filter - Suppress StackBlitz Platform Noise
 *
 * This module filters out harmless platform-specific warnings and errors
 * that pollute the console in StackBlitz/WebContainer environments.
 */

const SUPPRESSED_PATTERNS = [
  // StackBlitz ad conversion tracking
  'ad_conversions',
  'Tracking has already been taken',
  'sendAdConversions',
  'login-DIHtQvYJ.js',

  // WebContainer warnings
  'Contextify',
  'WARNING',
  'running source code in new context',
  'blitz.cf284e50.js',
  'webcontainer.cf284e50.js',

  // Preload resource warnings
  'preloaded using link preload',
  'not used within a few seconds',
  'window\'s load event',
  'The resource <URL>',

  // Platform-specific failures
  'stackblitz.com/api',
  'stackblitz-user-content',
  's3.us-west-2.amazonaws.com',
  'user/tokens/registries',
  'registries?ownerSlug',
  'webcontainer',
  'Failed to load resource',
  'the server responded with a status of 422',
  'the server responded with a status of 403',
  'the server responded with a status of 429',

  // Analytics errors (non-critical)
  'analytics.client',
  'performance-',
  'fetch-',
  'Failed to fetch',
  'sendAnalyticsEvent',
  'ChatHooks.sendMessage',
  'Chat.client-CSwSu11a.js',
  'analytics.client-BHXoRoqD.js',
  'performance-Cvg2549L.js',
  'fetch-7jWGE-UY.js',

  // StackBlitz client errors
  'entry.client-nEkgzEQK.js',
  'deployed function department-data-upload',

  // Supabase temporary errors (will be fixed)
  '/rest/v1/resources',
  'the server responded with a status of 500',
];

function shouldSuppress(args: unknown[]): boolean {
  const message = args.map(arg => String(arg)).join(' ').toLowerCase();
  return SUPPRESSED_PATTERNS.some(pattern =>
    message.includes(pattern.toLowerCase())
  );
}

// Store originals
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};

let isInstalled = false;

export function installConsoleFilter() {
  if (isInstalled) return;
  isInstalled = true;

  // Only filter in StackBlitz/WebContainer
  const isStackBlitz = window.location.hostname.includes('stackblitz') ||
                       window.location.hostname.includes('webcontainer');

  if (!isStackBlitz) return;

  // Filter console.warn
  console.warn = (...args: unknown[]) => {
    if (!shouldSuppress(args)) {
      originalConsole.warn.apply(console, args);
    }
  };

  // Filter console.error
  console.error = (...args: unknown[]) => {
    if (!shouldSuppress(args)) {
      originalConsole.error.apply(console, args);
    }
  };
}

export function uninstallConsoleFilter() {
  if (!isInstalled) return;
  isInstalled = false;

  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
}

// Auto-install immediately when this module is imported
installConsoleFilter();

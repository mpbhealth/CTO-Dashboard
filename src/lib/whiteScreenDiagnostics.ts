import { supabase, isSupabaseConfigured } from './supabase';
import { logger } from './logger';

export interface DiagnosticResult {
  category: string;
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    details?: string;
  }[];
}

export class WhiteScreenDiagnostics {
  static async runFullDiagnostics(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    results.push(await this.checkEnvironmentConfiguration());
    results.push(await this.checkSupabaseConnection());
    results.push(await this.checkAuthentication());
    results.push(this.checkBrowserAPIs());
    results.push(this.checkCacheAndStorage());
    results.push(this.checkDOM());
    results.push(this.checkRouting());

    return results;
  }

  static async checkEnvironmentConfiguration(): Promise<DiagnosticResult> {
    const checks = [];

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    checks.push({
      name: 'Environment Mode',
      status: 'pass' as const,
      message: `Running in ${import.meta.env.MODE} mode`,
      details: `DEV: ${import.meta.env.DEV}, PROD: ${import.meta.env.PROD}`,
    });

    if (!supabaseUrl || !supabaseKey) {
      checks.push({
        name: 'Supabase Environment Variables',
        status: 'fail' as const,
        message: 'Missing Supabase environment variables',
        details: `URL present: ${!!supabaseUrl}, Key present: ${!!supabaseKey}`,
      });
    } else if (!isSupabaseConfigured) {
      checks.push({
        name: 'Supabase Configuration Validation',
        status: 'fail' as const,
        message: 'Supabase configuration is invalid',
        details: 'URL or key format is incorrect',
      });
    } else {
      checks.push({
        name: 'Supabase Configuration',
        status: 'pass' as const,
        message: 'Supabase is properly configured',
      });
    }

    checks.push({
      name: 'Base URL',
      status: 'pass' as const,
      message: `Base URL: ${import.meta.env.BASE_URL}`,
    });

    return {
      category: 'Environment Configuration',
      checks,
    };
  }

  static async checkSupabaseConnection(): Promise<DiagnosticResult> {
    const checks = [];

    if (!isSupabaseConfigured) {
      checks.push({
        name: 'Supabase Connection',
        status: 'fail' as const,
        message: 'Cannot test connection - Supabase not configured',
      });
      return { category: 'Supabase Connection', checks };
    }

    try {
      const { error } = await supabase.auth.getSession();
      if (error) {
        checks.push({
          name: 'Supabase Session Check',
          status: 'fail' as const,
          message: 'Failed to retrieve session',
          details: error.message,
        });
      } else {
        checks.push({
          name: 'Supabase Session Check',
          status: 'pass' as const,
          message: 'Successfully connected to Supabase',
        });
      }
    } catch (error) {
      checks.push({
        name: 'Supabase Connection',
        status: 'fail' as const,
        message: 'Connection error',
        details: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        checks.push({
          name: 'Profiles Table Access',
          status: 'fail' as const,
          message: 'Cannot access profiles table',
          details: error.message,
        });
      } else {
        checks.push({
          name: 'Profiles Table Access',
          status: 'pass' as const,
          message: 'Profiles table is accessible',
        });
      }
    } catch (error) {
      checks.push({
        name: 'Profiles Table Access',
        status: 'warning' as const,
        message: 'Could not test profiles table',
        details: error instanceof Error ? error.message : String(error),
      });
    }

    return {
      category: 'Supabase Connection',
      checks,
    };
  }

  static async checkAuthentication(): Promise<DiagnosticResult> {
    const checks = [];

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        checks.push({
          name: 'Auth Session',
          status: 'fail' as const,
          message: 'Error retrieving auth session',
          details: error.message,
        });
      } else if (!session) {
        checks.push({
          name: 'Auth Session',
          status: 'warning' as const,
          message: 'No active session (user not logged in)',
        });
      } else {
        checks.push({
          name: 'Auth Session',
          status: 'pass' as const,
          message: 'Active session found',
          details: `User ID: ${session.user.id}`,
        });

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          checks.push({
            name: 'User Profile',
            status: 'fail' as const,
            message: 'Error loading user profile',
            details: profileError.message,
          });
        } else if (!profile) {
          checks.push({
            name: 'User Profile',
            status: 'fail' as const,
            message: 'No profile found for authenticated user',
            details: 'Profile may not have been created during signup',
          });
        } else {
          checks.push({
            name: 'User Profile',
            status: 'pass' as const,
            message: 'User profile loaded successfully',
            details: `Role: ${profile.role || 'Not set'}`,
          });

          if (!profile.role) {
            checks.push({
              name: 'User Role',
              status: 'fail' as const,
              message: 'User role is not set',
              details: 'Role is required for dashboard access',
            });
          }
        }
      }
    } catch (error) {
      checks.push({
        name: 'Authentication Check',
        status: 'fail' as const,
        message: 'Authentication check failed',
        details: error instanceof Error ? error.message : String(error),
      });
    }

    const cachedProfiles = Object.keys(localStorage).filter(key =>
      key.startsWith('mpb_profile_cache')
    );
    checks.push({
      name: 'Profile Cache',
      status: cachedProfiles.length > 0 ? 'pass' : 'warning' as const,
      message: `${cachedProfiles.length} cached profile(s) found`,
      details: cachedProfiles.join(', '),
    });

    return {
      category: 'Authentication',
      checks,
    };
  }

  static checkBrowserAPIs(): DiagnosticResult {
    const checks = [];

    const apis = {
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      fetch: typeof fetch !== 'undefined',
      crypto: typeof crypto !== 'undefined',
      serviceWorker: 'serviceWorker' in navigator,
      caches: 'caches' in window,
    };

    for (const [api, available] of Object.entries(apis)) {
      checks.push({
        name: `${api} API`,
        status: available ? 'pass' : 'fail' as const,
        message: available ? 'Available' : 'Not available',
      });
    }

    return {
      category: 'Browser APIs',
      checks,
    };
  }

  static checkCacheAndStorage(): DiagnosticResult {
    const checks = [];

    try {
      const localStorageSize = JSON.stringify(localStorage).length;
      checks.push({
        name: 'LocalStorage',
        status: 'pass' as const,
        message: `Using ${localStorageSize} bytes`,
        details: `${Object.keys(localStorage).length} keys stored`,
      });
    } catch (error) {
      checks.push({
        name: 'LocalStorage',
        status: 'fail' as const,
        message: 'Cannot access localStorage',
        details: error instanceof Error ? error.message : String(error),
      });
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        logger.info(`${registrations.length} service worker(s) registered`);
      });
      checks.push({
        name: 'Service Workers',
        status: 'warning' as const,
        message: 'Check console for service worker details',
      });
    }

    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        logger.info(`${cacheNames.length} cache(s) found:`, cacheNames);
      });
      checks.push({
        name: 'Cache Storage',
        status: 'warning' as const,
        message: 'Check console for cache details',
      });
    }

    return {
      category: 'Cache and Storage',
      checks,
    };
  }

  static checkDOM(): DiagnosticResult {
    const checks = [];

    const rootElement = document.getElementById('root');
    if (!rootElement) {
      checks.push({
        name: 'Root Element',
        status: 'fail' as const,
        message: 'Root element (#root) not found in DOM',
      });
    } else {
      checks.push({
        name: 'Root Element',
        status: 'pass' as const,
        message: 'Root element exists',
        details: `Content length: ${rootElement.innerHTML.length} characters`,
      });
    }

    checks.push({
      name: 'Document Ready State',
      status: 'pass' as const,
      message: `Document is ${document.readyState}`,
    });

    const styleSheets = Array.from(document.styleSheets);
    checks.push({
      name: 'CSS Loaded',
      status: styleSheets.length > 0 ? 'pass' : 'fail' as const,
      message: `${styleSheets.length} stylesheet(s) loaded`,
    });

    const scripts = Array.from(document.scripts);
    checks.push({
      name: 'Scripts Loaded',
      status: scripts.length > 0 ? 'pass' : 'fail' as const,
      message: `${scripts.length} script(s) loaded`,
    });

    return {
      category: 'DOM and Assets',
      checks,
    };
  }

  static checkRouting(): DiagnosticResult {
    const checks = [];

    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    const currentSearch = window.location.search;

    checks.push({
      name: 'Current Route',
      status: 'pass' as const,
      message: `Path: ${currentPath}`,
      details: `Hash: ${currentHash || 'none'}, Search: ${currentSearch || 'none'}`,
    });

    const expectedRoutes = [
      '/login',
      '/auth/callback',
      '/ceod/home',
      '/ctod/home',
      '/public/upload',
    ];

    const isKnownRoute = expectedRoutes.some(route => currentPath.startsWith(route)) || currentPath === '/';
    checks.push({
      name: 'Route Recognition',
      status: isKnownRoute ? 'pass' : 'warning' as const,
      message: isKnownRoute ? 'Route is recognized' : 'Unknown route',
      details: `Expected routes: ${expectedRoutes.join(', ')}`,
    });

    return {
      category: 'Routing',
      checks,
    };
  }

  static async clearAllCaches(): Promise<void> {
    logger.info('Starting cache clearing process...');

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      logger.info(`Unregistering ${registrations.length} service workers`);
      await Promise.all(registrations.map(reg => reg.unregister()));
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      logger.info(`Deleting ${cacheNames.length} caches`);
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    try {
      localStorage.clear();
      sessionStorage.clear();
      logger.info('Storage cleared');
    } catch (error) {
      logger.error('Error clearing storage', error);
    }

    logger.info('All caches cleared. Reloading...');
    setTimeout(() => window.location.reload(), 500);
  }

  static async clearAuthCache(): Promise<void> {
    logger.info('Clearing authentication cache...');

    const authKeys = Object.keys(localStorage).filter(key =>
      key.startsWith('mpb_profile_cache') ||
      key.startsWith('supabase.auth') ||
      key.includes('auth-token')
    );

    authKeys.forEach(key => localStorage.removeItem(key));
    logger.info(`Cleared ${authKeys.length} auth-related cache entries`);
  }

  static printDiagnosticReport(results: DiagnosticResult[]): void {
    console.group('🔍 White Screen Diagnostic Report');

    results.forEach(result => {
      console.group(`📋 ${result.category}`);
      result.checks.forEach(check => {
        const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
        console.log(`${icon} ${check.name}: ${check.message}`);
        if (check.details) {
          console.log(`   Details: ${check.details}`);
        }
      });
      console.groupEnd();
    });

    const failedChecks = results.flatMap(r => r.checks).filter(c => c.status === 'fail');
    const warningChecks = results.flatMap(r => r.checks).filter(c => c.status === 'warning');

    console.group('📊 Summary');
    console.log(`Total checks: ${results.flatMap(r => r.checks).length}`);
    console.log(`✅ Passed: ${results.flatMap(r => r.checks).filter(c => c.status === 'pass').length}`);
    console.log(`⚠️  Warnings: ${warningChecks.length}`);
    console.log(`❌ Failed: ${failedChecks.length}`);
    console.groupEnd();

    if (failedChecks.length > 0) {
      console.group('🚨 Critical Issues Detected');
      failedChecks.forEach(check => {
        console.error(`❌ ${check.name}: ${check.message}`);
        if (check.details) console.error(`   ${check.details}`);
      });
      console.groupEnd();
    }

    console.groupEnd();
  }
}

declare global {
  interface Window {
    diagnoseWhiteScreen: () => Promise<void>;
    clearAllCaches: () => Promise<void>;
    clearAuthCache: () => Promise<void>;
  }
}

window.diagnoseWhiteScreen = async () => {
  console.log('Running comprehensive white screen diagnostics...');
  const results = await WhiteScreenDiagnostics.runFullDiagnostics();
  WhiteScreenDiagnostics.printDiagnosticReport(results);
};

window.clearAllCaches = WhiteScreenDiagnostics.clearAllCaches;
window.clearAuthCache = WhiteScreenDiagnostics.clearAuthCache;

if (import.meta.env.DEV) {
  console.log('🛠️  Diagnostic tools available:');
  console.log('  • diagnoseWhiteScreen() - Run full diagnostic check');
  console.log('  • clearAllCaches() - Clear all caches and reload');
  console.log('  • clearAuthCache() - Clear authentication cache only');
}

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@data': path.resolve(__dirname, './src/data'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    },
    // Prevent multiple copies of React core from being bundled (common cause of scheduler/runtime crashes)
    dedupe: ['react', 'react-dom', 'scheduler'],
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['@supabase/supabase-js'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    assetsDir: 'assets',
    modulePreload: {
      polyfill: true,
      resolveDependencies: (filename, deps) => {
        // Reduce preload warnings by limiting preloaded dependencies
        return deps.filter(dep => {
          // Only preload critical chunks
          return dep.includes('react-vendor') ||
                 dep.includes('supabase-vendor') ||
                 dep.includes('router');
        });
      },
    },
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Normalize Windows paths so chunking is consistent across dev/build OSes.
            // Rollup 'id' may contain backslashes on Windows.
            const normalizedId = id.replace(/\\/g, '/');

            // CRITICAL: Keep React core packages together to prevent scheduler conflicts
            // This includes react, react-dom, and scheduler (react-dom's dependency)
            if (
              normalizedId.includes('/react/') ||
              normalizedId.includes('/react-dom/') ||
              normalizedId.includes('/scheduler/')
            ) {
              return 'react-vendor';
            }
            // Router - must check before generic 'react' catch
            if (normalizedId.includes('react-router')) {
              return 'router';
            }
            // FIX: Keep ALL Supabase packages together in ONE chunk to prevent circular dependencies
            if (normalizedId.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // React Query (TanStack) - has React peer dep
            if (normalizedId.includes('@tanstack')) {
              return 'query';
            }
            // Office document libraries - lazy load (very heavy)
            if (normalizedId.includes('xlsx') || normalizedId.includes('jspdf') || normalizedId.includes('pptxgenjs')) {
              return 'office';
            }
            // Data processing libraries
            if (normalizedId.includes('papaparse') || normalizedId.includes('csv')) {
              return 'csv';
            }
            // UI libraries - lazy load (framer-motion, lucide)
            if (normalizedId.includes('framer-motion') || normalizedId.includes('lucide-react')) {
              return 'ui-libs';
            }
            // Date libraries
            if (normalizedId.includes('dayjs')) {
              return 'date';
            }
            // Radix UI components - keep together
            if (normalizedId.includes('@radix-ui')) {
              return 'radix';
            }
            // DnD Kit
            if (normalizedId.includes('@dnd-kit')) {
              return 'dnd';
            }
            // Everything else goes to vendor
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
});

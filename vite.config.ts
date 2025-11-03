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
    },
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Keep React and React-DOM together - CRITICAL for proper initialization
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // FIX: Keep ALL Supabase packages together in ONE chunk to prevent circular dependencies
            // This prevents the "Cannot access 'ae' before initialization" error in production
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // Router
            if (id.includes('react-router')) {
              return 'router';
            }
            // Charts
            if (id.includes('recharts')) {
              return 'charts';
            }
            // UI libraries
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'ui-libs';
            }
            // Everything else
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

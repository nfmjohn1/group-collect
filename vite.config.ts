import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './extension/src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'extension/src/popup/index.html'),
        dashboard: path.resolve(__dirname, 'extension/src/dashboard/index.html'),
        background: path.resolve(__dirname, 'extension/src/background/index.ts'),
        'content-scraper': path.resolve(__dirname, 'extension/src/content/scraper.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Put scripts in appropriate directories
          if (chunkInfo.name === 'background') {
            return 'background/[name].js';
          }
          if (chunkInfo.name.startsWith('content-')) {
            return 'content/[name].js';
          }
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Inline all imports for content scripts to avoid module loading issues
        manualChunks: (id) => {
          // Don't create separate chunks for content script dependencies
          if (id.includes('content/scraper') || id.includes('content/decliner')) {
            return undefined;
          }
          // For everything else, use default chunking
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  publicDir: 'extension/public',
});

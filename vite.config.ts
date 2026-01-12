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
      },
    },
  },
  publicDir: 'extension/public',
});

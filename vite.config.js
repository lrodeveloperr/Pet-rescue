import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths so the build works from any folder the host serves it from.
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 800,
  },
});

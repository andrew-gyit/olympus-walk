import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative base keeps the build portable on Netlify, itch.io, GitHub Pages
  // project sites and any subdirectory hosting.
  base: './',
  server: { host: '::', port: 5173, strictPort: true },
  preview: { host: '::', port: 4173, strictPort: true },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2400,
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11', 'Android >= 7', 'Chrome >= 60'],
      renderModernChunks: true
    })
  ],
  server: {
    port: 5173,
    host: true
  }
});

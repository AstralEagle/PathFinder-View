/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Le dictionnaire des noms (~9 000 entrées) est inclus dans le bundle, mis en cache par la PWA.
    chunkSizeWarningLimit: 800,
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
  },
});

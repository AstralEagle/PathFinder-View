/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // PWA : installable sur l'écran d'accueil, fonctionne hors-ligne (service worker Workbox).
    // Inutile pendant les tests.
    !process.env.VITEST &&
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icon-maskable.svg'],
        manifest: {
          name: 'Fiche PF2',
          short_name: 'Fiche PF2',
          description: 'Fiche de personnage Pathfinder 2e en français, à partir de Pathbuilder 2e.',
          lang: 'fr',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#1f4d36',
          background_color: '#f3ead2',
          icons: [
            { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
            { src: 'icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
          // Le bundle embarque le dictionnaire des noms (~700 Ko).
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          navigateFallback: '/index.html',
        },
      }),
  ],
  build: {
    // Le dictionnaire des noms (~9 000 entrées) est inclus dans le bundle, mis en cache par la PWA.
    chunkSizeWarningLimit: 800,
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
  },
});

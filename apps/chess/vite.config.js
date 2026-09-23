import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { sharedSw } from '../../packages/shared/vite/swPlugin.js'

// Two build targets share this config:
//   `vite build`                 → GitHub Pages, served from /life-architecture/chess/
//   `vite build --mode android`  → Capacitor, served from the WebView root
// The Android WebView serves the bundled assets from the origin root, so the
// Pages sub-path would 404 there; relative URLs work in both places.
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    sharedSw({
      name: 'chess',
      cacheOnly: [/\/engine\//, /\/games\/ev\//],
      skipPrecache: [/\.nnue$/, /\/games\/ev\//],
    }),
  ],
  define: {
    // Stamped at build time so Settings can show which build is installed:
    // there's no store to ask, so the APK has to carry its own identity.
    __BUILD_ID__: JSON.stringify((process.env.GITHUB_SHA || "").slice(0, 7) || "local"),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  base: mode === 'android' ? './' : '/life-architecture/chess/',
  resolve: {
    alias: { '@shared': path.resolve(__dirname, '../../packages/shared/src') },
    dedupe: ['react', 'react-dom', '@capacitor/core', '@capacitor/app', '@capacitor/local-notifications'],
  },
  server: { fs: { allow: [path.resolve(__dirname, '../..')] } },
}))

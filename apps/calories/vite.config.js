import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { sharedSw } from '../../packages/shared/vite/swPlugin.js'

// Two build targets share this config:
//   `vite build`                 → GitHub Pages, served from /life-architecture/calories/
//   `vite build --mode android`  → Capacitor, served from the WebView root
// The Android WebView serves bundled assets from the origin root, so the
// Pages sub-path would 404 there; relative URLs work in both places.
export default defineConfig(({ mode }) => ({
  plugins: [react(), sharedSw({ name: 'calories' })],
  base: mode === 'android' ? './' : '/life-architecture/calories/',
  resolve: {
    alias: { '@shared': path.resolve(__dirname, '../../packages/shared/src') },
    dedupe: ['react', 'react-dom', '@capacitor/core', '@capacitor/app', '@capacitor/local-notifications'],
  },
  server: { fs: { allow: [path.resolve(__dirname, '../..')] } },
}))

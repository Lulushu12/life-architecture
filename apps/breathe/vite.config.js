import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Two build targets share this config:
//   `vite build`                 → GitHub Pages, served from /life-architecture/breathe/
//   `vite build --mode android`  → Capacitor, served from the WebView root
// The Android WebView serves bundled assets from the origin root, so the
// Pages sub-path would 404 there; relative URLs work in both places.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'android' ? './' : '/life-architecture/breathe/',
}))

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs'
import { sharedSw } from '../../packages/shared/vite/swPlugin.js'

const fonts = fs.readdirSync(path.resolve(__dirname, 'public/fonts')).map((f) => `fonts/${f}`)

// Two build targets share this config:
//   `vite build`                 → GitHub Pages, served from /life-architecture/
//   `vite build --mode android`  → Capacitor, served from the WebView root
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    sharedSw({
      name: 'life-architecture',
      extraPrecache: fonts,
      // The root scope encloses every sibling app; leave their files to their own workers.
      ignore: [/^\/life-architecture\/(whist|breathe|focus|games|calories|ortho|chess)\//],
    }),
  ],
  base: mode === 'android' ? './' : '/life-architecture/',
  resolve: {
    alias: { '@shared': path.resolve(__dirname, '../../packages/shared/src') },
    dedupe: ['react', 'react-dom', '@capacitor/core', '@capacitor/app', '@capacitor/local-notifications'],
  },
  server: { fs: { allow: [path.resolve(__dirname, '../..')] } },
}))

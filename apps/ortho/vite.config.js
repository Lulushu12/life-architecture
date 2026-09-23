import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { sharedSw } from '../../packages/shared/vite/swPlugin.js'

export default defineConfig(({ mode }) => ({
  plugins: [react(), sharedSw({ name: 'ortho' })],
  base: mode === 'android' ? './' : '/life-architecture/ortho/',
  resolve: {
    alias: { '@shared': path.resolve(__dirname, '../../packages/shared/src') },
    dedupe: ['react', 'react-dom', '@capacitor/core', '@capacitor/app', '@capacitor/local-notifications'],
  },
  server: { fs: { allow: [path.resolve(__dirname, '../..')] } },
}))

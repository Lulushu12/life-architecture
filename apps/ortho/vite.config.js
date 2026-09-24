import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { sharedSw } from '../../packages/shared/vite/swPlugin.js'
import { writeIndex } from './scripts/build-index.mjs'

const CONTENT_DIR = path.resolve(__dirname, 'src/content')

function contentIndex() {
  return {
    name: 'ortho-content-index',
    buildStart() {
      writeIndex()
    },
    configureServer(server) {
      const onChange = (file) => {
        if (file.startsWith(CONTENT_DIR) && file.endsWith('.md')) writeIndex()
      }
      server.watcher.on('add', onChange)
      server.watcher.on('change', onChange)
      server.watcher.on('unlink', onChange)
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [contentIndex(), react(), sharedSw({ name: 'ortho' })],
  json: { stringify: true },
  base: mode === 'android' ? './' : '/life-architecture/ortho/',
  resolve: {
    alias: { '@shared': path.resolve(__dirname, '../../packages/shared/src') },
    dedupe: ['react', 'react-dom', '@capacitor/core', '@capacitor/app', '@capacitor/local-notifications'],
  },
  server: { fs: { allow: [path.resolve(__dirname, '../..')] } },
}))

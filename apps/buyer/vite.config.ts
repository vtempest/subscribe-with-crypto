import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@crypto-subscribe/ui': path.resolve(__dirname, '../../packages/ui/index.ts'),
      '@crypto-subscribe/lib': path.resolve(__dirname, '../../packages/lib/index.ts'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})

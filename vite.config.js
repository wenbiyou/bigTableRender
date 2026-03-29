import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  // 确保Worker正确加载
  worker: {
    format: 'es'
  },
  // GitHub Pages 配置
  base: process.env.NODE_ENV === 'production' ? '/bigTableRender/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          reactWindow: ['react-window']
        }
      }
    }
  }
})
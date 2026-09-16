import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const backendTarget = process.env.VITE_BACKEND_URL || 'http://localhost:8080'
const minioTarget = process.env.VITE_MINIO_URL || 'http://localhost:9000'

const proxyConfig = {
  '/auth': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/users': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/posts': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/comments': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/feed': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/media': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/friend-requests': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/social-media': {
    target: minioTarget,
    changeOrigin: true,
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Cho phép truy cập từ 0.0.0.0 (bên ngoài container)
    port: 5173,
    watch: {
      usePolling: true, // Cần thiết trên Windows / Docker để hot-reload nhận file thay đổi
    },
    proxy: proxyConfig,
  },
  preview: {
    host: true,
    port: 4173,
    proxy: proxyConfig,
  },
})

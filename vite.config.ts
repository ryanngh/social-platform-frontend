import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Cho phép truy cập từ 0.0.0.0 (bên ngoài container)
    port: 5173,
    watch: {
      usePolling: true, // Cần thiết trên Windows / Docker để hot-reload nhận file thay đổi
    },
    proxy: {
      '/auth': {
        target: 'http://host.docker.internal:8080',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://host.docker.internal:8080',
        changeOrigin: true,
      },
      '/friend-requests': {
        target: 'http://host.docker.internal:8080',
        changeOrigin: true,
      },
      '/social-media': {
        target: 'http://host.docker.internal:9000',
        changeOrigin: true,
      },
    },
  },
})

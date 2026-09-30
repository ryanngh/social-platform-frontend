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
      ...Object.fromEntries(
        [
          '/auth',
          '/users',
          '/posts',
          '/comments',
          '/feed',
          '/api',
          '/media',
          '/friend-requests',
          '/close-friends',
          '/relationships',
          '/follows',
          '/notifications',
        ].map((path) => [
          path,
          {
            target: 'http://host.docker.internal:8080',
            changeOrigin: true,
            bypass: (req: import('http').IncomingMessage) => {
              // Nếu browser gửi request điều hướng trang (Accept: text/html), không proxy mà phục vụ index.html của SPA
              if (req.headers.accept?.includes('text/html')) {
                return '/index.html';
              }
            },
          },
        ])
      ),
      '/social-media': {
        target: 'http://host.docker.internal:9000',
        changeOrigin: true,
      },
    },
  },
})

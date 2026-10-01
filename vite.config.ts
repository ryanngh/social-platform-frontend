import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_BACKEND_TARGET || env.BACKEND_TARGET || 'http://localhost:8080'
  const chatTarget = env.VITE_CHAT_TARGET || env.CHAT_TARGET || 'http://localhost:8081'
  const minioTarget = env.VITE_MINIO_TARGET || env.MINIO_TARGET || 'http://localhost:9000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true, // Cho phép truy cập từ 0.0.0.0 (bên ngoài container)
      port: 5173,
      cors: true,
      allowedHosts: true,
      watch: {
        usePolling: true, // Cần thiết trên Windows / Docker để hot-reload nhận file thay đổi
      },
      proxy: {
        // Go Switchboard Chat REST API & WebSocket (port 8081)
        '/api/v1': {
          target: chatTarget,
          changeOrigin: true,
        },
        '/ws': {
          target: chatTarget,
          ws: true,
          changeOrigin: true,
        },
        // Spring Boot HQ REST APIs (port 8080)
        ...Object.fromEntries(
          [
            '/auth',
            '/users',
            '/posts',
            '/comments',
            '/feed',
            '/explore',
            '/api/explore',
            '/reposts',
            '/reactions',
            '/media',
            '/friend-requests',
            '/close-friends',
            '/relationships',
            '/follows',
            '/notifications',
            '/search',
            '/presence',
            '/hashtags',
          ].map((path) => [
            path,
            {
              target: backendTarget,
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
          target: minioTarget,
          changeOrigin: true,
        },
      },
    },
  }
})

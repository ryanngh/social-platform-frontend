import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Cho phép truy cập từ 0.0.0.0 (bên ngoài container)
    port: 5173,
    watch: {
      usePolling: true, // Cần thiết trên Windows / Docker để hot-reload nhận file thay đổi
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: mode === 'production' ? '/xmu-info-thesis-submission/' : '/',
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
}))

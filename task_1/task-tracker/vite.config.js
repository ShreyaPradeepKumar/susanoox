import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/susanoox/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    include: ['tests/ui/**/*.test.jsx'],
    setupFiles: ['./tests/ui/setup.js'],
    restoreMocks: true,
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/calculTOR/', // имя репозитория на GitHub
  plugins: [react()],
})

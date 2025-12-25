import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // 這行非常重要：它讓你的程式碼中的 process.env.API_KEY 能在 Vercel 環境中正確讀取
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})
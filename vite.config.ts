
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // 關鍵修正：建立橋樑
    // 讓程式碼裡的 process.env.API_KEY 能讀取到你在 Vercel 設定的 VITE_API_KEY
    'process.env.API_KEY': 'import.meta.env.VITE_API_KEY'
  }
})

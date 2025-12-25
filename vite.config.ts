
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 載入當前環境變數（包含 .env 檔案與 Vercel 系統變數）
  // 第三個參數 '' 代表載入所有變數，不限制前綴
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // 核心修正：
      // 直接把 env.VITE_API_KEY 的「值」變成字串，硬寫入到程式碼中
      // 這樣瀏覽器執行時，看到的就會是 "AIzaSy..." 而不是變數引用
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY)
    }
  }
})

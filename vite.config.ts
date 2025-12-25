
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 1. 載入所有環境變數 (第三個參數 '' 表示不限制前綴，載入全部)
  const env = loadEnv(mode, process.cwd(), '');

  // 2. 廣域搜索策略：嘗試所有可能的變數名稱
  // Vercel 有時候會因為設定不同，變數可能出現在 env 物件或 process.env 中
  // 我們依照優先順序嘗試抓取
  const targetKey = 
    env.VITE_API_KEY || 
    env.API_KEY || 
    env.GOOGLE_API_KEY || 
    process.env.VITE_API_KEY || 
    process.env.API_KEY || 
    '';

  // 在 Build Log 中印出狀態 (這會在 Vercel 的 Build Logs 裡看到)
  console.log(`[Vite Build Config] Target API Key Status: ${targetKey ? 'Found (Length: ' + targetKey.length + ')' : 'MISSING'}`);

  return {
    plugins: [react()],
    define: {
      // 3. 將抓到的鑰匙硬寫入前端程式碼
      'process.env.API_KEY': JSON.stringify(targetKey)
    }
  }
})

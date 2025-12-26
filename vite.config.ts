
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 載入當前模式的環境變數
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // 將 API_KEY 注入到 process.env 中，確保前端程式碼能讀取
      // 優選使用 Vite 的 env，若無則降級使用系統環境變數
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || '')
    }
  }
})

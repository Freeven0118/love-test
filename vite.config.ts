
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 1. Fix: Use process.cwd() with explicit node process import for better typing
  const env = loadEnv(mode, process.cwd(), '');

  // 2. Fix: Exclusively use API_KEY from environment variables as per guidelines
  // Note: VITE_ prefixed variables are handled by loadEnv automatically if preferred
  const targetKey = env.API_KEY || process.env.API_KEY || '';

  // In Build Log for debugging
  console.log(`[Vite Build Config] Target API Key Status: ${targetKey ? 'Found' : 'MISSING'}`);

  return {
    plugins: [react()],
    define: {
      // 3. Fix: Ensure process.env.API_KEY is available in the frontend environment
      'process.env.API_KEY': JSON.stringify(targetKey)
    }
  }
})

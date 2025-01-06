import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // 排除 worker.ts 文件，不进行 React Refresh 处理
      exclude: /\.worker\.(ts|js)$|worker\.ts$/,
    }),
  ],
  base: './',  // 设置相对路径
  worker: {
    format: 'es', // 确保 Worker 使用 ES 模块
  },
  build: {
    rollupOptions: {
      output: {
        format: 'es', // 强制模块格式为 ES 模块
        dir:'docs'
      },
    },
  },
  optimizeDeps: {
    include: ['immutable'], // 确保依赖被预构建
  },


})

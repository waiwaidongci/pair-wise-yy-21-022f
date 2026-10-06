import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// 本地开发把 /api 代理到后端；Docker 部署时由 frontend/nginx.conf 反代，二者都不改前端代码。
const apiTarget = process.env.VITE_API_TARGET ?? "http://localhost:3000";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 20104,
    host: "0.0.0.0",
    proxy: { "/api": { target: apiTarget, changeOrigin: true } }
  }
});

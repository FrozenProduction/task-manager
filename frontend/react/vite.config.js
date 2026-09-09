import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Determine the API base URL:
// - In production builds, use the deployed API URL from env or fallback to Render/Railway
// - In dev, proxy /api to localhost:8080
const isProd = process.env.NODE_ENV === "production";
const API_URL = isProd
  ? (process.env.VITE_API_URL || "https://task-manager-api-oej2.onrender.com")
  : "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(API_URL),
  },
});

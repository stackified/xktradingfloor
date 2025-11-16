import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Read base path from environment variable, default to "/" for localhost
  // VITE_BASE_PATH should be set via environment variable (e.g., /xktradingfloor/ for GitHub Pages)
  const basePath = process.env.VITE_BASE_PATH || "/";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: true,
    },
    base: basePath,
    build: {
      outDir: "docs", // Output to docs folder for GitHub Pages
      // Copy 404.html to root of build output
      rollupOptions: {
        input: {
          main: "./index.html",
        },
      },
    },
    publicDir: "public", // Ensure public folder is copied
  };
});

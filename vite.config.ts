/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/my-pdf-toolbox/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name].[hash].[ext]",
      },
    },
  },
  server: {
    port: 4173,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.ts", // Or a string for a single file
    css: true, // If you have CSS imports in your components
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    exclude: ["**/e2e/**", "**/node_modules/**"],
  },
});

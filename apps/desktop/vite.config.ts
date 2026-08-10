import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@domain-modeler/canvas-core": fileURLToPath(
        new URL("../../packages/canvas-core/src/index.ts", import.meta.url),
      ),
      "@domain-modeler/model-core": fileURLToPath(
        new URL("../../packages/model-core/src/index.ts", import.meta.url),
      ),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 14000,
    strictPort: true,
    host: host || "localhost",
    hmr: {
      protocol: "ws",
      host: host || "localhost",
      port: 14001,
    },
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  test: {
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "../../packages/**/*.{test,spec}.{ts,tsx}",
    ],
    environment: "happy-dom",
    coverage: {
      provider: "v8" as const,
      // frontend CI がリポジトリルートの coverage/ を拾えるようにする
      reportsDirectory: fileURLToPath(new URL("../../coverage", import.meta.url)),
      // packages/* は apps/desktop の外なので、明示的に許可する
      allowExternal: true,
      reporter: ["text", "json-summary", "json"],
      reportOnFailure: true,
      include: [
        "src/**/*.{ts,tsx}",
        "../../packages/**/src/**/*.{ts,tsx}",
      ],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.stories.{ts,tsx}",
        "src/**/*.d.ts",
        "src/main.tsx",
        "../../packages/**/src/**/*.{test,spec}.{ts,tsx}",
        "../../packages/**/src/**/*.d.ts",
      ],
    },
  },
}));

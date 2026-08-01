import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Root-level Vite config used by Storybook.
// The full app config (including Tauri dev server and Vitest) lives in apps/desktop/vite.config.ts.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./apps/desktop/src", import.meta.url)),
      "@domain-modeler/canvas-core": fileURLToPath(
        new URL("./packages/canvas-core/src/index.ts", import.meta.url),
      ),
      "@domain-modeler/model-core": fileURLToPath(
        new URL("./packages/model-core/src/index.ts", import.meta.url),
      ),
    },
  },
});

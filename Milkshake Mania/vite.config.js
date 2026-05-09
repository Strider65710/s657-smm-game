import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const projectRoot = path.dirname(fileURLToPath(import.meta.url));
  loadEnv(mode, projectRoot, "");

  return {
    // Required for `file://` desktop builds (pywebview) so assets resolve correctly.
    base: "./",
    plugins: [react(), tailwindcss()],
    root: projectRoot,
    envDir: projectRoot,
    resolve: {
      alias: {
        "@": path.resolve(projectRoot, "."),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== "true",
      fs: {
        strict: true,
      },
    },
  };
});

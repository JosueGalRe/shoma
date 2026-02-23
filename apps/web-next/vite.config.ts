import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { i18nextVitePlugin } from "@i18next-selector/vite-plugin";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            {
              name: "react",
              test: /node_modules\/(react|react-dom|scheduler)\//
            },
            {
              name: "tanstack",
              test: /node_modules\/@tanstack\//
            },
            {
              name: "i18n",
              test: /node_modules\/(i18next|react-i18next)\//
            },
            {
              name: "vendor",
              test: /node_modules\//
            }
          ]
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  plugins: [
    tanstackRouter(),
    react(),
    tailwindcss(),
    i18nextVitePlugin({
      sourceDir: path.join(path.resolve(), "src", "i18n"),
      silent: true
    })
  ]
});

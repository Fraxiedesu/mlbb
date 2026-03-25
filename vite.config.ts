import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { resolve } from "node:path";

export default defineConfig({
  base: "/mlbb/",
  plugins: [solid()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  },
  server: {
    port: 3000
  },
  build: {
    target: "esnext"
  }
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { securityBuildPlugin } from "./scripts/security-build.mjs";

export default defineConfig(({ mode }) => ({
  base: mode === "pages" ? "/design-daily/" : "/",
  build: {
    outDir: "dist/client",
    rollupOptions: {
      input: { main: "index.html", prototype: "grid-prototype.html" },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), securityBuildPlugin()],
}));

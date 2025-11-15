import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// Helper to resolve absolute paths with logging
const resolvePath = (p: string) => {
  const r = path.resolve(__dirname, p);
  console.log("[VITE FS ALLOW] ", r);
  return r;
};

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      // MUST be absolute paths (fixes Vite 403 error)
      allow: [
        resolvePath("."), // project root (index.html is here)
        resolvePath("client"),
        resolvePath("shared"),
        resolvePath("node_modules/vite/dist/client"),
      ],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },

  build: {
    outDir: "dist/spa",
  },

  plugins: [react(), expressPlugin()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
}));

// Express middleware plugin for development
function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    configureServer(server) {
      const app = createServer(); // your Express server
      server.middlewares.use(app);
    },
  };
}

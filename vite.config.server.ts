import { defineConfig } from "vite";
import path from "path";

// Server build configuration
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/node-build.ts"),
      name: "server",
      fileName: "production",
      formats: ["es"],
    },
    outDir: "dist/server",
    target: "node22",
    ssr: true,
    rollupOptions: {
      external: [
        // Node.js built-ins
        "fs",
        "path",
        "url",
        "http",
        "https",
        "os",
        "crypto",
        "stream",
        "util",
        "events",
        "buffer",
        "querystring",
        "child_process",
        // External dependencies that should not be bundled
        "express",
        "cors",
      ],
      output: {
        format: "es",
        entryFileNames: "[name].mjs",
      },
    },
    minify: false, // Keep readable for debugging
    sourcemap: true,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },

  define: {
    "process.env.NODE_ENV": '"production"',
  },

  // <-- ADD THIS SECTION FOR DEV (whitelist folders Vite can serve)
  server: {
    fs: {
      // Only allow the specific folders your dev server needs access to.
      // This prevents the "403 Restricted ... outside of Vite serving allow list" error.
      allow: [
        // project root (if you have index.html at root)
        path.resolve(__dirname),
        // client and shared packages/dirs
        path.resolve(__dirname, "client"),
        path.resolve(__dirname, "shared"),
        // permit vite client helper if necessary (rarely needed but safe)
        path.resolve(__dirname, "node_modules", "vite", "dist", "client")
      ]
    }
  }
});

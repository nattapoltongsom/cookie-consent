import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "ConsentSDK",
      formats: ["es", "umd"],
      fileName: (format) =>
        format === "es" ? "consent-sdk.js" : "consent-sdk.umd.js"
    },
    rollupOptions: {
      output: {
        exports: "named"
      }
    }
  },
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "https://site.example/"
      }
    },
    globals: true,
    setupFiles: ["test/setup.ts"]
  }
});

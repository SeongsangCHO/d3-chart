import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "D3ReactScatter",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format}.js`,
    },
  },
});

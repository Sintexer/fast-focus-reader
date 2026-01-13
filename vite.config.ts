import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  base: process.env.NODE_ENV === 'production' ? '/fast-focus-reader/' : '/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  }
})

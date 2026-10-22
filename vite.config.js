import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'assets',
  server: { host: '127.0.0.1', port: 4317, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true }
});

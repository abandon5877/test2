import { defineConfig } from 'vite';

export default defineConfig({
  base: '/test2/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  test: {
    globals: true,
    environment: 'node'
  }
});

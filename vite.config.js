import { defineConfig } from 'vite'

export default defineConfig({
  base: '/text-perlin/',
  build: {
    outDir: 'dist',
    target: 'esnext'
  }
})

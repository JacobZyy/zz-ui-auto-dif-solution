import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, './src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    minify: false,
    rollupOptions: {
      external: [
        /^@modelcontextprotocol\/sdk/,
        'uuid',
        'node:http',
        'node:path',
        'node:process',
      ],
      output: {
        banner: '#!/usr/bin/env node',
      },
    },
    emptyOutDir: true,
    outDir: 'dist',
    target: 'node18',
  },
})

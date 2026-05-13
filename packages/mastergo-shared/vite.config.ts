import type { Plugin } from 'vite'
import { resolve } from 'node:path'
import process from 'node:process'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json'

const __DEV__ = process.env.NODE_ENV === 'development'

export default defineConfig({
  define: {
    __DEV__,
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['**/*.test.*', '**/*.spec.*'],
    }) as Plugin,
  ],
  resolve: {
    alias: {
      // 开发模式下直接引用 core 源码,避免构建中间状态问题
      ...(__DEV__ && {
        '@ui-differ/core': resolve(__dirname, '../ui-differ-core/src/index.ts'),
        '@ui-differ/connection-tools': resolve(__dirname, '../connection-tools/src/index.ts'),
      }),
    },
  },
  build: {
    lib: {
      entry: {
        lib: resolve(__dirname, './src/lib/index.ts'),
        ui: resolve(__dirname, './src/ui/index.ts'),
      },
      name: pkg.name,
      formats: ['es'],
    },
    minify: false,
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', '@ui-differ/connection-tools', '@ui-differ/core', 'antd', 'ahooks'],
      output: {
        entryFileNames: '[name].mjs',
        chunkFileNames: 'chunks/[name]-[hash].mjs',
        assetFileNames: 'assets/[name][extname]',
      },
    },
    sourcemap: __DEV__,
    emptyOutDir: true,
    outDir: 'dist',
    target: 'esnext',
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  esbuild: {
    target: 'esnext',
  },
})

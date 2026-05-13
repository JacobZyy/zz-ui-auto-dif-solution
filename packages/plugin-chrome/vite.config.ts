import type { Options } from 'vite-plugin-zip-pack'
import path from 'node:path'
import process from 'node:process'
import { crx } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import zip from 'vite-plugin-zip-pack'
import { version } from '../../package.json'
import manifest from './manifest.config.js'

const __DEV__ = process.env.NODE_ENV === 'development'

const targetOutDir = path.resolve(__dirname, __DEV__ ? '../../development/plugin-chrome-dev' : '../../dist/plugin-chrome')

const zipPluginOptions: Options = {
  inDir: path.resolve(__dirname, '../../dist/plugin-chrome'),
  outDir: path.resolve(__dirname, '../../dist'),
  outFileName: `plugin-chrome-${version}.zip`,
}

export default defineConfig({
  define: {
    __DEV__,
  },
  resolve: {
    alias: {
      '@': `${path.resolve(__dirname, 'src')}`,
      // 开发模式下直接引用 core 源码,避免构建中间状态问题
      ...(process.env.NODE_ENV === 'development' && {
        '@ui-differ/core': path.resolve(__dirname, '../ui-differ-core/src/index.ts'),
        '@ui-differ/connection-tools': path.resolve(__dirname, '../connection-tools/src/index.ts'),
      }),
    },
  },
  build: {
    outDir: targetOutDir,
    emptyOutDir: false,
    minify: false,
  },
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest }),
    zip(zipPluginOptions),
  ],
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  server: {
    cors: {
      origin: [
        /chrome-extension:\/\//,
      ],
    },
  },
})

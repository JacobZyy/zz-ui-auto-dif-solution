import type { UserConfig } from 'vite'
import process from 'node:process'
import { defineConfig, mergeConfig } from 'vite'
import commonViteConfig from './build/vite.common.config'
import libViteConfig from './build/vite.lib.config'
import uiViteConfig from './build/vite.ui.config'

const target = process.env.TARGET

const viteConfigMap: Record<string, UserConfig> = {
  ui: mergeConfig(commonViteConfig, uiViteConfig),
  main: mergeConfig(commonViteConfig, libViteConfig),
  default: commonViteConfig,
}

export default defineConfig(() => {
  if (!target) {
    return viteConfigMap.default
  }
  const config = viteConfigMap[target]
  return config
})

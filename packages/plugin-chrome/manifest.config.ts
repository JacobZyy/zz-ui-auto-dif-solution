import process from 'node:process'
import { defineManifest } from '@crxjs/vite-plugin'
import pkg from '../../package.json'

const pluginTitle = process.env.NODE_ENV === 'development' ? '转转ui自动化走查工具-dev' : '转转ui自动化走查工具'

export default defineManifest({
  manifest_version: 3,
  name: pluginTitle,
  version: pkg.version,
  icons: {
    48: 'public/logo.png',
  },
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    // 隐藏界面，变成开关
    // default_popup: 'src/popup/index.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [{
    js: ['src/content/main.tsx'],
    matches: ['https://*.zhuanzhuan.com/*', 'http://localhost:*/*', 'http://127.0.0.1:*/*', 'https://fe.zhuanspirit.com/*'],
  }],
  devtools_page: 'src/devtools/index.html',
  permissions: [
    'activeTab',
    'scripting',
    'storage',
    'webRequest',
    'debugger',
    'tabs',
    'windows',
  ],
  host_permissions: [
    'https://*/*',
    'http://*/*',
  ],
})

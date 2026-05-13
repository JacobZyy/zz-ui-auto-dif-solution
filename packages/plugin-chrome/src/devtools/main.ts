// DevTools 主入口脚本
// 此脚本在 DevTools 打开时执行，用于创建自定义面板

import { devToolsManager } from './dev-tools-manager'
// 初始化 DevTools 管理器
// 单例模式自动完成连接和消息监听的设置
devToolsManager.initialize()

// chrome.devtools.panels.create(
//   'ui differ tools', // 面板标题
//   'icon.png', // 图标路径（可选）
//   'src/devtools/panel.html', // 面板内容页面
//   (panel) => {
//     // 可以在这里监听面板的显示 / 隐藏事件
//     panel.onShown.addListener((window) => {
//       console.log('Panel shown', window)
//     })

//     panel.onHidden.addListener(() => {
//       console.log('Panel hidden')
//     })
//   },
// )

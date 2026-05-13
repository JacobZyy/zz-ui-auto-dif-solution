// 项目包配置
export const PACKAGES_CONFIG = {
  // 核心包：可以并行构建，不依赖彼此
  corePackages: [
    '@ui-differ/core',
    '@ui-differ/connection-tools',
    '@ui-differ/mastergo-shared',
  ],
  // 业务包：依赖核心包，可以并行构建
  businessPackages: [
    '@ui-differ/plugin-chrome',
    '@ui-differ/plugin-master-go',
    '@ui-differ/ui-detect-plugin',
    '@ui-differ/plugin-mcp-bridge',
  ],
}

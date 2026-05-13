import process from 'node:process'
import { execa } from 'execa'
import { PACKAGES_CONFIG } from './packages-config'

// 设置生产环境变量
process.env.NODE_ENV = 'production'

async function buildPackage(packageName: string) {
  console.log(`📦 Building ${packageName}...`)
  await execa('pnpm', ['--filter', packageName, 'build'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  })
  console.log(`✅ ${packageName} build completed`)
}

async function buildPackagesInParallel(packages: string[], stepName: string) {
  console.log(`\n🔄 ${stepName}...\n`)
  await Promise.all(packages.map(pkg => buildPackage(pkg)))
  console.log(`\n✅ ${stepName} completed\n`)
}

async function main() {
  try {
    console.log('🏗️  Starting UI Differ build in sequential mode...\n')

    // Step 0: 清理构建产物
    console.log('📦 Step 0: Clean prev Bundles...')
    await execa('pnpm', ['clean'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
    })
    console.log('✅ Clean completed\n')

    console.log('🚀 ~ main ~ PACKAGES_CONFIG.corePackages:', PACKAGES_CONFIG.corePackages)
    // Step 1: 并行构建核心包
    await buildPackagesInParallel(PACKAGES_CONFIG.corePackages, 'Step 1: Building Core Packages')

    // Step 2: 并行构建业务包
    await buildPackagesInParallel(PACKAGES_CONFIG.businessPackages, 'Step 2: Building Business Packages')

    console.log('🎉 All builds completed successfully!')
    process.exit(0)
  }
  catch (error) {
    console.error('\n❌ Build failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// 处理 Ctrl+C 信号
process.on('SIGINT', () => {
  console.log('\n\n🛑 Received SIGINT, terminating build process...')
  process.exit(0)
})

main()

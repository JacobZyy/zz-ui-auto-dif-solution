import process from 'node:process'
import { execa } from 'execa'
import { PACKAGES_CONFIG } from './packages-config'

// 设置开发环境变量
process.env.NODE_ENV = 'development'

async function startDevServer(packageName: string) {
  console.log(`🚀 Starting ${packageName}...`)
  const subprocess = execa('pnpm', ['--filter', packageName, 'dev'], {
    stdout: 'pipe',
    stderr: 'pipe',
    env: { ...process.env, NODE_ENV: 'development' },
  })

  subprocess.stdout?.pipe(process.stdout)
  subprocess.stderr?.pipe(process.stderr)

  // 监听进程退出
  subprocess.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`\n❌ ${packageName} exited with code ${code} and signal ${signal}`)
    }
  })

  return subprocess
}

async function main() {
  try {
    console.log('🚀 Starting UI Differ development...\n')
    console.log('📝 All projects will start simultaneously\n')

    // 获取所有需要启动的包
    const allPackages = [...PACKAGES_CONFIG.corePackages, ...PACKAGES_CONFIG.businessPackages]

    // 并行启动所有开发服务器
    const processes = await Promise.all(
      allPackages.map(pkg => startDevServer(pkg)),
    )

    console.log('\n✅ All development servers started!')
    console.log('👀 Watching for changes...\n')

    // 等待所有进程
    await Promise.all(processes)
  }
  catch (error) {
    console.error('\n❌ Development server failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// 处理 Ctrl+C 信号
process.on('SIGINT', () => {
  console.log('\n\n🛑 Received SIGINT, terminating all development processes...')
  process.exit(0)
})

main()

<!-- FE_SPEC_START -->
<!-- ！！！不要在【FE_SPEC_START、FE_SPEC_END】标签内写项目规范，否则会被zzfe自动覆盖 -->
# 转转前端开发规范 - Claude Code

本文档为 Claude Code 的主配置入口，适用于转转前端团队所有的项目。

## 技术栈概览


## Rules 索引
仅在涉及新增、编辑、检查、校验、提交等开发流程中相关的动作时，才去阅读详细的rules，类似梳理现有逻辑等不涉及编码的操作无需读取rules，对于不确定的操作优先读取rules。
详细规范见 `.claude/rules/` 目录：

- [通用编码规范](.claude/rules/common-general.md) — 代码风格、命名、注释、错误处理（始终适用）
- [TypeScript 规范](.claude/rules/language-typescript.md) — 类型安全、泛型、最佳实践（`*.ts` / `*.tsx`）
- [前端质量规范](.claude/rules/fe-quality.md) — 圈复杂度、文件行数、注释密度、代码复用（所有 JS/TS/Vue 文件）
- [Git 提交规范](.claude/rules/git-commit.md) — Commit message、Changelog 管理（始终适用）
- [工程化规范](.claude/rules/engineering.md) — 构建工具、pnpm、代码质量工具链（始终适用）



## 其他补充文档
请根据实际的命令内容按需加载相应的文档(如果文档存在)
- [历史需求文档](./openspec/) - OpenSpec 文档目录。`specs/` 存放各模块的规格文档，是项目所有知识的来源；其余目录是过程性文档，不作为知识来源
- [Superpowers 文档](./docs/superpowers/) - Superpowers 默认文档目录，内容主要为过程性文档，不作为知识来源
- [术语表](./docs/GLOSSARY.md) - 开发术语、常见业务术语等，术语表中存在的词汇作为第一释义


## 包管理器

**统一使用 pnpm**，私有源地址：`https://rcnpm.zhuanspirit.com`

```bash
# 配置私有源（首次使用）
pnpm config set registry https://rcnpm.zhuanspirit.com
```

### ZZ-CLI 常用命令

项目通过 `zz.config.ts` 统一配置，所有命令通过 ZZ-CLI 脚手架执行：

| 命令 | 说明 | 选项 |
|------|------|------|
| `zz dev` | 启动开发服务 | `-d, --demo` 运行 demo 模式 |
| `zz build` | 生产环境构建 | 支持 Vite/Webpack/Rspack/Umi4/Father |
| `zz lint` | ESLint + Stylelint 检查 | `--staged` 仅检测暂存文件<br>`--fix` 自动修复 |
| `zz cz` | 规范化 git 提交 | 自动执行 `git add .` + `git cz -a` |
| `zz commitlint` | 校验 commit message 格式 | - |
| `zz pub` | 发布版本（仅 module 项目） | `--beta` 发布测试版<br>`--unpub` 卸载版本 |
| `zz doc` | 生成文档 | `--dev` 开发模式<br>`--upload` 上传文档 |
| `zz test` | 运行单元测试 | 仅支持 module 类型项目 |
| `zz lego` | 生成埋点 pageid | - |

### 代码质量标准层

所有项目必须集成：**prettier**、**eslint**、**stylelint**、**commitlint**

## 依赖版本规则

**不要假设或硬编码任何库的版本号。**

开始任何编码任务前，必须先读取当前项目根目录的 `package.json`，以其中 `dependencies` 和 `devDependencies` 中声明的版本为准：

- API 用法、配置写法必须与 `package.json` 中的实际版本匹配
- 引入新依赖时，使用 `pnpm add <package>` 安装，不手动填写版本号
- 若某个包在 `package.json` 中不存在，先询问用户是否需要安装，不擅自引入

```bash
# 查看当前项目依赖版本
cat package.json
```

## 组件库使用




## 核心原则

1. **复用优先**：写代码前先搜索项目中是否已有类似实现
2. **组件库优先**：优先使用项目对应的组件库
3. **简单直接**：遵循 KISS 原则，避免过度设计
4. **类型安全**：TypeScript 严格模式，禁止使用 `any`
5. **质量红线**：单文件 < 1000 行，圈复杂度 < 15，注释密度 > 10%
<!-- FE_SPEC_END -->

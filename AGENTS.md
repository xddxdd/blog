# 项目结构分析

## 项目概述

这是一个基于 **Astro** 框架的博客项目，使用 TypeScript 开发，支持多语言（中文/英文）和多种输出格式（HTML、Gemini、Gopher）。

## 目录结构

```
blog/
├── .github/              # GitHub 配置（CI/CD workflows）
├── .vscode/              # VS Code 配置
├── _scripts/             # 构建辅助脚本
│   ├── thumbs.sh         # 生成图片缩略图
│   └── webp.sh           # 转换图片为 WebP 格式
├── public/               # 静态资源目录
│   ├── usr/uploads/      # 上传的图片资源
│   └── ...
├── src/                  # 源代码目录
│   ├── assets/           # 前端资源（JS、SCSS、图片）
│   ├── components/       # Astro 组件
│   ├── content/          # 内容文件（Markdown/MDX）
│   ├── lib/              # 工具库
│   │   ├── astro-plugins/  # Astro 插件
│   │   ├── gopher/         # Gopher/Gemini 协议支持
│   │   └── language/       # 多语言支持
│   └── pages/            # 页面路由
├── astro.config.ts       # Astro 配置文件
├── eslint.config.ts      # ESLint 配置
├── flake.nix             # Nix flake 配置
├── package.json          # 项目依赖和脚本
├── postcss.config.ts     # PostCSS 配置
└── tsconfig.json         # TypeScript 配置
```

## npm scripts 命令详解

### 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Astro 开发服务器，支持热重载 |
| `npm run start` | 同 `dev`，启动开发服务器 |
| `npm run preview` | 预览已构建的站点（需先执行 build） |

### 代码检查命令

| 命令 | 说明 |
|------|------|
| `npm run check` | 完整代码检查：Astro 类型检查 + ESLint + Prettier |
| `npm run check-prettier` | 仅运行 Prettier 检查，验证代码格式 |

### 构建命令

| 命令 | 说明 |
|------|------|
| `npm run build` | **完整生产构建**：依次执行缩略图生成 → Astro 构建 → WebP 转换 |
| `npm run build-astro` | 标准 Astro 构建：清理缓存 → 代码检查 → Astro build |
| `npm run build-fast` | **快速构建**：跳过图片处理，设置 `FAST_BUILD=1` 环境变量 |
| `npm run build-thumbs` | 执行 `_scripts/thumbs.sh` 生成图片缩略图 |
| `npm run build-webp` | 执行 `_scripts/webp.sh` 转换图片为 WebP 格式 |

### 代码格式化命令

| 命令 | 说明 |
|------|------|
| `npm run format` | 自动修复代码格式：ESLint --fix + Prettier --write |
| `npm run format-prettier` | 仅运行 Prettier 格式化 |

### 工具命令

| 命令 | 说明 |
|------|------|
| `npm run clean` | 清理构建缓存（`.astro` 和 `node_modules/.astro` 目录） |
| `npm run serve` | 使用 `http-server` 在 `dist` 目录启动静态文件服务器，禁用缓存 |
| `npm run astro` | 直接调用 Astro CLI，可传递额外参数 |

## 命令区别对比

### `build` vs `build-astro` vs `build-fast`

| 特性 | build | build-astro | build-fast |
|------|-------|-------------|------------|
| 清理缓存 | ✅ (通过 build-astro) | ✅ | ✅ |
| 代码检查 | ✅ (通过 build-astro) | ✅ | ✅ |
| 缩略图生成 | ✅ | ❌ | ❌ |
| WebP 转换 | ✅ | ❌ | ❌ |
| FAST_BUILD 模式 | ❌ | ❌ | ✅ |
| 适用场景 | 生产部署 | 仅构建站点 | 快速迭代测试 |

### `dev` vs `preview` vs `serve`

| 命令 | 用途 | 数据来源 |
|------|------|----------|
| `dev` | 开发调试 | 实时编译源文件 |
| `preview` | 预览构建结果 | `dist/` 目录（Astro 内置服务器） |
| `serve` | 静态文件服务 | `dist/` 目录（http-server） |

### `check` vs `format`

| 命令 | 行为 | 输出 |
|------|------|------|
| `check` | 仅检查，不修改文件 | 报告错误，构建失败时退出码非零 |
| `format` | 自动修复格式问题 | 直接修改文件 |

## 开发工作流建议

1. **日常开发**：`npm run dev`
2. **提交前检查**：`npm run check` 或 `npm run format`
3. **本地预览构建**：`npm run build-fast`
4. **生产部署**：`npm run build`

## 技术栈

- **框架**：Astro 5.x
- **前端**：React 19、Bootstrap 5
- **样式**：SCSS、PostCSS
- **内容**：MDX、Remark/Rehype 插件
- **代码规范**：ESLint、Prettier
- **构建工具**：TypeScript、esbuild
- **包管理**：npm
- **开发环境**：Nix flake（可选）

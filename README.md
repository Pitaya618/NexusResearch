# NexusResearch

AI 科研助手 — 智能学术研究管理平台

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite)](https://vitejs.dev/)

## ✨ 功能特性

- 📚 **文献管理** — 高效组织和管理学术文献资料
- 📖 **PDF 阅读与标注** — 内置 PDF 阅读器，支持高亮、笔记等标注功能
- ✍️ **AI 辅助写作** — 智能论文写作辅助与编辑建议
- 📝 **LaTeX 编辑器** — 专业的学术论文排版编辑
- 🎨 **现代化 UI** — 基于 oklch 色彩空间的精美界面设计
- 🌐 **中文界面** — 完整的中文本地化支持

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| **前端框架** | React 18 + TypeScript |
| **构建工具** | Vite 8 |
| **路由** | React Router v6 |
| **状态管理** | Zustand |
| **虚拟列表** | @tanstack/react-virtual |
| **图表** | ECharts |
| **代码规范** | ESLint + Prettier |
| **架构模式** | Feature-Sliced Design (FSD) |

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/your-username/NexusResearch.git
cd NexusResearch

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173 即可查看应用。

### 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 生产环境构建（含 TypeScript 类型检查） |
| `npm run lint` | 运行 ESLint 代码检查 |
| `npm run preview` | 预览生产构建结果 |

## 📁 项目结构

项目采用 **Feature-Sliced Design (FSD)** 架构，严格遵循层级依赖规则：

```
src/
├── app/            # 应用入口、全局配置、样式
│   ├── index.tsx   # 入口文件
│   ├── App.tsx     # 根组件
│   ├── routes/     # 路由配置
│   └── styles/     # 全局样式与设计令牌
│
├── pages/          # 页面组件（按路由组织）
│   ├── landing/    # 着陆页
│   ├── welcome/    # 欢迎页
│   ├── literature-manager/  # 文献管理
│   ├── literature-reader/   # 文献阅读
│   ├── essay/       # 论文写作
│   ├── paper-editor/# LaTeX 编辑器
│   ├── settings/    # 设置页
│   └── skills/      # 技能页
│
├── widgets/        # 复合 UI 组件
│   ├── app-layout/           # 应用布局
│   ├── navigation-sidebar/   # 导航侧边栏
│   ├── tab-bar/              # 标签栏
│   ├── status-bar/           # 状态栏
│   └── resizable-layout/     # 可调整大小布局
│
├── features/       # 业务功能（当前为空）
│
├── entities/       # 领域实体与数据模型
│   ├── literature/ # 文献
│   ├── essay/      # 论文
│   ├── paper/      # LaTeX 文档
│   ├── annotation/ # 标注
│   ├── provider/   # AI 服务商
│   ├── skill/      # 技能
│   └── tab/        # 标签页
│
└── shared/         # 共享资源
    ├── constants/  # 常量定义
    ├── hooks/      # 自定义 Hooks
    ├── lib/        # 工具函数
    ├── types/      # TypeScript 类型
    └── ui/         # 通用 UI 组件
```

### 层级依赖规则

```
app → pages → widgets → features → entities → shared
```

上层可以导入下层模块，反之不行。

## 🎨 设计系统

项目使用 oklch 色彩空间构建现代化视觉系统，所有设计令牌和组件样式定义在 `src/app/styles/global.css`。

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

---

<p align="center">
  使用 ❤️ 和 React 构建
</p>

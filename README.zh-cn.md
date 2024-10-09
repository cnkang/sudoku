
# sudoku-project (v1.0.0)

## 项目简介

本项目是一个使用 Next.js 和 React 构建的数独游戏前端应用程序。它提供了一个交互式的数独网格，用户可以在其中解答数独谜题，输入并跟踪解题进度。

## 特性
- 使用 React 实现的交互式数独网格。
- 用户可以输入数字来解答数独谜题。
- 动态渲染数独网格，支持初始谜题值和用户输入。
- 使用 TypeScript 提供更强的类型安全性和可维护性。
- 使用 Vite 进行快速的开发和构建。

## 安装
要安装依赖，请运行以下命令：
```
yarn install
```

## 使用
启动开发服务器，请使用：
```
next dev
```

构建项目：
```
next build && tsc
```

## 测试
运行测试，请使用：
```
vitest --run
```

## 项目结构
- **src/app/**: 包含应用程序的主要设置和路由。
- **src/components/SudokuGrid.tsx**: 实现数独网格及用户输入支持的核心组件。
- **src/public/**: 静态资源，如图片或图标。
- **next.config.mjs**: Next.js 的配置文件。
- **tsconfig.json**: TypeScript 配置文件。
- **vite.config.ts**: Vite 的配置文件。

## 依赖
项目依赖以下主要库：
browserslist, core-js, fast-sudoku-solver, next, react, react-dom

开发依赖包括：
@eslint/config-array, @eslint/object-schema, @testing-library/dom, @testing-library/react, @types/core-js, @types/node, @types/react, @types/react-dom, @types/regenerator-runtime, @vitejs/plugin-react, dotenv, dotenv-cli, esbuild, eslint, eslint-config-next, happy-dom, typescript, vite, vitest

## 许可
本项目基于 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

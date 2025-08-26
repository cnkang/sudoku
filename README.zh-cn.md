# 数独挑战 (v2.0.0)

## 项目简介

基于 Next.js 15 和 React 19 构建的现代化全功能数独游戏。具备智能谜题生成器、完整游戏控制、响应式设计和全面测试覆盖。

## 功能特性

### 核心游戏玩法
- **交互式数独网格**：响应式 9×9 网格，直观的输入处理
- **10 个难度等级**：从简单 (1-2) 到专家 (9-10)，智能谜题生成
- **实时计时器**：追踪解题时间，支持暂停/继续功能
- **解答验证**：谜题完成时的即时反馈

### 游戏控制
- **提示系统**：智能提示，使用次数追踪和策略建议
- **撤销/重做**：完整的移动历史记录，无限撤销功能
- **重置游戏**：生成新谜题，带有冷却保护
- **暂停/继续**：暂停计时器并隐藏网格以便休息

### 技术特性
- **服务端谜题生成**：先进的 DLX 算法生成唯一可解谜题
- **智能缓存**：API 响应缓存，支持强制刷新选项
- **移动优先设计**：完全响应式，触摸优化
- **全面测试**：单元测试、集成测试和响应式测试
- **类型安全**：完整的 TypeScript 实现

## 安装

```bash
yarn install
```

## 开发

```bash
# 启动开发服务器
yarn dev

# 生产构建
yarn build

# 启动生产服务器
yarn start
```

## 测试

```bash
# 运行所有测试
yarn test

# 运行特定测试套件
yarn test:ui          # 组件测试
yarn test:hooks       # Hook 测试
yarn test:api         # API 测试
yarn test:responsive  # 移动端/响应式测试
yarn test:coverage    # 覆盖率报告
```

## 代码质量

```bash
# 检查代码质量
yarn quality

# 修复代码规范和格式
yarn quality:fix
```

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/solveSudoku/   # 谜题生成 API
│   ├── globals.css        # 全局样式
│   └── page.tsx           # 主游戏页面
├── components/            # React 组件
│   ├── SudokuGrid.tsx     # 交互式游戏网格
│   ├── GameControls.tsx   # 游戏控制按钮
│   ├── Timer.tsx          # 游戏计时器
│   └── DifficultySelector.tsx
├── hooks/                 # 自定义 React Hooks
│   └── useGameState.ts    # 游戏状态管理
├── utils/                 # 工具函数
│   ├── hints.ts           # 提示生成逻辑
│   ├── apiCache.ts        # API 缓存
│   └── storage.ts         # 本地存储
└── types/                 # TypeScript 类型定义
```

## API 接口

- `POST /api/solveSudoku?difficulty=1-10` - 生成新谜题
- `POST /api/solveSudoku?difficulty=5&force=true` - 强制生成新谜题

## 依赖项

### 运行时依赖
- **next** (^15.5.0) - React 框架
- **react** (^19.1.1) - UI 库
- **fast-sudoku-solver** (^1.1.19) - 谜题生成
- **winston** (^3.17.0) - 日志记录
- **lodash** (^4.17.21) - 工具库

### 开发依赖
- **typescript** (^5.9.2) - 类型安全
- **vitest** (^3.2.4) - 测试框架
- **eslint** (^9.34.0) - 代码检查
- **prettier** (^3.4.2) - 代码格式化
- **husky** (^9.1.7) - Git 钩子

## 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

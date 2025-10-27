# 数独挑战 (v2.0.0)

## 项目简介

基于 Next.js 16 和 React 19 构建的现代化全功能数独游戏。具备智能谜题生成器、完整游戏控制、响应式设计和全面测试覆盖，整体测试覆盖率达 92.4%。

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
- **全面测试**：87.5% 测试覆盖率，包含单元测试、集成测试和响应式测试
- **类型安全**：完整的 TypeScript 实现

## 安装

```bash
pnpm install
```

## 开发

```bash
# 启动开发服务器
pnpm dev

# 生产构建
pnpm build

# 启动生产服务器
pnpm start
```

## 测试

**测试覆盖率：92.4%**（函数：94.3%，分支：94.1%，行数：92.4%）

```bash
# 运行所有测试
pnpm test

# 运行覆盖率报告
pnpm test:coverage

# 运行端到端测试
pnpm test:e2e

# 测试分类
# - 组件测试（40+ 个测试）
# - Hook 测试（全面的状态管理测试）
# - API 测试（31+ 个测试，包含缓存机制）
# - 响应式测试（20+ 个测试）
# - 工具函数测试（全面的验证和错误处理）
# - E2E 测试（Playwright 集成）
```

## 代码质量

```bash
# 检查代码质量
pnpm quality

# 修复代码规范和格式
pnpm quality:fix
```

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/solveSudoku/   # 谜题生成 API
│   ├── __tests__/         # 页面组件测试
│   ├── globals.css        # 全局样式
│   ├── page.styles.ts     # 页面专用样式
│   └── page.tsx           # 主游戏页面
├── components/            # React 组件
│   ├── __tests__/         # 组件测试
│   ├── SudokuGrid.tsx     # 交互式游戏网格
│   ├── SudokuGrid.styles.ts # 网格组件样式
│   ├── GameControls.tsx   # 游戏控制按钮
│   ├── GameControls.styles.ts # 控制组件样式
│   ├── Timer.tsx          # 游戏计时器
│   └── DifficultySelector.tsx
├── hooks/                 # 自定义 React Hooks
│   ├── __tests__/         # Hook 测试
│   └── useGameState.ts    # 游戏状态管理
├── utils/                 # 工具函数
│   ├── __tests__/         # 工具函数测试
│   ├── hints.ts           # 提示生成逻辑
│   ├── apiCache.ts        # API 缓存
│   └── stats.ts           # 游戏统计
├── test-utils/            # 测试工具
└── types/                 # TypeScript 类型定义
```

## API 接口

- `POST /api/solveSudoku?difficulty=1-10` - 生成新谜题
- `POST /api/solveSudoku?difficulty=5&force=true` - 强制生成新谜题

## 依赖项

### 运行时依赖

- **next** (^16.0.0) - React 框架，支持 App Router
- **react** (^19.2.0) - UI 库，集成 React Compiler
- **fast-sudoku-solver** (^1.1.22) - 高级谜题生成算法
- **winston** (^3.18.3) - 结构化日志记录
- **lodash** (^4.17.21) - 实用工具函数

### 开发依赖

- **typescript** (^5.9.3) - 严格模式类型安全
- **vitest** (^3.2.4) - 快速测试框架
- **eslint** (^9.38.0) - 现代配置代码检查
- **prettier** (^3.6.2) - 代码格式化
- **husky** (^9.1.7) - Git 钩子质量门控
- **playwright** (^1.56.1) - 端到端测试框架

## 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

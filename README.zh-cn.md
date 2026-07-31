# 多尺寸数独挑战 (v3.0.0)

## 项目简介

基于 Next.js 16 和 React 19 构建的现代化全功能数独游戏，支持 4×4、6×6 和 9×9 网格。具备智能谜题生成、儿童友好设计与全面的可访问性。UI 遵循 Apple 设计系统（WWDC 2018「设计流畅的界面」与 WWDC 2020「UI 字体细节」），完全符合 WCAG 2.2 AAA 标准。由 1052 项测试（语句覆盖率 95.8% / 分支覆盖率 92.4%）与 70+ 条经验证的正确性属性支撑。

## 功能特性

## 综合优化亮点

本应用在四个关键领域进行了综合优化，从可用升级为令人难忘，同时保持 WCAG 2.2 AAA 可访问性以及 95.8% 语句 / 92.4% 分支覆盖率：

### 🎨 Apple 设计系统
- **流畅的界面**：通过自定义 `useSpring` Hook 实现基于物理的可中断弹簧动画（每按钮按压回弹、snap 转场），遵循 WWDC 2018。
- **字体排印**：通过 `next/font` 加载 Inter（正文）与 JetBrains Mono（网格数字），system-ui 回退与光学尺寸，遵循 WWDC 2020。
- **语义化颜色令牌**：模式感知的高对比度调色板，构建时校验 ≥ 7:1（正常文本）/ ≥ 4.5:1（大号文本）。
- **毛玻璃与层级**：玻璃表面、ambient/key 阴影令牌与 AAA 合规聚焦环。
- **减弱动效**：所有弹簧与 CSS 动画均响应 `prefers-reduced-motion`。

### ⚡ 性能优化
- **双层缓存**：React.cache() + LRU，谜题生成命中率 > 80%
- **并行化异步**：`Promise.all()` 消除请求瀑布，网格切换提速 25-40%
- **hoisted node_modules**：pnpm hoisted 布局，兼容性更广
- **React.memo 与稳定回调**：最小化 SudokuGrid 与 Timer 组件的不必要重渲染

### 🔒 安全加固
- **纵深防御**：带 nonce 的 CSP 与完整安全头（HSTS、X-Frame-Options 等）
- **输入校验**：所有 API 输入使用 Zod 模式校验，防止 XSS/注入
- **API 防护**：限流、来源校验、CSRF 令牌、请求体大小限制
- **零漏洞**：CI 中自动化 pnpm audit 配合 Dependabot 持续安全

### ✅ 代码质量与测试
- **TypeScript 7**：严格模式，无 `any` 类型，显式返回类型，可辨识联合（原生编译器）
- **70+ 属性测试**：使用 fast-check 验证设计、性能、安全与可访问性正确性属性
- **全面覆盖**：语句 95.8% / 分支 92.4% / 函数 94.0% / 行 96.5%（1052 项测试，73 个文件）
- **渐进增强**：现代特性配合旧浏览器回退

### 核心游戏玩法

- **多尺寸网格系统**：支持 4×4（入门）、6×6（进阶）和 9×9（传统）网格
- **自适应难度**：4×4（3-5 级）、6×6（5-7 级）、9×9（10 级），智能谜题生成
- **无缝切换网格**：网格尺寸间平滑过渡，状态保留
- **实时计时器**：追踪解题时间，支持暂停/继续
- **解答验证**：谜题完成时即时反馈

### 游戏控制

- **提示系统**：智能提示，使用次数追踪和策略建议
- **撤销/重做**：完整的移动历史记录，无限撤销功能
- **重置游戏**：生成新谜题，带有冷却保护
- **暂停/继续**：暂停计时器并隐藏网格以便休息
- **网格尺寸选择器**：在 4×4、6×6、9×9 之间切换
- **难度选择器**：按网格尺寸自适应的难度范围

### Apple 设计系统 (v3.0)

基于 WWDC 2018「设计流畅的界面」与 WWDC 2020「UI 字体细节」，符合 WCAG 2.2 AAA。

- **流畅字体阶梯**：Inter 用于正文/UI，JetBrains Mono 用于网格数字，通过 `next/font` 加载，`font-display: swap` 与光学尺寸
- **语义化颜色令牌**：模式感知调色板（品牌、成功、警告、错误、信息），在白色背景均 ≥ 7:1，构建时校验
- **基于物理的动画**：通过 `useSpring` Hook 实现可中断弹簧动画（按压反馈、snap 转场、Suspense 回退）
- **毛玻璃表面**：玻璃背景、立体阴影与 AAA 合规聚焦环
- **减弱动效支持**：所有弹簧与 CSS 动画均响应 `prefers-reduced-motion`
- **容器查询与非对称布局**：对角流式构图配合容器查询实现真正流畅的自适应

### 性能优化

#### 构建优化
- **摇树优化**：直接导入（无桶文件）与 ES 模块友好依赖
- **代码分割**：React.lazy() 懒加载重型组件，按路由分割
- **字体优化**：next/font 自动子集化与预加载

#### 运行时性能
- **网格切换提速 25-40%**：通过 Promise.all() 并行化异步操作
- **双层缓存**：React.cache() 用于请求内 + LRU（带 TTL）用于跨请求
- **缓存命中率**：谜题生成 > 80%，30 秒 TTL
- **React.memo 优化**：最小化 SudokuGrid 与 Timer 重渲染
- **稳定回调**：不触发重渲染的稳定回调模式
- **被动事件监听**：passive: true 实现平滑滚动与触摸
- **防抖/节流处理**：优化滚动与触摸事件处理
- **Intersection Observer**：高效可见性检测替代滚动监听

#### 服务端优化
- **请求内去重**：React.cache() 防止请求内重复工作
- **跨请求缓存**：LRU 缓存自动淘汰，内存高效
- **Edge Runtime**：API 路由针对边缘部署优化
- **请求去重**：5 秒窗口内重复 API 调用共享结果

### 安全加固

#### 安全头
- **内容安全策略**：带 nonce 的 CSP，内联脚本/样式与违规上报
- **X-Frame-Options**：DENY 防止点击劫持
- **Strict-Transport-Security**：HSTS 一年 max-age 含 includeSubDomains
- **X-Content-Type-Options**：nosniff 防止 MIME 嗅探
- **Referrer-Policy**：strict-origin-when-cross-origin 保护隐私
- **Permissions-Policy**：限制浏览器特性（摄像头、麦克风、地理位置）

#### 输入校验与净化
- **Zod 模式校验**：所有 API 输入类型安全校验
- **输入净化**：HTML 实体转义防 XSS
- **长度限制**：最大输入限制防 DoS
- **LocalStorage 校验**：结构与版本校验，损坏可恢复
- **畸形请求拒绝**：400 状态码与净化错误消息

#### API 安全
- **限流**：按端点限制，429 响应与 Retry-After 头
- **来源校验**：对照允许域名校验请求来源
- **CORS 配置**：严格允许来源、方法与头
- **请求体大小限制**：最大 1MB（默认）
- **CSRF 防护**：状态变更操作的令牌防护
- **仅 HTTPS**：所有 API 通信强制 HTTPS
- **错误净化**：客户端响应移除堆栈跟踪
- **安全事件日志**：用于监控与告警的完整日志

#### 依赖安全
- **零关键漏洞**：CI 管道中自动化 pnpm audit
- **Dependabot 集成**：自动化依赖更新与安全补丁
- **版本锁定**：package.json 精确版本确保可复现构建
- **锁定文件完整性**：CI 中校验 pnpm-lock.yaml

### 技术特性

- **服务端谜题生成**：先进 DLX 算法生成唯一可解谜题
- **智能缓存**：React.cache() 与 LRU（带 TTL）双层缓存
- **移动优先设计**：完全响应式，触摸优化与触觉反馈
- **全面测试**：1052 项测试（语句 95.8% / 分支 92.4%）覆盖单元、集成、属性与 E2E 套件
- **属性测试**：使用 fast-check 验证 70+ 正确性属性
- **类型安全**：TypeScript 7 严格模式，无 any 类型
- **渐进增强**：现代 CSS 配合 @supports 查询与回退
- **错误边界**：优雅错误处理，保留用户进度
- **重试逻辑**：失败 API 请求的指数退避
- **可访问性卓越**：WCAG 2.2 AAA 合规，键盘导航与屏幕阅读器支持

## 环境要求

- Node.js `24.18.0` LTS（见 `.nvmrc`）
- `pnpm 11.6.0+`

## 安装

```bash
corepack enable
corepack use pnpm@11.6.0
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

**测试覆盖率：语句 95.8% / 分支 92.4% / 函数 94.0%**（1052 项测试，73 个文件）

```bash
# 运行所有测试
pnpm test

# 运行覆盖率报告
pnpm test:coverage

# 运行属性测试
pnpm test:pbt

# 运行端到端测试
pnpm test:e2e
```

### 测试分类

- **组件测试**：40+ 项 UI 组件测试（React Testing Library）
- **Hook 测试**：全面状态管理测试（含 `useSpring`）
- **API 测试**：31+ 项测试，含缓存、限流与安全校验
- **属性测试**：使用 fast-check 验证 70+ 正确性属性
  - 设计系统属性（对比度、字体、动画、减弱动效）
  - 性能属性（包大小、懒加载、缓存、事件监听）
  - 安全属性（CSP、输入校验、限流、CSRF 防护）
  - 可访问性属性（键盘导航、ARIA 标签、聚焦指示器）
  - 错误处理属性（重试逻辑、错误边界、进度保留）
- **响应式测试**：20+ 项移动优先设计与触摸优化测试
- **工具函数测试**：全面校验与错误处理覆盖
- **E2E 测试**：Playwright 多网格尺寸场景集成
- **可访问性测试**：axe-core 校验 WCAG AAA 合规

## 性能指标

### 核心 Web 指标（生产）
- **LCP（最大内容绘制）**：移动 3G < 2.5s
- **INP（交互到下一次绘制）**：所有交互 < 100ms
- **CLS（累积布局偏移）**：页面加载与字体加载 < 0.1

### 优化结果
- **网格切换延迟**：通过异步并行化提升 25-40%
- **缓存命中率**：双层缓存谜题生成 > 80%
- **动画性能**：GPU 加速弹簧/CSS 动画稳定 60fps
- **字体加载 CLS**：优化回退与 font-display: swap < 0.1
- **重渲染优化**：React.memo 与稳定回调最小化不必要渲染

### Lighthouse 分数（移动）
- **性能**：95+（优化包大小、缓存、懒加载）
- **可访问性**：100（WCAG 2.2 AAA，对比度 ≥ 7:1）
- **最佳实践**：100（安全头、HTTPS、现代标准）
- **SEO**：100（语义化 HTML、meta 标签、结构化数据）

### 构建指标
- **TypeScript 7 严格模式**：零 any 类型，显式返回类型
- **零关键漏洞**：CI 中自动化 pnpm audit
- **测试覆盖率**：语句 95.8% / 分支 92.4%，共 1052 项测试
- **包大小预算**：CI 管道强制 < 15% 增长

## 代码质量

```bash
# 检查代码质量
pnpm quality

# 修复规范与格式
pnpm quality:fix
```

### SonarCloud 集成

本项目配置了 **SonarCloud 自动分析**，用于持续代码质量监控。

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/solveSudoku/   # 谜题生成 API
│   ├── __tests__/         # 页面组件测试
│   ├── globals.css        # 全局样式
│   ├── page.module.css    # 页面专用样式
│   └── page.tsx           # 主游戏页面
├── components/            # React 组件
│   ├── __tests__/         # 组件测试
│   ├── ModernSudokuApp.tsx # 顶层应用外壳
│   ├── SudokuGrid.tsx     # 交互式游戏网格
│   ├── GameControls.tsx   # 游戏控制按钮
│   ├── TouchOptimizedControls.tsx # 触摸优化控制
│   ├── DifficultySelector.tsx
│   └── decorative/         # 几何装饰元素
├── hooks/                 # 自定义 React Hooks
│   ├── __tests__/         # Hook 测试
│   ├── useGameState.ts    # 游戏状态管理
│   └── useSpring.ts       # 物理弹簧动画
├── styles/                # 设计系统样式
│   ├── apple-design-system.css # Apple 设计系统令牌
│   ├── asymmetric-layout.css  # 非对称布局工具
│   └── modern-responsive.css  # 容器查询响应式工具
├── utils/                 # 工具函数
│   ├── __tests__/         # 工具函数测试
│   ├── hints.ts           # 提示生成逻辑
│   ├── apiCache.ts        # API 缓存
│   └── stats.ts           # 游戏统计
├── test-utils/            # 测试工具
└── types/                 # TypeScript 类型定义
```

## API 接口

### 谜题生成
- `POST /api/solveSudoku?difficulty=1-10&gridSize=9` - 生成 9×9 谜题
- `POST /api/solveSudoku?difficulty=1-7&gridSize=6` - 生成 6×6 谜题
- `POST /api/solveSudoku?difficulty=1-5&gridSize=4` - 生成 4×4 谜题
- `POST /api/solveSudoku?difficulty=5&force=true` - 强制生成新谜题（绕过缓存）

### 安全特性
- 限流：每端点 100 请求/分钟
- 来源校验：对照允许域名
- 请求体大小限制：最大 1MB
- 状态变更操作 CSRF 防护
- Zod 模式输入校验

## 文档

### 技术指南
- [优化指南](docs/OPTIMIZATION_GUIDE.md) - React 最佳实践与性能模式
- [安全指南](SECURITY.md) - 安全特性、头部与漏洞报告
- [CSP 测试](docs/CSP_TESTING.md) - 内容安全策略实现
- [API 安全控制](docs/API_SECURITY_CONTROLS.md) - 来源校验、CSRF、限流与请求大小限制
- [迁移指南](docs/MIGRATION_GUIDE.md) - 3.0.0 升级说明（Node 24 / pnpm 11 / TS 7 / Apple 设计系统）

### 项目文档
- [更新日志](CHANGELOG.md) - 完整版本历史
- [许可证](LICENSE) - MIT 许可证详情

## 依赖项

### 运行时依赖

- **next** (16.2.12) - React 框架，支持 App Router 与 Turbopack
- **react** (19.2.8) - UI 库，集成 React Compiler 优化
- **react-dom** (19.2.8) - React DOM 渲染器
- **fast-sudoku-solver** (3.0.3) - 高级 DLX 谜题生成算法
- **zod** (4.4.3) - TypeScript 优先的 Schema 校验
- **sharp** (0.35.3) - 图片优化
- **web-vitals** (6.0.1) - 核心 Web 指标上报

### 开发依赖

- **typescript** (7.0.2) - 严格模式类型安全（原生编译器）
- **vite** (8.1.5) - 构建工具与开发服务器
- **vitest** (4.1.10) - 快速测试框架，支持覆盖率
- **@biomejs/biome** (2.5.6) - 快速 Lint 与格式化
- **oxlint** (1.76.0) - Oxidation Linter
- **playwright** (1.62.0) - 端到端测试框架
- **fast-check** (4.9.0) - 属性测试库
- **husky** (9.1.7) - Git 钩子质量门控

## 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。
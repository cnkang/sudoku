# 数独挑战 v2.0.0 发布说明 / Sudoku Challenge v2.0.0 Release Notes

发布日期 / Release Date: 2026-02-23

---

## 🎉 重大版本更新 / Major Version Release

v2.0.0 是一个重大版本更新，带来了全面的安全加固、性能优化和代码质量提升。本版本专注于企业级安全标准、测试覆盖率提升和现代化工具链升级。

v2.0.0 is a major version release featuring comprehensive security hardening, performance optimizations, and code quality improvements. This release focuses on enterprise-grade security standards, enhanced test coverage, and modernized toolchain upgrades.

---

## 🔒 安全增强 / Security Enhancements

### API 安全加固 / API Security Hardening

- **速率限制保护** / Rate Limiting Protection
  - 实现基于 IP 的速率限制，防止 API 滥用
  - 针对谜题生成 API 的智能冷却机制
  - Implemented IP-based rate limiting to prevent API abuse
  - Intelligent cooldown mechanism for puzzle generation API

- **输入验证强化** / Enhanced Input Validation
  - 严格的种子输入验证和清理
  - Origin 头部验证，防止 CSRF 攻击
  - Zod schema 验证所有 API 输入
  - Strict seed input validation and sanitization
  - Origin header validation to prevent CSRF attacks
  - Zod schema validation for all API inputs

- **Service Worker 安全** / Service Worker Security
  - postMessage origin 验证
  - 消息类型白名单验证
  - 谜题缓存键清理，防止注入攻击
  - postMessage origin validation
  - Message type whitelist validation
  - Puzzle cache key sanitization to prevent injection attacks

### HTTP 安全头部 / HTTP Security Headers

- **新增安全响应头** / New Security Response Headers
  - `Strict-Transport-Security`: 强制 HTTPS 连接
  - `X-Content-Type-Options: nosniff`: 防止 MIME 类型嗅探
  - `X-Frame-Options: DENY`: 防止点击劫持
  - `Content-Security-Policy`: 严格的内容安全策略
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`: 限制浏览器功能访问

---

## 🚀 性能优化 / Performance Optimizations

### 构建优化 / Build Optimizations

- **生产构建优化** / Production Build Optimization
  - 自动剥离生产环境 source maps，减少包体积
  - 依赖项修剪，移除未使用的包
  - 移除遗留 polyfills 和工具包装器
  - Automatic production sourcemap stripping to reduce bundle size
  - Dependency pruning to remove unused packages
  - Removed legacy polyfills and utility wrappers

- **缓存策略改进** / Improved Caching Strategy
  - API 响应缓存支持 ETag 和 304 重新验证
  - 智能缓存失效机制
  - API response caching with ETag and 304 revalidation support
  - Intelligent cache invalidation mechanism

### 代码重构 / Code Refactoring

- **组件优化** / Component Optimization
  - 提取共享渲染器用于多尺寸数独网格
  - 用 ref 替换未使用的状态计数器
  - 集中化安全 JSON 响应助手
  - Extracted shared renderer for sized sudoku grids
  - Replaced unused state counter with ref
  - Centralized secure JSON response helpers

---

## 🧪 测试覆盖率提升 / Enhanced Test Coverage

### 测试覆盖率达到 96.34% / Test Coverage Reaches 96.34%

- **新增测试用例** / New Test Cases
  - TouchOptimizedControls 边缘情况测试
  - 最佳时间追踪的全面 stats.test.ts 覆盖
  - 改进的 hints.test.ts 单元格值处理测试
  - API 缓存 ETag 和 304 重新验证路径覆盖
  - Service Worker 消息验证测试
  - 速率限制分支覆盖
  - Enhanced TouchOptimizedControls tests with edge cases
  - Comprehensive stats.test.ts coverage for best time tracking
  - Improved hints.test.ts with better cell value handling tests
  - API cache ETag and 304 revalidation path coverage
  - Service Worker message validation tests
  - Rate limit branch coverage

- **测试质量改进** / Test Quality Improvements
  - 强制执行 90% 覆盖率阈值
  - 排除测试文件本身的覆盖率统计
  - 减少重复的测试用例
  - 在测试中重用 APICache
  - Enforced 90% coverage thresholds
  - Excluded test files from coverage statistics
  - Reduced duplicated test cases
  - Reused APICache in tests

**当前覆盖率 / Current Coverage:**
- 语句 / Statements: 96.34%
- 分支 / Branches: 92.53%
- 函数 / Functions: 94.3%
- 行数 / Lines: 96.34%

---

## 🛠️ 工具链升级 / Toolchain Upgrades

### 依赖项更新 / Dependency Updates

**核心框架 / Core Frameworks:**
- Next.js: 16.1.4 → 16.1.6
- React: 19.2.x (保持最新)
- TypeScript: 5.9.3 (严格模式)

**开发工具 / Development Tools:**
- @biomejs/biome: 2.3.14 → 2.4.4
- @commitlint/cli: 20.4.1 → 20.4.2
- @commitlint/config-conventional: 20.4.1 → 20.4.2
- @types/node: 25.0.10 → 25.3.0
- happy-dom: 20.5.0 → 20.7.0
- oxlint: 1.41.0 → 1.49.0
- esbuild: 0.25.12 → 0.27.3

**包管理器 / Package Manager:**
- pnpm: 升级到 10.30.1
- 对齐 CI 设置，避免版本冲突
- Upgraded to pnpm 10.30.1
- Aligned CI setup to avoid version conflicts

---

## 📦 功能变更 / Feature Changes

### 核心功能保持稳定 / Core Features Remain Stable

v2.0.0 主要专注于安全性、性能和代码质量，核心游戏功能保持不变：

v2.0.0 primarily focuses on security, performance, and code quality. Core game features remain unchanged:

- ✅ 交互式 9×9 数独网格 / Interactive 9×9 Sudoku grid
- ✅ 10 个难度等级 / 10 difficulty levels
- ✅ 实时计时器 / Real-time timer
- ✅ 提示系统 / Hint system
- ✅ 撤销/重做功能 / Undo/Redo functionality
- ✅ 移动优先响应式设计 / Mobile-first responsive design
- ✅ 离线支持 / Offline support

### API 行为变更 / API Behavior Changes

⚠️ **破坏性变更 / Breaking Changes:**

1. **速率限制** / Rate Limiting
   - API 现在强制执行速率限制（每 IP 每分钟最多 10 个请求）
   - 超过限制将返回 429 状态码
   - API now enforces rate limiting (max 10 requests per minute per IP)
   - Exceeding limits returns 429 status code

2. **Origin 验证** / Origin Validation
   - API 现在验证请求的 Origin 头部
   - 跨域请求需要正确配置 CORS
   - API now validates request Origin headers
   - Cross-origin requests require proper CORS configuration

3. **输入验证** / Input Validation
   - 更严格的输入验证可能拒绝之前接受的边缘情况
   - 所有输入现在通过 Zod schema 验证
   - Stricter input validation may reject previously accepted edge cases
   - All inputs now validated through Zod schemas

---

## 🐛 Bug 修复 / Bug Fixes

- 修复 pnpm lockfile 中重复的 @types/node 条目
- 修复导入排序问题
- 修复 CI 中的 pnpm 版本冲突
- Fixed duplicated @types/node entries in pnpm lockfile
- Fixed import sorting issues
- Fixed pnpm version conflict in CI

---

## 📚 文档更新 / Documentation Updates

- 同步 pnpm 10.29.2+ 要求到所有文档
- 更新 README 中的测试覆盖率统计
- 添加 SonarCloud 集成说明
- Synced pnpm 10.29.2+ requirements across all docs
- Updated test coverage statistics in README
- Added SonarCloud integration documentation

---

## 🔄 迁移指南 / Migration Guide

### 从 v1.x 升级到 v2.0.0 / Upgrading from v1.x to v2.0.0

1. **更新依赖项** / Update Dependencies
   ```bash
   corepack enable
   corepack use pnpm@10.30.1
   pnpm install
   ```

2. **检查 API 调用** / Review API Calls
   - 确保你的应用程序遵守新的速率限制
   - 验证所有 API 请求包含正确的 Origin 头部
   - 测试边缘情况输入验证
   - Ensure your application respects new rate limits
   - Verify all API requests include proper Origin headers
   - Test edge case input validation

3. **更新环境变量** / Update Environment Variables
   - 检查是否需要新的安全相关环境变量
   - Review if new security-related environment variables are needed

4. **运行测试** / Run Tests
   ```bash
   pnpm test
   pnpm test:e2e
   ```

---

## 🙏 致谢 / Acknowledgments

感谢所有贡献者和依赖项维护者使这个版本成为可能。

Thanks to all contributors and dependency maintainers who made this release possible.

特别感谢 Dependabot 自动化依赖项更新。

Special thanks to Dependabot for automated dependency updates.

---

## 📊 统计数据 / Statistics

- **提交数量 / Commits**: 50+
- **文件变更 / Files Changed**: 100+
- **测试覆盖率提升 / Test Coverage Increase**: 87.5% → 96.34%
- **安全修复 / Security Fixes**: 10+
- **性能优化 / Performance Optimizations**: 5+

---

## 🔗 相关链接 / Related Links

- [GitHub Repository](https://github.com/cnkang/sudoku)
- [Issue Tracker](https://github.com/cnkang/sudoku/issues)
- [Documentation](https://github.com/cnkang/sudoku#readme)

---

## 📝 完整变更日志 / Full Changelog

查看完整的变更历史：
See the full changelog at:

https://github.com/cnkang/sudoku/compare/v1.1.3...v2.0.0

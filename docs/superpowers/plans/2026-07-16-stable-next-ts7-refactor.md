# Stable Next.js and TypeScript 7 Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve type safety and maintainability while retaining stable Next.js 16.2.10 and the TS6/TS7 compatibility bridge.

**Architecture:** Add a zero-dependency validated puzzle boundary, extract game orchestration hooks from the main client component, and split feedback behavior from presentation. Keep all public behavior, CSS, and dependencies stable.

**Tech Stack:** Next.js 16.2.10, React 19.2.7, TypeScript 6.0.3 plus TypeScript 7.0.2 CLI, Vitest, Testing Library, Turbopack.

## Global Constraints

- Use stable dependencies only; do not adopt Next.js preview or canary releases.
- Do not change product behavior, UI copy, accessibility semantics, or PWA behavior.
- Write and observe a failing test before each production-code extraction.
- Run the complete local verification suite before any commit.
- Split commits by independently reversible intent and push only after all commits succeed.

---

### Task 1: Validate the puzzle API boundary and simplify Turbopack configuration

**Files:**
- Create: `src/utils/sudokuPuzzleSchema.ts`
- Create: `src/utils/__tests__/sudokuPuzzleSchema.test.ts`
- Modify: `src/components/ModernSudokuApp.tsx`
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: `SudokuPuzzle` from `@/types`.
- Produces: `parseSudokuPuzzle(value: unknown): SudokuPuzzle`.

- [ ] **Step 1: Write failing parser tests**

Test one valid 4x4 response and reject mismatched dimensions, unsupported sizes, non-numeric cells, and invalid difficulty.

- [ ] **Step 2: Verify RED**

Run: `pnpm test src/utils/__tests__/sudokuPuzzleSchema.test.ts`

Expected: FAIL because `@/utils/sudokuPuzzleSchema` does not exist.

- [ ] **Step 3: Implement the parser**

Define narrow record and matrix validators that require both matrices to be square, equal-sized, and one of 4, 6, or 9. Return a freshly constructed `SudokuPuzzle` without a type assertion at the network call sites or a schema-library client bundle cost.

- [ ] **Step 4: Use the parser and remove Webpack-only splitting**

Parse both `fetchWithCache` results before `SET_PUZZLE`. Delete only the `webpack` callback from `next.config.ts`; preserve `turbopack.rules` and all unrelated options.

- [ ] **Step 5: Verify GREEN**

Run: `pnpm test src/utils/__tests__/sudokuPuzzleSchema.test.ts src/components/__tests__/ModernSudokuApp.parallel.test.tsx && pnpm type-check`

Expected: parser and component tests pass; TypeScript 7 reports no errors.

### Task 2: Extract game timer and puzzle actions

**Files:**
- Create: `src/hooks/useGameTimer.ts`
- Create: `src/hooks/__tests__/useGameTimer.test.ts`
- Create: `src/hooks/usePuzzleActions.ts`
- Create: `src/hooks/__tests__/usePuzzleActions.test.ts`
- Modify: `src/components/ModernSudokuApp.tsx`

**Interfaces:**
- `useGameTimer(timerActive: boolean, isPaused: boolean, dispatch: Dispatch<GameAction>): void`
- `usePuzzleActions(options: PuzzleActionOptions): PuzzleActions`
- `PuzzleActions` exposes `fetchPuzzle`, `handleGridSizeChange`, `handleInputChange`, `checkAnswer`, `getGameHint`, `resetGame`, `pauseResumeGame`, `undoMove`, `handleAccessibilityChange`, `performanceMetrics`, and `lastFetchTime` only where rendering or effects require them.

- [ ] **Step 1: Write failing timer tests**

Use fake timers to require one `TICK` per elapsed second, no ticks while paused, catch up after a delayed interval, and cleanup on unmount.

- [ ] **Step 2: Verify timer RED**

Run: `pnpm test src/hooks/__tests__/useGameTimer.test.ts`

Expected: FAIL because `useGameTimer` does not exist.

- [ ] **Step 3: Implement and integrate `useGameTimer`**

Move the existing drift-corrected interval effect unchanged into the hook and replace the component effect with one hook call.

- [ ] **Step 4: Verify timer GREEN**

Run: `pnpm test src/hooks/__tests__/useGameTimer.test.ts src/components/__tests__/ModernSudokuApp.parallel.test.tsx`

Expected: all selected tests pass.

- [ ] **Step 5: Write failing puzzle-action tests**

Require parsed puzzle dispatch, loading reset on errors, reset throttling, grid-size no-op for the current size, cell update/cleared hint dispatch, and pause/undo dispatches.

- [ ] **Step 6: Verify puzzle-action RED**

Run: `pnpm test src/hooks/__tests__/usePuzzleActions.test.ts`

Expected: FAIL because `usePuzzleActions` does not exist.

- [ ] **Step 7: Implement and integrate `usePuzzleActions`**

Move the existing callbacks into the hook, inject existing collaborators through `PuzzleActionOptions`, and keep messages, thresholds, dispatch order, and performance tracking unchanged.

- [ ] **Step 8: Verify puzzle-action GREEN**

Run: `pnpm test src/hooks/__tests__/usePuzzleActions.test.ts src/components/__tests__/ModernSudokuApp.parallel.test.tsx && pnpm type-check`

Expected: all selected tests pass and TypeScript 7 reports no errors.

### Task 3: Split feedback behavior from presentation

**Files:**
- Create: `src/hooks/useFeedbackController.ts`
- Create: `src/hooks/__tests__/useFeedbackController.test.ts`
- Create: `src/components/FeedbackDisplay.tsx`
- Create: `src/components/__tests__/FeedbackDisplay.test.tsx`
- Modify: `src/components/VisualFeedbackSystem.tsx`

**Interfaces:**
- `useFeedbackController(options: FeedbackControllerOptions): { feedback: FeedbackState; triggers: FeedbackTriggers }`
- `FeedbackDisplay(props: FeedbackDisplayProps): React.ReactElement`
- Shared feedback types remain exported from `VisualFeedbackSystem.tsx` or a dependency-free `feedbackTypes.ts` module and are re-exported for compatibility.

- [ ] **Step 1: Write failing controller tests**

Use fake timers to require success/error/hint durations, clear behavior, reduced-motion suppression of reinforcement, and timer cleanup.

- [ ] **Step 2: Verify controller RED**

Run: `pnpm test src/hooks/__tests__/useFeedbackController.test.ts`

Expected: FAIL because `useFeedbackController` does not exist.

- [ ] **Step 3: Implement `useFeedbackController`**

Move feedback state, timeout scheduling, imperative highlighting, positive reinforcement, and trigger construction into the hook without changing durations or messages.

- [ ] **Step 4: Write failing display tests**

Require message/pattern rendering, reduced-motion particle suppression, child-mode legend rendering, and screen-reader announcements.

- [ ] **Step 5: Verify display RED**

Run: `pnpm test src/components/__tests__/FeedbackDisplay.test.tsx`

Expected: FAIL because `FeedbackDisplay` does not exist.

- [ ] **Step 6: Implement `FeedbackDisplay` and simplify the adapter**

Move presentation-only helpers and JSX to `FeedbackDisplay`; keep the contrast button and render-prop wiring in `VisualFeedbackSystem`.

- [ ] **Step 7: Verify feedback GREEN**

Run: `pnpm test src/hooks/__tests__/useFeedbackController.test.ts src/components/__tests__/FeedbackDisplay.test.tsx src/components/__tests__/VisualFeedbackSystem.test.tsx src/components/__tests__/VisualFeedbackSystem.pbt.test.tsx && pnpm type-check`

Expected: all selected tests pass and TypeScript 7 reports no errors.

### Task 4: Complete local verification and batch delivery

**Files:**
- Modify only files already listed by Tasks 1-3 plus these design/plan documents.

- [ ] **Step 1: Inspect scope and formatting**

Run: `git status --short --untracked-files=all && git diff --check && git diff --stat`

Expected: only planned files are changed; no whitespace errors.

- [ ] **Step 2: Run quality, unit, coverage, and build gates**

Run: `pnpm quality && pnpm test && pnpm test:coverage && pnpm build`

Expected: all commands exit 0 and coverage remains above repository thresholds.

- [ ] **Step 3: Run bundle and browser gates**

Run: `pnpm next experimental-analyze --output && pnpm test:e2e`

Expected: analyzer output is generated without an unexpected bundle increase and all E2E tests pass.

- [ ] **Step 4: Split Conventional Commits**

Create independently reversible commits for: puzzle boundary/build configuration, game orchestration, feedback architecture, and design documentation. Run the conventional-commit safety gate before every commit.

- [ ] **Step 5: Push the implementation branch**

Push `codex/stable-ts7-refactor` only after the worktree is clean and all local commits exist.

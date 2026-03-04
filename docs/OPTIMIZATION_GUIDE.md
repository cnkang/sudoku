# React Optimization Guide

## Quick Reference for Developers

This guide provides practical patterns for optimizing React components in the Sudoku Challenge project, based on Vercel React Best Practices.

---

## 🎯 Core Principles

1. **Eliminate Waterfalls** - Run operations in parallel
2. **Minimize Bundle Size** - Import directly, lazy load heavy components
3. **Optimize Re-renders** - Use primitive dependencies, avoid unnecessary memo
4. **Cache Strategically** - React.cache() for server, LRU for cross-request

---

## 📦 Bundle Size Optimization

### ❌ Avoid Barrel Imports

```typescript
// BAD: Pulls in entire module
import { utility1, utility2 } from '@/utils';

// GOOD: Direct imports for tree-shaking
import { utility1 } from '@/utils/utility1';
import { utility2 } from '@/utils/utility2';
```

### ✅ Use Dynamic Imports

```typescript
// BAD: All components in initial bundle
import HeavyComponent from './HeavyComponent';

// GOOD: Load on demand
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### ✅ Defer Third-Party Scripts

```typescript
// BAD: Blocks initial render
import analytics from 'analytics-lib';
analytics.init();

// GOOD: Load after hydration
useEffect(() => {
  import('analytics-lib').then(({ default: analytics }) => {
    analytics.init();
  });
}, []);
```

---

## ⚡ Async Optimization

### ❌ Avoid Sequential Awaits

```typescript
// BAD: Waterfall - 600ms total
async function fetchData() {
  const user = await fetchUser();      // 200ms
  const posts = await fetchPosts();    // 200ms
  const comments = await fetchComments(); // 200ms
  return { user, posts, comments };
}

// GOOD: Parallel - 200ms total
async function fetchData() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchComments(),
  ]);
  return { user, posts, comments };
}
```

### ✅ Start Promises Early, Await Late

```typescript
// BAD: Sequential
async function handler() {
  const data = await fetchData();
  await saveToCache(data);
  return data;
}

// GOOD: Parallel
async function handler() {
  const dataPromise = fetchData();
  const [data] = await Promise.all([
    dataPromise,
    dataPromise.then(saveToCache),
  ]);
  return data;
}
```

---

## 🔄 Re-render Optimization

### ❌ Avoid Unnecessary useMemo

```typescript
// BAD: useMemo overhead for simple reference
const config = useMemo(() => state.config, [state.config]);

// GOOD: Direct reference
const config = state.config;
```

### ✅ Use Primitive Dependencies

```typescript
// BAD: Object reference changes every render
const callback = useCallback(() => {
  doSomething(config);
}, [config]); // config is object

// GOOD: Extract primitive values
const callback = useCallback(() => {
  doSomething(config);
}, [config.id, config.size]); // primitives only
```

### ✅ Derive State During Render

```typescript
// BAD: Extra render cycle
const [data, setData] = useState([]);
const [filtered, setFiltered] = useState([]);

useEffect(() => {
  setFiltered(data.filter(item => item.active));
}, [data]);

// GOOD: Compute during render
const [data, setData] = useState([]);
const filtered = useMemo(
  () => data.filter(item => item.active),
  [data]
);
```

### ✅ Use Stable Callbacks

```typescript
// BAD: Callback recreated every render
function Component({ onSave }) {
  const handleClick = useCallback(() => {
    onSave(data);
  }, [onSave, data]); // Changes frequently
  
  return <Button onClick={handleClick} />;
}

// GOOD: Stable callback with useEvent
import { useEvent } from '@/hooks/useStableCallback';

function Component({ onSave }) {
  const handleClick = useEvent(() => {
    onSave(data); // Always uses latest data
  }); // Never changes
  
  return <Button onClick={handleClick} />;
}
```

---

## 🖥️ Server-Side Optimization

### ✅ Use React.cache() for Deduplication

```typescript
// BAD: Multiple identical fetches per request
async function getUser(id: string) {
  return await db.user.findUnique({ where: { id } });
}

// GOOD: Deduplicated per request
import { cache } from 'react';

const getUser = cache(async (id: string) => {
  return await db.user.findUnique({ where: { id } });
});
```

### ✅ Implement LRU Cache for Cross-Request

```typescript
import { ServerLRUCache } from '@/app/api/_lib/serverCache';

const userCache = new ServerLRUCache<string, User>(100, 60000);

async function getUser(id: string) {
  // Check LRU cache
  const cached = userCache.get(id);
  if (cached) return cached;
  
  // Fetch and cache
  const user = await db.user.findUnique({ where: { id } });
  userCache.set(id, user);
  return user;
}
```

### ✅ Minimize Serialization

```typescript
// BAD: Passing large objects to client
export default function Page() {
  const allData = await fetchAllData(); // 500KB
  return <ClientComponent data={allData} />;
}

// GOOD: Pass only what's needed
export default function Page() {
  const allData = await fetchAllData();
  const essentialData = {
    id: allData.id,
    name: allData.name,
    // Only essential fields
  };
  return <ClientComponent data={essentialData} />;
}
```

---

## 🎨 Rendering Optimization

### ✅ Hoist Static JSX

```typescript
// BAD: Recreated every render
function Component() {
  return (
    <div>
      <Header title="Sudoku" /> {/* New object every render */}
      <Content />
    </div>
  );
}

// GOOD: Hoisted outside
const STATIC_HEADER = <Header title="Sudoku" />;

function Component() {
  return (
    <div>
      {STATIC_HEADER}
      <Content />
    </div>
  );
}
```

### ✅ Use Ternary for Conditionals

```typescript
// BAD: Can cause hydration issues
{count && <Message count={count} />}

// GOOD: Explicit null
{count ? <Message count={count} /> : null}
```

### ✅ Use useTransition for Loading States

```typescript
// BAD: Separate loading state
const [isLoading, setIsLoading] = useState(false);

async function handleClick() {
  setIsLoading(true);
  await updateData();
  setIsLoading(false);
}

// GOOD: useTransition
const [isPending, startTransition] = useTransition();

function handleClick() {
  startTransition(async () => {
    await updateData();
  });
}
```

---

## 🎯 Performance Patterns

### Pattern 1: Optimistic Updates

```typescript
import { useOptimistic } from 'react';

function TodoList({ todos }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo) => [...state, newTodo]
  );

  async function handleAdd(todo) {
    addOptimisticTodo(todo); // Instant UI update
    await saveTodo(todo);     // Actual save
  }

  return optimisticTodos.map(todo => <Todo key={todo.id} {...todo} />);
}
```

### Pattern 2: Passive Event Listeners

```typescript
// For scroll/touch events that don't preventDefault
useEffect(() => {
  const handler = (e) => {
    // Handle scroll
  };
  
  window.addEventListener('scroll', handler, { passive: true });
  return () => window.removeEventListener('scroll', handler);
}, []);
```

### Pattern 3: Debounced Input

```typescript
import { useDebouncedCallback } from '@/hooks/useStableCallback';

function SearchInput() {
  const debouncedSearch = useDebouncedCallback(
    (query: string) => {
      performSearch(query);
    },
    300
  );

  return (
    <input
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

---

## 🧪 Testing Optimizations

### Measure Performance

```typescript
import { usePerformanceTracking } from '@/utils/performance-monitoring';

function Component() {
  const { trackRender } = usePerformanceTracking('Component');
  
  useEffect(() => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      trackRender(duration, true);
    };
  }, []);
  
  return <div>...</div>;
}
```

### Bundle Size Analysis

```bash
# Analyze bundle
pnpm build
pnpm analyze

# Check specific imports
npx source-map-explorer .next/static/**/*.js
```

---

## 📋 Checklist

Before committing code, verify:

- [ ] No barrel imports (import directly from source)
- [ ] Heavy components lazy loaded
- [ ] Async operations run in parallel
- [ ] useMemo/useCallback have primitive dependencies
- [ ] No derived state in useEffect
- [ ] Server components use React.cache()
- [ ] Event listeners are passive where appropriate
- [ ] Static JSX hoisted outside render
- [ ] Test coverage maintained at 87.5%

---

## 🔗 Resources

- [Vercel React Best Practices](https://vercel.com/docs/frameworks/react)
- [React 19 Docs](https://react.dev)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Performance](https://web.dev/performance/)

---

**Last Updated**: 2026-03-03
**Maintained By**: Development Team

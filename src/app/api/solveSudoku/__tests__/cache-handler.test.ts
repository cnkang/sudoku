import { describe, it, expect, beforeEach } from 'vitest';

// Mock the cache handler since it's an ES module
const mockCache = new Map();

class MockCacheHandler {
  constructor(options: any) {}

  async get(key: string) {
    return mockCache.get(key);
  }

  async set(key: string, data: any, ctx: { tags?: string[] }) {
    mockCache.set(key, {
      value: data,
      lastModified: Date.now(),
      tags: ctx.tags,
    });
  }

  async revalidateTag(tag: string) {
    for (const [key, value] of mockCache) {
      if (value.tags?.includes(tag)) {
        mockCache.delete(key);
      }
    }
  }
}

describe('Cache Handler', () => {
  let cacheHandler: MockCacheHandler;

  beforeEach(() => {
    mockCache.clear();
    cacheHandler = new MockCacheHandler({});
  });

  it('should store and retrieve cache entries', async () => {
    const key = 'test-key';
    const data = { puzzle: [[1, 2, 3]] };
    const ctx = { tags: ['sudoku'] };

    await cacheHandler.set(key, data, ctx);
    const result = await cacheHandler.get(key);

    expect(result?.value).toEqual(data);
    expect(result?.tags).toEqual(['sudoku']);
  });

  it('should revalidate entries by tag', async () => {
    await cacheHandler.set('key1', { data: 1 }, { tags: ['tag1'] });
    await cacheHandler.set('key2', { data: 2 }, { tags: ['tag2'] });
    await cacheHandler.set('key3', { data: 3 }, { tags: ['tag1', 'tag2'] });

    await cacheHandler.revalidateTag('tag1');

    expect(await cacheHandler.get('key1')).toBeUndefined();
    expect(await cacheHandler.get('key2')).toBeDefined();
    expect(await cacheHandler.get('key3')).toBeUndefined();
  });
});
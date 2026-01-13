interface CacheEntry {
  value: unknown;
  lastModified: number;
  tags?: string[];
}

interface CacheHandlerOptions {
  [key: string]: unknown;
}

interface CacheContext {
  tags?: string[];
}

const cache = new Map<string, CacheEntry>();

export default class CacheHandler {
  private options: CacheHandlerOptions;

  constructor(options: CacheHandlerOptions) {
    this.options = options;
  }

  async get(key: string): Promise<CacheEntry | undefined> {
    return cache.get(key);
  }

  async set(key: string, data: unknown, ctx: CacheContext): Promise<void> {
    cache.set(key, {
      value: data,
      lastModified: Date.now(),
      ...(ctx.tags && { tags: ctx.tags }),
    });
  }

  async revalidateTag(tag: string): Promise<void> {
    for (const [key, value] of cache) {
      if (value.tags?.includes(tag)) {
        cache.delete(key);
      }
    }
  }
}

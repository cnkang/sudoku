const cache = new Map();

export default class CacheHandler {
  constructor(options) {
    this.options = options;
  }

  async get(key) {
    return cache.get(key);
  }

  async set(key, data, ctx) {
    cache.set(key, {
      value: data,
      lastModified: Date.now(),
      tags: ctx.tags,
    });
  }

  async revalidateTag(tag) {
    for (const [key, value] of cache) {
      if (value.tags?.includes(tag)) {
        cache.delete(key);
      }
    }
  }
}
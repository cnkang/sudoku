import { afterEach, describe, expect, it, vi } from 'vitest';

describe('production deployment configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('does not require a project-local cache handler in serverless functions', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const { default: nextConfig } = await import('../next.config');

    expect(nextConfig.cacheHandler).toBeUndefined();
  });
});

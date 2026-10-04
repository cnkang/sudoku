import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { expect, it, vi } from 'vite-plus/test';

it('serves the fallback page script from its precache while offline', async () => {
  const script = readFileSync(resolve('public/offline.js'), 'utf8');
  const cached = new Response(script);
  const match = vi.fn().mockResolvedValue(cached);
  const fetch = vi.fn().mockRejectedValue(new TypeError('Offline'));
  const handlers = new Map<string, (event: unknown) => void>();
  runInNewContext(readFileSync(resolve('public/sw.js'), 'utf8'), {
    URL,
    Request,
    Response,
    location: { origin: 'https://sudoku.example' },
    caches: { open: vi.fn().mockResolvedValue({ match }) },
    fetch,
    addEventListener: (name: string, handler: (event: unknown) => void) => {
      handlers.set(name, handler);
    },
  });

  const request = new Request('https://sudoku.example/offline.js');
  const respondWith = vi.fn();
  handlers.get('fetch')?.({ request, respondWith });

  expect(respondWith).toHaveBeenCalledOnce();
  const response = await respondWith.mock.calls[0]?.[0];
  expect(await response.text()).toBe(script);
  expect(match).toHaveBeenCalledWith(request);
  expect(fetch).not.toHaveBeenCalled();
});

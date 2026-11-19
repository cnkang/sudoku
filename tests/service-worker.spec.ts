import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { expect, it, vi } from 'vite-plus/test';

function workerWithCache({ match, put, fetch }: { match: unknown; put: unknown; fetch: unknown }) {
  const handlers = new Map<string, (event: unknown) => void>();
  runInNewContext(readFileSync(resolve('public/sw.js'), 'utf8'), {
    URL,
    Request,
    Response,
    crypto: { getRandomValues: (buffer: Uint8Array) => buffer },
    location: { origin: 'https://sudoku.example' },
    caches: { open: async () => ({ match, put, keys: async () => [] }) },
    fetch,
    addEventListener: (name: string, handler: (event: unknown) => void) => {
      handlers.set(name, handler);
    },
  });
  return (
    request: Request | { url: string; mode: 'navigate'; method: 'GET' },
  ): Promise<Response> => {
    const respondWith = vi.fn();
    handlers.get('fetch')?.({ request, respondWith });
    expect(respondWith).toHaveBeenCalledOnce();
    return respondWith.mock.calls[0]?.[0];
  };
}

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

it('serves successful navigation, asset, and puzzle responses when cache writes fail', async () => {
  const fetch = vi.fn(async () => new Response('network response'));
  const put = vi.fn().mockRejectedValue(new DOMException('Quota exceeded', 'QuotaExceededError'));
  const fetchThroughWorker = workerWithCache({ match: vi.fn(), put, fetch });
  const origin = 'https://sudoku.example';
  for (const request of [
    { url: origin, mode: 'navigate', method: 'GET' } as const,
    new Request(`${origin}/_next/static/board.js`),
    new Request(`${origin}/api/solveSudoku?difficulty=1`, { method: 'POST' }),
  ]) {
    const response = await fetchThroughWorker(request);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('network response');
  }
  expect(put).toHaveBeenCalledTimes(3);
});

it('replaces the cached puzzle on every forced offline refresh', async () => {
  let cached: Response | undefined;
  const fetchThroughWorker = workerWithCache({
    match: vi.fn(() => cached?.clone()),
    put: vi.fn((_key, response: Response) => {
      cached = response;
    }),
    fetch: vi.fn().mockRejectedValue(new TypeError('Offline')),
  });
  const url = 'https://sudoku.example/api/solveSudoku?difficulty=1&gridSize=4';
  const requestPuzzle = async (force = '') =>
    (await fetchThroughWorker(new Request(`${url}${force}`, { method: 'POST' }))).json();
  const initial = await requestPuzzle();
  const fresh = await requestPuzzle('&force=true');
  expect(fresh.puzzle).not.toEqual(initial.puzzle);
  expect((await requestPuzzle()).puzzle).toEqual(fresh.puzzle);
  expect((await requestPuzzle('&force=true')).puzzle).not.toEqual(fresh.puzzle);
});

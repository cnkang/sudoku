// Multi-Size Sudoku PWA Service Worker
// Provides offline support, puzzle caching, and background sync

const CACHE_NAME = 'sudoku-pwa-v1';
const STATIC_CACHE_NAME = 'sudoku-static-v1';
const PUZZLE_CACHE_NAME = 'sudoku-puzzles-v1';
const RUNTIME_CACHE_NAME = 'sudoku-runtime-v1';
const ALLOWED_PUZZLE_SIZES = new Set([4, 6, 9]);
const DEFAULT_PUZZLE_SIZE = 9;
const MIN_PUZZLE_DIFFICULTY = 1;
const MAX_PUZZLE_DIFFICULTY = 5;
const SW_MESSAGE_TYPES = new Set([
  'SKIP_WAITING',
  'CACHE_PROGRESS',
  'CACHE_ACHIEVEMENT',
  'GET_CACHE_STATUS',
]);

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/_next/static/css/',
  '/_next/static/js/',
];

const swLog = (..._args) => {};
const swError = (..._args) => {};

// Install event - cache static assets
globalThis.addEventListener('install', event => {
  swLog('[SW] Installing Service Worker');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then(cache => {
        swLog('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Initialize puzzle cache
      caches.open(PUZZLE_CACHE_NAME).then(cache => {
        swLog('[SW] Initializing puzzle cache');
        return cache.put('/puzzles/init', new Response('{}'));
      }),
      // Skip waiting to activate immediately
      globalThis.skipWaiting(),
    ])
  );
});

// Activate event - clean up old caches
globalThis.addEventListener('activate', event => {
  swLog('[SW] Activating Service Worker');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        const deletions = [];
        for (const cacheName of cacheNames) {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== STATIC_CACHE_NAME &&
            cacheName !== PUZZLE_CACHE_NAME &&
            cacheName !== RUNTIME_CACHE_NAME
          ) {
            swLog('[SW] Deleting old cache:', cacheName);
            deletions.push(caches.delete(cacheName));
          }
        }
        return Promise.all(deletions);
      }),
      // Take control of all clients
      globalThis.clients.claim(),
    ])
  );
});

// Fetch event - handle requests with caching strategies
globalThis.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    if (url.pathname.startsWith('/api/solveSudoku')) {
      // Puzzle generation API - cache with network first strategy
      event.respondWith(handlePuzzleRequest(request));
    } else if (url.pathname.startsWith('/api/')) {
      // Other APIs - network first with cache fallback
      event.respondWith(handleApiRequest(request));
    } else if (url.pathname.startsWith('/_next/static/')) {
      // Static assets - cache first strategy
      event.respondWith(handleStaticRequest(request));
    } else {
      // HTML pages - network first with cache fallback
      event.respondWith(handlePageRequest(request));
    }
  }
});

// Handle puzzle generation requests
async function handlePuzzleRequest(request) {
  const url = new URL(request.url);
  const cacheRequest = createPuzzleCacheRequest(url.searchParams);

  try {
    // Try network first for fresh puzzles
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful puzzle responses
      const cache = await caches.open(PUZZLE_CACHE_NAME);
      const responseClone = networkResponse.clone();

      // Store with expiration metadata
      const responseWithMeta = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'sw-cached-at': Date.now().toString(),
          'sw-cache-key': cacheRequest.url,
        },
      });

      await cache.put(cacheRequest, responseWithMeta);
      return networkResponse;
    }
  } catch {
    swLog('[SW] Network failed for puzzle request, trying cache');
  }

  // Fallback to cache
  const cache = await caches.open(PUZZLE_CACHE_NAME);
  const cachedResponse = await cache.match(cacheRequest);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Generate offline puzzle if no cache available
  return generateOfflinePuzzle(url.searchParams);
}

function createPuzzleCacheRequest(searchParams) {
  const normalizedParams = normalizePuzzleParams(searchParams);
  const cacheUrl = new URL('/__sw/puzzle-cache', globalThis.location.origin);
  cacheUrl.searchParams.set('size', String(normalizedParams.size));
  cacheUrl.searchParams.set('difficulty', String(normalizedParams.difficulty));

  return new Request(cacheUrl.toString(), { method: 'GET' });
}

function normalizePuzzleParams(searchParams) {
  const parsedSize = Number.parseInt(searchParams.get('size') ?? '', 10);
  const parsedDifficulty = Number.parseInt(
    searchParams.get('difficulty') ?? '',
    10
  );

  const size = ALLOWED_PUZZLE_SIZES.has(parsedSize)
    ? parsedSize
    : DEFAULT_PUZZLE_SIZE;
  const difficulty = Number.isFinite(parsedDifficulty)
    ? Math.min(
        MAX_PUZZLE_DIFFICULTY,
        Math.max(MIN_PUZZLE_DIFFICULTY, parsedDifficulty)
      )
    : MIN_PUZZLE_DIFFICULTY;

  return { size, difficulty };
}

// Handle API requests
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch {
    swLog('[SW] Network failed for API request, trying cache');
  }

  // Fallback to cache
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Return offline response
  return new Response(
    JSON.stringify({ error: 'Offline - please try again when connected' }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Handle static asset requests
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch {
    swLog('[SW] Failed to fetch static asset:', request.url);
  }

  // Return empty response for missing static assets
  return new Response('', { status: 404 });
}

// Handle page requests
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful page responses
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch {
    swLog('[SW] Network failed for page request, trying cache');
  }

  // Try cache first
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Fallback to offline page
  const offlineCache = await caches.open(STATIC_CACHE_NAME);
  const offlineResponse = await offlineCache.match('/offline.html');

  if (offlineResponse) {
    return offlineResponse;
  }

  // Final fallback
  return new Response(
    `<!DOCTYPE html>
    <html>
    <head>
      <title>Offline - Sudoku Challenge</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: system-ui, sans-serif; 
          text-align: center; 
          padding: 2rem;
          background: #F0F8FF;
          color: #333;
        }
        .offline-message {
          max-width: 400px;
          margin: 0 auto;
          padding: 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .emoji { font-size: 3rem; margin-bottom: 1rem; }
        h1 { color: #0077BE; margin-bottom: 1rem; }
        p { margin-bottom: 1.5rem; line-height: 1.5; }
        button {
          background: #0077BE;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
        }
        button:hover { background: #005a9e; }
      </style>
    </head>
    <body>
      <div class="offline-message">
        <div class="emoji">🧩</div>
        <h1>You're Offline!</h1>
        <p>Don't worry! You can still play Sudoku. Some features might be limited until you're back online.</p>
        <button onclick="globalThis.location.reload()">Try Again</button>
      </div>
    </body>
    </html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    }
  );
}

// Generate simple offline puzzles
function generateOfflinePuzzle(searchParams) {
  const sizeParam = searchParams.get('size');
  const difficultyParam = searchParams.get('difficulty');
  const size = Number.parseInt(sizeParam ?? '9', 10) || 9;
  const difficulty = Number.parseInt(difficultyParam ?? '1', 10) || 1;

  // Simple offline puzzle templates
  const templates = {
    4: {
      puzzle: [
        [1, 0, 0, 4],
        [0, 4, 1, 0],
        [0, 1, 4, 0],
        [4, 0, 0, 1],
      ],
      solution: [
        [1, 2, 3, 4],
        [3, 4, 1, 2],
        [2, 1, 4, 3],
        [4, 3, 2, 1],
      ],
    },
    6: {
      puzzle: [
        [1, 0, 0, 0, 5, 6],
        [0, 5, 6, 1, 0, 0],
        [0, 0, 1, 6, 0, 5],
        [6, 0, 5, 0, 0, 0],
        [0, 0, 4, 5, 6, 0],
        [5, 6, 0, 0, 0, 4],
      ],
      solution: [
        [1, 2, 3, 4, 5, 6],
        [4, 5, 6, 1, 2, 3],
        [2, 3, 1, 6, 4, 5],
        [6, 1, 5, 3, 2, 4],
        [3, 4, 2, 5, 6, 1],
        [5, 6, 4, 2, 1, 3],
      ],
    },
    9: {
      puzzle: [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
      ],
      solution: [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9],
      ],
    },
  };

  const template = templates[size] || templates[9];

  const response = {
    puzzle: template.puzzle,
    solution: template.solution,
    difficulty: difficulty,
    size: size,
    offline: true,
    message: 'Playing offline - limited puzzle variety available',
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'sw-offline-generated': 'true',
    },
  });
}

// Background sync for progress tracking
globalThis.addEventListener('sync', event => {
  swLog('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'progress-sync') {
    event.waitUntil(syncProgress());
  } else if (event.tag === 'achievement-sync') {
    event.waitUntil(syncAchievements());
  }
});

// Sync progress data when back online
async function syncProgress() {
  try {
    // Get stored progress data
    const cache = await caches.open(PUZZLE_CACHE_NAME);
    const progressData = await cache.match('/progress/pending');

    if (progressData) {
      const data = await progressData.json();

      // Send to server
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // Clear pending data
        await cache.delete('/progress/pending');
        swLog('[SW] Progress synced successfully');
      }
    }
  } catch (error) {
    swError('[SW] Failed to sync progress:', error);
  }
}

// Sync achievement data when back online
async function syncAchievements() {
  try {
    // Get stored achievement data
    const cache = await caches.open(PUZZLE_CACHE_NAME);
    const achievementData = await cache.match('/achievements/pending');

    if (achievementData) {
      const data = await achievementData.json();

      // Send to server
      const response = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // Clear pending data
        await cache.delete('/achievements/pending');
        swLog('[SW] Achievements synced successfully');
      }
    }
  } catch (error) {
    swError('[SW] Failed to sync achievements:', error);
  }
}

// Handle push notifications for achievements
globalThis.addEventListener('push', event => {
  swLog('[SW] Push notification received');

  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body || 'Great job solving puzzles!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: data.tag || 'achievement',
      data: data.data || {},
      actions: [
        {
          action: 'play',
          title: 'Play Now',
          icon: '/icons/play-action.png',
        },
        {
          action: 'dismiss',
          title: 'Later',
          icon: '/icons/dismiss-action.png',
        },
      ],
      vibrate: [200, 100, 200],
      requireInteraction: false,
    };

    event.waitUntil(
      globalThis.registration.showNotification(
        data.title || 'Sudoku Achievement!',
        options
      )
    );
  }
});

// Handle notification clicks
globalThis.addEventListener('notificationclick', event => {
  swLog('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'play') {
    // Open the app to play
    event.waitUntil(clients.openWindow('/'));
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow('/'));
  }
});

// Message handling for communication with main thread
globalThis.addEventListener('message', event => {
  const expectedOrigin = globalThis.location.origin;

  // SECURITY: Explicit origin verification in the message handler (Sonar S2819)
  if (event.origin !== '' && event.origin !== expectedOrigin) {
    swError('[SW] Security: Rejecting message from untrusted origin', {
      eventOrigin: event.origin,
      expectedOrigin,
    });
    return;
  }

  if (
    event.origin === '' &&
    !hasTrustedMessageSourceOrigin(event, expectedOrigin)
  ) {
    return;
  }

  swLog('[SW] Message received from trusted origin:', event.data);

  // Validate message structure and type
  if (!isValidMessageData(event.data)) {
    swError('[SW] Security: Rejecting message with invalid payload/type');
    return;
  }

  switch (event.data.type) {
    case 'SKIP_WAITING':
      globalThis.skipWaiting();
      break;
    case 'CACHE_PROGRESS':
      cacheProgressData(event.data.payload);
      break;
    case 'CACHE_ACHIEVEMENT':
      cacheAchievementData(event.data.payload);
      break;
    case 'GET_CACHE_STATUS': {
      const replyPort = event.ports?.[0];
      if (!replyPort) {
        swError('[SW] Missing message port for GET_CACHE_STATUS');
        break;
      }

      event.waitUntil(
        getCacheStatus()
          .then(status => {
            replyPort.postMessage(status);
          })
          .catch(error => {
            swError('[SW] Failed to respond with cache status:', error);
          })
      );
      break;
    }
  }
});

function hasTrustedMessageSourceOrigin(event, expectedOrigin) {
  // Some browsers/contexts may omit origin on service worker messages.
  // In that case, fall back to validating the sender client URL when available.
  let sourceOrigin;
  if (
    event.source &&
    typeof event.source === 'object' &&
    'url' in event.source &&
    typeof event.source.url === 'string'
  ) {
    try {
      sourceOrigin = new URL(event.source.url, expectedOrigin).origin;
    } catch {
      swError('[SW] Security: Invalid source URL in message');
      return false;
    }
  }

  if (sourceOrigin !== expectedOrigin) {
    swError('[SW] Security: Rejecting message without trusted origin', {
      eventOrigin: '',
      sourceOrigin,
      expectedOrigin,
    });
    return false;
  }

  return true;
}

function isValidMessageData(data) {
  return (
    !!data &&
    typeof data === 'object' &&
    typeof data.type === 'string' &&
    SW_MESSAGE_TYPES.has(data.type)
  );
}

// Cache progress data for later sync
async function cacheProgressData(progressData) {
  try {
    const cache = await caches.open(PUZZLE_CACHE_NAME);
    await cache.put(
      '/progress/pending',
      new Response(JSON.stringify(progressData))
    );

    // Register for background sync
    if (
      'serviceWorker' in navigator &&
      'sync' in globalThis.ServiceWorkerRegistration.prototype
    ) {
      await globalThis.registration.sync.register('progress-sync');
    }
  } catch (error) {
    swError('[SW] Failed to cache progress data:', error);
  }
}

// Cache achievement data for later sync
async function cacheAchievementData(achievementData) {
  try {
    const cache = await caches.open(PUZZLE_CACHE_NAME);
    await cache.put(
      '/achievements/pending',
      new Response(JSON.stringify(achievementData))
    );

    // Register for background sync
    if (
      'serviceWorker' in navigator &&
      'sync' in globalThis.ServiceWorkerRegistration.prototype
    ) {
      await globalThis.registration.sync.register('achievement-sync');
    }
  } catch (error) {
    swError('[SW] Failed to cache achievement data:', error);
  }
}

// Get cache status information
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {
    caches: cacheNames,
    totalSize: 0,
    puzzleCount: 0,
    lastUpdated: Date.now(),
  };

  try {
    // Calculate cache sizes and puzzle count
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      if (cacheName === PUZZLE_CACHE_NAME) {
        status.puzzleCount = keys.length;
      }
    }
  } catch (error) {
    swError('[SW] Failed to get cache status:', error);
  }

  return status;
}

swLog('[SW] Service Worker loaded successfully');

/* global self, caches */

/**
 * DalaShift offline shell service worker.
 *
 * Privacy decision: the redesign brief mentions caching the last viewed farm,
 * but the repository privacy rule supersedes that. No farmer data, farm
 * boundary, API response or authenticated page is ever cached here. This
 * service worker stores only the public static application shell and public
 * brand assets. If that rule changes, it needs an explicit team decision.
 */

const CACHE_PREFIX = 'dalashift-shell-';
const CACHE_NAME = `${CACHE_PREFIX}v1`;

// Every path below is a public file that exists in apps/web/public.
const SHELL_ASSETS = [
  '/',
  '/favicon.svg',
  '/brand/logo.svg',
  '/brand/logo-horizontal.svg',
  '/site.webmanifest',
];

const SHELL_PATHS = new Set(SHELL_ASSETS);

/**
 * Only the public shell and Next's immutable static output may be cached.
 * The path allowlist is the main guard, so an API route or an authenticated
 * page can never reach the cache even if it is same origin.
 */
function isCacheable(request, url) {
  if (request.method !== 'GET') return false;
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith('/api/')) return false;
  if (request.headers.has('authorization')) return false;
  if (request.credentials === 'include') return false;
  return SHELL_PATHS.has(url.pathname) || url.pathname.startsWith('/_next/static/');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Navigation is always a network request. Only a failed navigation falls
  // back to the cached shell, so an offline user still sees the app frame.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/').then((shell) => shell || Response.error())),
    );
    return;
  }

  if (!isCacheable(request, url)) return;

  // Cache first for the shell and immutable Next static assets. A miss is
  // fetched, then stored only if it still passes the guard above.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && isCacheable(request, url)) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
        }
        return response;
      });
    }),
  );
});

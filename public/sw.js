/* Syscend Campus — service worker
 * Makes the app PWA-installable (so the beforeinstallprompt install card can
 * show) and provides a light offline app shell. Network-first for navigations,
 * cache-first for static build assets only. Data/API responses are never
 * cached.
 */
const CACHE = 'syscend-v1';
const NAV_CACHE_KEY = '/';

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches
            .open(CACHE)
            .then((cache) => cache.addAll(['/', '/manifest.webmanifest']))
            .catch(() => {})
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data = {};
    try {
        data = event.data.json();
    } catch {
        data = { title: 'Syscend Campus', message: event.data.text() };
    }

    const title = data.title || 'Syscend Campus';
    const options = {
        body: data.message || 'You have a new update.',
        data: { url: data.url || '/' },
        tag: data.tag || undefined,
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clients) => {
                for (const client of clients) {
                    if ('focus' in client && new URL(client.url).pathname === new URL(url, self.location.origin).pathname) {
                        return client.focus();
                    }
                }
                return self.clients.openWindow(url);
            })
    );
});

function shouldCache(url, request) {
    if (request.mode === 'navigate') return true;
    return (
        url.pathname.startsWith('/build/') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.jpeg') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.webp') ||
        url.pathname.endsWith('.ico') ||
        url.pathname.endsWith('.woff2') ||
        url.pathname.endsWith('.webmanifest')
    );
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // Navigations: network first, fall back to the cached app shell while offline.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        caches.open(CACHE).then((c) => c.put(NAV_CACHE_KEY, response.clone())).catch(() => {});
                    }
                    return response;
                })
                .catch(() => caches.match(NAV_CACHE_KEY))
        );
        return;
    }

    // Static assets: cache-first with stale-while-revalidate. Everything else
    // (API, Inertia data requests) is passed straight through untouched.
    if (!shouldCache(url, request)) {
        return;
    }

    event.respondWith(
        (async () => {
            const cached = await caches.match(request);
            const network = fetch(request)
                .then(async (response) => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
                    }
                    return response;
                })
                .catch(() => cached);
            return cached || network;
        })()
    );
});
/**
 * Nexus Nebula Service Worker
 * Implements Stale-While-Revalidate for instant boot
 */

const STATIC_CACHE = "nexus-static-v2";
const MISSION_CACHE = "nexus-missions-v2";

// App shell files to cache for offline access
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Install event - cache app shell
self.addEventListener("install", (event) => {
  console.log("[SW] Install");
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching app shell");
        return cache.addAll(APP_SHELL);
      })
      .then(() => self.skipWaiting()),
  );
});

// Activate event - cleanup old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== MISSION_CACHE)
            .map((name) => caches.delete(name)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch event - Stale-While-Revalidate strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // API routes: Stale-While-Revalidate
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(staleWhileRevalidate(request, MISSION_CACHE));
    return;
  }

  // Static assets: Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Default: Network First with fallback
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

/**
 * Stale-While-Revalidate: Return cached response immediately,
 * then fetch fresh data in background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());

        // Keep only last 5 mission traces cached
        trimMissionCache(cache);
      }
      return response;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

/**
 * Cache First: Use cache if available, otherwise fetch
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Network First: Try network, fall back to cache
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback for navigation requests
    // This returns the App Shell (index.html) which loads the JS bundle
    // The JS bundle then shows the OfflineBanner if network is disconnected
    if (request.mode === "navigate") {
      return cache.match("/");
    }

    throw error;
  }
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico)$/i.test(pathname);
}

/**
 * Trim mission cache to last 5 entries
 */
async function trimMissionCache(cache) {
  const keys = await cache.keys();
  const missionKeys = keys.filter((req) => req.url.includes("/api/traces"));

  if (missionKeys.length > 5) {
    const toDelete = missionKeys.slice(0, missionKeys.length - 5);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}

// Listen for skip waiting message from client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

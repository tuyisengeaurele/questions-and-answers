const VERSION = "v2";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const ROUTES = ["/", "/practice", "/exam", "/browse"];

self.addEventListener("install", (event) => {
  // Real page requests, so the routes are cached as HTML and work offline straight away.
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.addAll(ROUTES))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key !== PAGES && key !== ASSETS) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            event.waitUntil(caches.open(PAGES).then((c) => c.put(req, copy)));
          }
          return res;
        })
        .catch(async () => {
          const path = await caches.match(url.pathname, { ignoreSearch: true });
          return path || (await caches.match("/")) || Response.error();
        }),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/q/") || url.pathname.startsWith("/icon")) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
  }
});

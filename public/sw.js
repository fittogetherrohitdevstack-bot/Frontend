const CACHE_NAME = "fittogether-pwa-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE_ASSETS = [
  "/",
  OFFLINE_URL,
  "/site.webmanifest",
  "/apple-touch-icon.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Always bypass cache for backend API & socket traffic
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/socket.io")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (
            response &&
            response.status === 200 &&
            response.type === "basic" &&
            url.origin === self.location.origin
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL));
    })
  );
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "FitTogether",
    body: "Time to keep your squad streak burning!",
    url: "/",
    icon: "/web-app-manifest-192x192.png",
    badge: "/favicon-96x96.png",
    tag: "fittogether-alert",
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    }
  } catch (_) {
    if (event.data) {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      tag: payload.tag,
      data: { url: payload.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) {
            return client.navigate(targetUrl);
          }
          return client;
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

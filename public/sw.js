const CACHE_NAME = "fittogether-pwa-v2";
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

/**
 * Robust Push Handler supporting:
 * 1. Direct Web Push payload ({ title, body, icon, badge, image, url, data })
 * 2. Nested FCM Web Push payload ({ notification: { title, body, icon }, data: { ... } })
 * 3. Stringified data payloads
 * 4. Plain-text fallback
 * 5. Tag-based deduplication and deep linking
 */
self.addEventListener("push", (event) => {
  let title = "FitTogether";
  let body = "New squad activity waiting for you!";
  let icon = "/web-app-manifest-192x192.png";
  let badge = "/favicon-96x96.png";
  let image = undefined;
  let tag = `fittogether-${Date.now()}`;
  let targetUrl = "/";
  let extraData = {};

  try {
    if (event.data) {
      let rawJson = null;
      try {
        rawJson = event.data.json();
      } catch (_) {
        // Plain text fallback
        body = event.data.text() || body;
      }

      if (rawJson && typeof rawJson === "object") {
        // Handle FCM / nested notification wrapper
        const notif = rawJson.notification || {};
        const data = rawJson.data || {};

        title =
          rawJson.title ||
          notif.title ||
          data.title ||
          title;

        body =
          rawJson.body ||
          notif.body ||
          data.body ||
          body;

        icon =
          rawJson.icon ||
          notif.icon ||
          data.icon ||
          icon;

        badge =
          rawJson.badge ||
          notif.badge ||
          data.badge ||
          badge;

        image =
          rawJson.image ||
          notif.image ||
          notif.imageUrl ||
          data.image ||
          data.imageUrl ||
          undefined;

        tag =
          rawJson.tag ||
          notif.tag ||
          data.tag ||
          tag;

        targetUrl =
          rawJson.url ||
          notif.url ||
          data.url ||
          targetUrl;

        extraData = {
          ...data,
          ...rawJson.data,
          url: targetUrl,
          activityId: rawJson.activityId || data.activityId || "",
          type: rawJson.type || data.type || "general",
          category: rawJson.category || data.category || "general",
          senderName: rawJson.senderName || data.senderName || "",
          senderImage: rawJson.senderImage || data.senderImage || "",
        };
      }
    }
  } catch (err) {
    console.warn("[SW] Push payload parse error:", err);
  }

  const notificationOptions = {
    body,
    icon,
    badge,
    tag,
    renotify: true,
    data: {
      ...extraData,
      url: targetUrl,
    },
    timestamp: Date.now(),
  };

  if (image) {
    notificationOptions.image = image;
  }

  // Add actions if appropriate
  if (extraData.type === "moment_posted") {
    notificationOptions.actions = [
      { action: "view", title: "View Moment 🔥" },
      { action: "dismiss", title: "Dismiss" },
    ];
  } else if (extraData.type === "meal_added" || extraData.type === "diet_updated") {
    notificationOptions.actions = [
      { action: "view", title: "Open Tracker 🥗" },
      { action: "dismiss", title: "Dismiss" },
    ];
  } else if (extraData.type === "workout_completed") {
    notificationOptions.actions = [
      { action: "view", title: "See Workout 💪" },
      { action: "dismiss", title: "Dismiss" },
    ];
  }

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

/**
 * Handle Notification Click:
 * Navigates to target activity, focuses existing tab when possible, or opens new window.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const rawUrl = event.notification?.data?.url || "/";
  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Look for an existing client open on the same origin
        for (const client of clientList) {
          if (client.url && "focus" in client) {
            client.focus();
            if ("navigate" in client) {
              return client.navigate(targetUrl);
            }
            return client;
          }
        }
        // If no matching client is open, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

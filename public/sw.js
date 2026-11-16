const CACHE_NAME = "fittogether-pwa-v4";
const OFFLINE_URL = "/offline.html";
const PRECACHE_ASSETS = [
  "/",
  OFFLINE_URL,
  "/site.webmanifest",
  "/apple-touch-icon.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
];

// Force immediate activation of updated service worker
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS).catch((err) => console.warn("[SW] Precache non-blocking error:", err)))
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

// Handle postMessage skipWaiting trigger from main window
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
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
 * Universal Push Notification Handler
 * Compatible with:
 * 1. Direct Web Push ({ title, body, icon, badge, data })
 * 2. FCM nested notification ({ notification: { title, body }, data: { ... } })
 * 3. FCM data-only ({ data: { title, body, ... } })
 * 4. APNs alert structure ({ aps: { alert: { title, body } } })
 * 5. Double/triple stringified JSON
 * 6. Delimited plain text ("Title - Body" or "Title: Body")
 *
 * Guaranteed Behavior:
 * - NEVER overwrites a meaningful title with "FitTogether"
 * - Detailed diagnostic logging for inspection
 * - Tag-based deduplication and deep linking
 */
self.addEventListener("push", (event) => {
  console.log("[SW Push] Push event received at:", new Date().toISOString());

  let rawText = "";
  let payload = null;

  if (event.data) {
    try {
      rawText = event.data.text();
    } catch (e) {
      console.warn("[SW Push] Could not read raw text from event.data:", e);
    }

    try {
      payload = event.data.json();
    } catch (_) {
      // If event.data.json() throws, try JSON.parse on rawText
      if (rawText) {
        try {
          payload = JSON.parse(rawText);
        } catch (_) {
          payload = null;
        }
      }
    }
  }

  // Handle double-encoded or triple-encoded JSON strings
  let parseAttempts = 0;
  while (typeof payload === "string" && parseAttempts < 3) {
    parseAttempts++;
    try {
      payload = JSON.parse(payload);
    } catch (_) {
      break;
    }
  }

  console.log("[SW Push Raw Payload]:", rawText || "(empty)");
  console.log("[SW Push Parsed JSON]:", payload ? JSON.stringify(payload) : "(null)");

  // Extract nested objects if present
  const notifObj =
    payload && typeof payload === "object" && typeof payload.notification === "object"
      ? payload.notification
      : {};
  const dataObj =
    payload && typeof payload === "object" && typeof payload.data === "object"
      ? payload.data
      : {};
  const apsAlert =
    payload &&
    typeof payload === "object" &&
    payload.aps &&
    typeof payload.aps.alert === "object"
      ? payload.aps.alert
      : {};

  // Cascading extraction for Title: check all possible keys
  let candidateTitle = "";
  if (payload && typeof payload === "object") {
    candidateTitle =
      payload.title ||
      notifObj.title ||
      dataObj.title ||
      apsAlert.title ||
      payload.heading ||
      dataObj.heading ||
      payload.name ||
      dataObj.name ||
      payload.subject ||
      dataObj.subject ||
      "";
  }

  // Cascading extraction for Body: check all possible keys
  let candidateBody = "";
  if (payload && typeof payload === "object") {
    candidateBody =
      payload.body ||
      notifObj.body ||
      dataObj.body ||
      apsAlert.body ||
      payload.message ||
      dataObj.message ||
      payload.text ||
      dataObj.text ||
      payload.description ||
      dataObj.description ||
      "";
  }

  // If payload was plain text without JSON formatting
  if (
    !candidateTitle &&
    !candidateBody &&
    rawText &&
    !rawText.trim().startsWith("{") &&
    !rawText.trim().startsWith("[")
  ) {
    if (rawText.includes(" - ")) {
      const parts = rawText.split(" - ");
      candidateTitle = parts[0].trim();
      candidateBody = parts.slice(1).join(" - ").trim();
    } else if (rawText.includes(": ")) {
      const parts = rawText.split(": ");
      candidateTitle = parts[0].trim();
      candidateBody = parts.slice(1).join(": ").trim();
    } else {
      candidateBody = rawText.trim();
    }
  }

  // If senderName and activity/type exist, synthesize title if still missing
  const senderName =
    (payload && payload.senderName) ||
    dataObj.senderName ||
    (payload && payload.actorName) ||
    dataObj.actorName ||
    "";
  const notifType =
    (payload && payload.type) ||
    dataObj.type ||
    (payload && payload.category) ||
    dataObj.category ||
    "";

  if (!candidateTitle && senderName) {
    if (notifType === "meal_added") {
      candidateTitle = `🍎 ${senderName} added a new meal`;
    } else if (notifType === "water_logged") {
      candidateTitle = `💧 ${senderName} logged water`;
    } else if (notifType === "moment_posted") {
      candidateTitle = `📸 ${senderName} shared a moment`;
    } else if (notifType === "workout_completed") {
      candidateTitle = `💪 ${senderName} completed a workout`;
    } else if (notifType === "diet_updated") {
      candidateTitle = `🥗 ${senderName} updated today's diet`;
    } else {
      candidateTitle = `${senderName} updated FitTogether`;
    }
  }

  // Final fallback ONLY if title/body are strictly empty
  const finalTitle =
    candidateTitle && String(candidateTitle).trim().length > 0
      ? String(candidateTitle).trim()
      : "FitTogether";

  const finalBody =
    candidateBody && String(candidateBody).trim().length > 0
      ? String(candidateBody).trim()
      : "Time to keep your squad streak burning!";

  console.log("[SW Push Extracted Title]:", finalTitle);
  console.log("[SW Push Extracted Body]:", finalBody);

  const finalIcon =
    (payload && (payload.icon || notifObj.icon || dataObj.icon)) ||
    "/web-app-manifest-192x192.png";

  const finalBadge =
    (payload && (payload.badge || notifObj.badge || dataObj.badge)) ||
    "/favicon-96x96.png";

  const finalImage =
    (payload &&
      (payload.image ||
        notifObj.image ||
        notifObj.imageUrl ||
        dataObj.image ||
        dataObj.imageUrl)) ||
    undefined;

  const finalTag =
    (payload && (payload.tag || notifObj.tag || dataObj.tag)) ||
    `fittogether-${Date.now()}`;

  const targetUrl =
    (payload && (payload.url || notifObj.url || dataObj.url)) ||
    "/";

  const notificationOptions = {
    body: finalBody,
    icon: finalIcon,
    badge: finalBadge,
    tag: finalTag,
    renotify: true,
    data: {
      ...dataObj,
      ...(payload && typeof payload === "object" ? payload.data : {}),
      url: targetUrl,
      type: notifType,
      activityId: (payload && payload.activityId) || dataObj.activityId || "",
      senderName,
      timestamp: Date.now(),
    },
    timestamp: Date.now(),
  };

  if (finalImage) {
    notificationOptions.image = finalImage;
  }

  // Contextual notification actions
  if (notifType === "moment_posted") {
    notificationOptions.actions = [
      { action: "view", title: "View Moment 🔥" },
      { action: "dismiss", title: "Dismiss" },
    ];
  } else if (notifType === "meal_added" || notifType === "diet_updated") {
    notificationOptions.actions = [
      { action: "view", title: "Open Tracker 🥗" },
      { action: "dismiss", title: "Dismiss" },
    ];
  } else if (notifType === "workout_completed") {
    notificationOptions.actions = [
      { action: "view", title: "See Workout 💪" },
      { action: "dismiss", title: "Dismiss" },
    ];
  }

  console.log("[SW Push Notification Options]:", JSON.stringify(notificationOptions));
  console.log("[SW Push Calling showNotification]:", finalTitle);

  event.waitUntil(
    self.registration.showNotification(finalTitle, notificationOptions)
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

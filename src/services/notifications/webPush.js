import { pushApi } from "../../api/endpoints";

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const isWebPushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export const registerServiceWorker = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });

    if (registration.update) {
      registration.update().catch(() => {});
    }

    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("[WebPush] New service worker installed, skipping waiting...");
            newWorker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      }
    });

    return registration;
  } catch (err) {
    console.warn("[PWA] Service worker registration error:", err.message);
    return null;
  }
};

export const getWebPushSubscription = async () => {
  if (!isWebPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch (e) {
    return null;
  }
};

export const subscribeWebPush = async () => {
  if (!isWebPushSupported()) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  let publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
  if (!publicKey) {
    const res = await pushApi.getVapidKey();
    publicKey = res.data?.data?.publicKey || "";
  }
  if (!publicKey) {
    throw new Error("VAPID public key is not configured on the server yet.");
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const json = sub.toJSON();
  await pushApi.subscribe({
    subscription: json,
    userAgent: navigator.userAgent,
  });

  return sub;
};

export const unsubscribeWebPush = async () => {
  if (!isWebPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe().catch(() => {});
      await pushApi.unsubscribe({ endpoint }).catch(() => {});
    } else {
      await pushApi.unsubscribe({}).catch(() => {});
    }
  } catch (err) {
    console.warn("[WebPush] Unsubscribe error:", err.message);
  }
};

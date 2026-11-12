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

export const isPushSupported = () =>
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
    });
    return registration;
  } catch (err) {
    console.warn("[PWA] Service worker registration skipped:", err.message);
    return null;
  }
};

export const getCurrentPushSubscription = async () => {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
};

export const subscribeToWebPush = async (pushApi) => {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was denied in browser settings.");
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

export const unsubscribeFromWebPush = async (pushApi) => {
  if (!isPushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    await sub.unsubscribe().catch(() => {});
    await pushApi.unsubscribe({ endpoint }).catch(() => {});
  } else {
    await pushApi.unsubscribe({}).catch(() => {});
  }
};

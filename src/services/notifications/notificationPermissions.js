import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";

export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

export const getPlatformName = () => {
  return Capacitor.getPlatform(); // 'web', 'android', 'ios'
};

/**
 * Check permission status across platforms.
 * Returns: 'granted' | 'denied' | 'prompt' | 'unsupported'
 */
export const checkNotificationPermission = async () => {
  if (isNativePlatform()) {
    try {
      const pushPerm = await PushNotifications.checkPermissions();
      return pushPerm.receive; // 'granted' | 'denied' | 'prompt'
    } catch (_) {
      try {
        const localPerm = await LocalNotifications.checkPermissions();
        return localPerm.display;
      } catch (err) {
        console.warn("[Permission] Native permission check error:", err);
        return "prompt";
      }
    }
  }

  // Web Browser / PWA
  if (typeof window !== "undefined" && "Notification" in window) {
    return Notification.permission; // 'granted' | 'denied' | 'default'
  }

  return "unsupported";
};

/**
 * Request notification permissions across platforms.
 */
export const requestNotificationPermission = async () => {
  if (isNativePlatform()) {
    try {
      let pushResult = await PushNotifications.requestPermissions();
      if (pushResult.receive !== "granted") {
        const localResult = await LocalNotifications.requestPermissions();
        return localResult.display;
      }
      return pushResult.receive;
    } catch (err) {
      console.warn("[Permission] Native request error:", err);
      return "denied";
    }
  }

  // Web Browser / PWA
  if (typeof window !== "undefined" && "Notification" in window) {
    return await Notification.requestPermission();
  }

  return "unsupported";
};

/**
 * Provides user-friendly troubleshooting guide when permission is denied.
 */
export const getPermissionHelp = () => {
  const platform = getPlatformName();

  if (platform === "android") {
    return "Open your phone's Settings > Apps > FitTogether > Notifications, and toggle 'Allow notifications' ON.";
  }
  if (platform === "ios") {
    return "Open your iPhone Settings > FitTogether > Notifications, and toggle 'Allow Notifications' ON.";
  }
  return "Click the lock icon (🔒) or site settings beside the website URL in your browser bar, and change Notifications to 'Allow'.";
};

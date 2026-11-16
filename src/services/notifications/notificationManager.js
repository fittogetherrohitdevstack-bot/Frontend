import { Capacitor } from "@capacitor/core";
import {
  isWebPushSupported,
  registerServiceWorker,
  subscribeWebPush,
  unsubscribeWebPush,
  getWebPushSubscription,
} from "./webPush";
import {
  initNativePush,
  unregisterNativePush,
} from "./nativePush";
import {
  initLocalNotifications,
  scheduleDailyReminders,
  cancelDailyReminders,
  reconcilePendingReminders,
} from "./localNotifications";
import {
  checkNotificationPermission,
  requestNotificationPermission,
  getPermissionHelp,
  isNativePlatform,
  getPlatformName,
} from "./notificationPermissions";
import {
  navigateToNotification,
  resolveNotificationRoute,
} from "./notificationNavigation";
import { toast } from "sonner";

class NotificationManager {
  constructor() {
    this.initialized = false;
    this.navigateFn = null;
  }

  /**
   * Initialize notification system for current platform (Web, Android, iOS).
   * Safe to call multiple times.
   */
  async init(navigateFn = null) {
    if (navigateFn) {
      this.navigateFn = navigateFn;
    }

    if (this.initialized) return;

    try {
      if (isNativePlatform()) {
        // Native Android & iOS setup
        await initNativePush(this.navigateFn);
        await initLocalNotifications(this.navigateFn);
        await reconcilePendingReminders();
      } else {
        // Web / PWA setup
        await registerServiceWorker();
      }

      this.initialized = true;
    } catch (err) {
      console.warn("[NotificationManager] Init error:", err.message);
    }
  }

  /**
   * Check current permission status
   */
  async getPermissionStatus() {
    return await checkNotificationPermission();
  }

  /**
   * Request permission across Web, Android, and iOS
   */
  async requestPermission() {
    const status = await requestNotificationPermission();

    if (status === "granted") {
      if (isNativePlatform()) {
        await initNativePush(this.navigateFn);
      } else if (isWebPushSupported()) {
        await subscribeWebPush().catch((e) => {
          console.warn("[NotificationManager] Auto-subscribe WebPush notice:", e.message);
        });
      }
    }

    return status;
  }

  /**
   * Register push notifications on user login
   */
  async registerOnLogin() {
    try {
      if (isNativePlatform()) {
        await initNativePush(this.navigateFn);
      } else if (isWebPushSupported()) {
        const existing = await getWebPushSubscription();
        if (existing) {
          // Re-subscribe or ensure backend is synced
          await subscribeWebPush().catch(() => {});
        }
      }
    } catch (err) {
      console.warn("[NotificationManager] registerOnLogin warning:", err.message);
    }
  }

  /**
   * Unregister push on user logout (without affecting other devices)
   */
  async unregisterOnLogout() {
    try {
      if (isNativePlatform()) {
        await unregisterNativePush();
      } else {
        await unsubscribeWebPush();
      }
    } catch (err) {
      console.warn("[NotificationManager] unregisterOnLogout warning:", err.message);
    }
  }

  /**
   * Schedule local offline reminders on the device
   */
  async scheduleLocalReminders(routineSettings) {
    return await scheduleDailyReminders(routineSettings);
  }

  /**
   * Cancel local offline reminders
   */
  async cancelLocalReminders() {
    return await cancelDailyReminders();
  }

  /**
   * Client-side notify facade (triggers in-app toast / banner immediately)
   */
  notify({ title, body, type = "general", data = {}, duration = 4000 }) {
    toast(title, {
      description: body,
      action: {
        label: "View",
        onClick: () => {
          const url = data.url || resolveNotificationRoute({ type, data });
          navigateToNotification({ url, ...data }, this.navigateFn);
        },
      },
      duration,
    });
  }

  /**
   * Get troubleshooting text if permission is denied
   */
  getPermissionHelpText() {
    return getPermissionHelp();
  }

  /**
   * Current platform identifier
   */
  getPlatform() {
    return getPlatformName();
  }
}

export const notificationManager = new NotificationManager();
export default notificationManager;

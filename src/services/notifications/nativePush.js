import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { deviceApi } from "../../api/endpoints";
import { navigateToNotification } from "./notificationNavigation";
import { toast } from "sonner";

const INSTALLATION_KEY = "fittogether_installation_id";

export const getInstallationId = () => {
  if (typeof window === "undefined") return "web-install-fallback";
  let id = localStorage.getItem(INSTALLATION_KEY);
  if (!id) {
    id = "inst_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now();
    localStorage.setItem(INSTALLATION_KEY, id);
  }
  return id;
};

let listenersInitialized = false;

export const initNativePush = async (navigateFn = null) => {
  if (!Capacitor.isNativePlatform()) {
    return { platform: "web", supported: false };
  }

  const platform = Capacitor.getPlatform(); // 'android' | 'ios'
  const installationId = getInstallationId();

  try {
    // Check & request permission
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== "granted") {
      return { platform, registered: false, reason: "permission_denied" };
    }

    if (!listenersInitialized) {
      // 1. Success token registration
      await PushNotifications.addListener("registration", async (token) => {
        try {
          await deviceApi.registerDevice({
            installationId,
            platform,
            token: token.value,
            deviceModel: navigator.userAgent || platform,
            appVersion: "1.0.0",
          });
          console.log(`[NativePush] Device registered (${platform}) with FCM token`);
        } catch (err) {
          console.warn("[NativePush] Backend registration failed:", err.message);
        }
      });

      // 2. Registration error
      await PushNotifications.addListener("registrationError", (error) => {
        console.warn("[NativePush] Native registration error:", error);
      });

      // 3. Foreground notification received
      await PushNotifications.addListener("pushNotificationReceived", (notification) => {
        // Display high-class in-app banner
        const title = notification.title || "FitTogether";
        const body = notification.body || "";
        const url = notification.data?.url || "/";

        toast(title, {
          description: body,
          action: {
            label: "View",
            onClick: () => navigateToNotification({ url, ...notification.data }, navigateFn),
          },
          duration: 4500,
        });
      });

      // 4. Background / lock screen notification tap
      await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
        const notifData = action.notification?.data || {};
        navigateToNotification(notifData, navigateFn);
      });

      listenersInitialized = true;
    }

    // Trigger register with OS
    await PushNotifications.register();
    return { platform, registered: true };
  } catch (err) {
    console.warn("[NativePush] Initialization error:", err.message);
    return { platform, registered: false, error: err.message };
  }
};

export const unregisterNativePush = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const installationId = getInstallationId();
    await deviceApi.unregisterDevice({ installationId }).catch(() => {});
    await PushNotifications.removeAllListeners();
    listenersInitialized = false;
  } catch (err) {
    console.warn("[NativePush] Unregister error:", err.message);
  }
};

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { navigateToNotification } from "./notificationNavigation";

// Stable notification IDs for local scheduled reminders
export const LOCAL_REMINDER_IDS = {
  BREAKFAST: 101,
  LUNCH: 102,
  DINNER: 103,
  WATER: 104,
  WORKOUT: 105,
  SLEEP: 106,
};

let localListenersInitialized = false;

export const initLocalNotifications = async (navigateFn = null) => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === "prompt") {
      await LocalNotifications.requestPermissions();
    }

    // Create Android notification channel for local reminders
    if (Capacitor.getPlatform() === "android") {
      await LocalNotifications.createChannel({
        id: "fittogether_reminders",
        name: "Personal Daily Reminders",
        description: "Scheduled daily habit and meal reminders",
        importance: 4, // High importance
        visibility: 1, // Public
        sound: "default",
        vibration: true,
      }).catch(() => {});
    }

    if (!localListenersInitialized) {
      LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
        const extra = action.notification?.extra || {};
        navigateToNotification(extra, navigateFn);
      });
      localListenersInitialized = true;
    }
  } catch (err) {
    console.warn("[LocalNotifications] Init warning:", err.message);
  }
};

/**
 * Helper to calculate the next Date for a given HH:MM time string.
 */
const getNextOccurrenceDate = (timeStr = "08:00") => {
  const [hours, minutes] = (timeStr || "08:00").split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  // If time has already passed today, schedule for tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
};

/**
 * Schedule or update personal daily reminders on the native device.
 * Runs completely offline.
 */
export const scheduleDailyReminders = async (routineSettings = {}) => {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== "granted") return false;
    }

    const {
      breakfastTime = "08:30",
      lunchTime = "13:00",
      dinnerTime = "20:00",
      workoutTime = "18:00",
      waterReminderEnabled = true,
      remindersEnabled = true,
    } = routineSettings;

    // First cancel previous routine reminders to prevent duplicate stacking
    await cancelDailyReminders();

    if (!remindersEnabled) return true;

    const notificationsToSchedule = [];

    // 1. Breakfast Reminder
    notificationsToSchedule.push({
      id: LOCAL_REMINDER_IDS.BREAKFAST,
      title: "🍳 Breakfast Time",
      body: "Start your morning right! Log your breakfast to earn your squad points.",
      schedule: {
        at: getNextOccurrenceDate(breakfastTime),
        repeats: true,
        every: "day",
        allowWhileIdle: true,
      },
      channelId: "fittogether_reminders",
      smallIcon: "ic_stat_fittogether",
      extra: { url: "/tracker", type: "meal_reminder" },
    });

    // 2. Lunch Reminder
    notificationsToSchedule.push({
      id: LOCAL_REMINDER_IDS.LUNCH,
      title: "🥗 Midday Fuel",
      body: "Time for lunch! Don't let your midday calories and protein slip.",
      schedule: {
        at: getNextOccurrenceDate(lunchTime),
        repeats: true,
        every: "day",
        allowWhileIdle: true,
      },
      channelId: "fittogether_reminders",
      smallIcon: "ic_stat_fittogether",
      extra: { url: "/tracker", type: "meal_reminder" },
    });

    // 3. Workout Reminder
    notificationsToSchedule.push({
      id: LOCAL_REMINDER_IDS.WORKOUT,
      title: "💪 Workout Time",
      body: "Crush today's planned session and keep your squad streak burning!",
      schedule: {
        at: getNextOccurrenceDate(workoutTime),
        repeats: true,
        every: "day",
        allowWhileIdle: true,
      },
      channelId: "fittogether_reminders",
      smallIcon: "ic_stat_fittogether",
      extra: { url: "/workouts", type: "workout_reminder" },
    });

    // 4. Dinner Reminder
    notificationsToSchedule.push({
      id: LOCAL_REMINDER_IDS.DINNER,
      title: "🍽️ Dinner & Evening Recap",
      body: "Wrap up today's meals and review your nutrient totals.",
      schedule: {
        at: getNextOccurrenceDate(dinnerTime),
        repeats: true,
        every: "day",
        allowWhileIdle: true,
      },
      channelId: "fittogether_reminders",
      smallIcon: "ic_stat_fittogether",
      extra: { url: "/tracker", type: "meal_reminder" },
    });

    // 5. Water Hydration Pacer (midday reminder)
    if (waterReminderEnabled) {
      notificationsToSchedule.push({
        id: LOCAL_REMINDER_IDS.WATER,
        title: "💧 Hydration Check",
        body: "Have you reached 50% of your water target today? Take a sip!",
        schedule: {
          at: getNextOccurrenceDate("15:00"),
          repeats: true,
          every: "day",
          allowWhileIdle: true,
        },
        channelId: "fittogether_reminders",
        smallIcon: "ic_stat_fittogether",
        extra: { url: "/water", type: "water_reminder" },
      });
    }

    await LocalNotifications.schedule({
      notifications: notificationsToSchedule,
    });

    console.log(`[LocalNotifications] Scheduled ${notificationsToSchedule.length} recurring daily reminders`);
    return true;
  } catch (err) {
    console.warn("[LocalNotifications] Scheduling error:", err.message);
    return false;
  }
};

/**
 * Cancels all scheduled personal daily reminders.
 */
export const cancelDailyReminders = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const ids = Object.values(LOCAL_REMINDER_IDS).map((id) => ({ id }));
    await LocalNotifications.cancel({ notifications: ids });
  } catch (err) {
    console.warn("[LocalNotifications] Cancel warning:", err.message);
  }
};

/**
 * Reconcile pending reminders on app resume / launch.
 */
export const reconcilePendingReminders = async () => {
  if (!Capacitor.isNativePlatform()) return [];
  try {
    const pending = await LocalNotifications.getPending();
    return pending.notifications || [];
  } catch (err) {
    return [];
  }
};

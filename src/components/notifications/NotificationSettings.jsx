import React from "react";
import { motion } from "framer-motion";
import {
  Bell,
  BellRing,
  UtensilsCrossed,
  Droplets,
  Dumbbell,
  Camera,
  Award,
  Users,
  Volume2,
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  Send,
  Smartphone,
} from "lucide-react";
import { Switch } from "../ui/Switch";
import { Button } from "../ui/Button";
import { GlassCard } from "../ui/GlassCard";
import { useNotifications } from "../../hooks/useNotifications";
import { notificationManager } from "../../services/notifications/notificationManager";
import { pushApi, deviceApi } from "../../api/endpoints";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";

export const NotificationSettings = () => {
  const {
    preferences,
    updatePreferences,
    isUpdatingPrefs,
    permissionStatus,
    requestPermission,
  } = useNotifications();

  const [isSendingTest, setIsSendingTest] = React.useState(false);

  const handleToggle = (key, currentVal) => {
    haptics.tick();
    updatePreferences({
      ...preferences,
      [key]: !currentVal,
    });
  };

  const handleSendTestPush = async () => {
    haptics.impact();
    setIsSendingTest(true);
    try {
      if (notificationManager.getPlatform() !== "web") {
        await deviceApi.sendTest();
        toast.success("Test native push notification sent!");
      } else {
        await pushApi.sendTest();
        toast.success("Test Web Push notification sent!");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to send test push");
    } finally {
      setIsSendingTest(false);
    }
  };

  const isDenied = permissionStatus === "denied";
  const isGranted = permissionStatus === "granted";
  const platform = notificationManager.getPlatform();

  return (
    <div className="w-full space-y-6">
      {/* 1. Device-Level Permission Status Banner */}
      <GlassCard
        glow={isGranted ? "lime" : isDenied ? "none" : "cyan"}
        className={`p-4 sm:p-5 border ${
          isGranted
            ? "border-lime-300 bg-lime-50/50"
            : isDenied
            ? "border-amber-300 bg-amber-50/50"
            : "border-cyan-300 bg-cyan-50/50"
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
              isGranted
                ? "bg-lime-500 text-slate-950 border-lime-400"
                : isDenied
                ? "bg-amber-500 text-white border-amber-400"
                : "bg-cyan-500 text-white border-cyan-400"
            }`}
          >
            {isGranted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : isDenied ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <BellRing className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-slate-900">
                {isGranted
                  ? "Notifications Active"
                  : isDenied
                  ? "Notifications Blocked in Settings"
                  : "Notifications Not Enabled"}
              </h3>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                {platform}
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
              {isGranted
                ? "Your device is connected for real-time squad moments, meal updates, and scheduled reminders."
                : isDenied
                ? notificationManager.getPermissionHelpText()
                : "Enable push notifications to never miss squad milestones, hydration reminders, and streak updates."}
            </p>

            {!isGranted && !isDenied && (
              <Button
                variant="lime"
                size="sm"
                onClick={async () => {
                  haptics.impact();
                  await requestPermission();
                }}
                className="mt-3 text-xs font-black shadow-xs cursor-pointer min-h-[40px]"
              >
                <Bell className="w-3.5 h-3.5 mr-1" /> Enable Notifications Now
              </Button>
            )}

            {isGranted && (
              <div className="mt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={isSendingTest}
                  onClick={handleSendTestPush}
                  className="text-xs font-bold shadow-xs cursor-pointer min-h-[38px]"
                >
                  <Send className="w-3.5 h-3.5 mr-1" /> Send Test Notification
                </Button>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* 2. Master Push Notifications Toggle */}
      <GlassCard className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-extrabold text-slate-900">
              Master Push Notifications
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Toggle all incoming push alerts on or off for this account.
            </p>
          </div>
          <Switch
            checked={preferences.allPushEnabled !== false}
            onCheckedChange={() =>
              handleToggle("allPushEnabled", preferences.allPushEnabled !== false)
            }
            disabled={isUpdatingPrefs}
          />
        </div>
      </GlassCard>

      {/* 3. Social Activity Channels */}
      <GlassCard className="p-4 sm:p-5 space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Squad Activity Alerts</h3>
          <p className="text-xs text-slate-500 font-medium">
            Choose which squad events notify you.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {/* Meal Notifications */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Meal Logs</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  When a squadmate logs breakfast, lunch, or dinner.
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.mealNotifications !== false}
              onCheckedChange={() =>
                handleToggle("mealNotifications", preferences.mealNotifications !== false)
              }
              disabled={isUpdatingPrefs}
            />
          </div>

          {/* Diet Updates */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-lime-100 text-lime-700 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Diet Plans & Completion</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  When a squadmate activates a diet plan or finishes 100% of their daily chart.
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.dietUpdates !== false}
              onCheckedChange={() =>
                handleToggle("dietUpdates", preferences.dietUpdates !== false)
              }
              disabled={isUpdatingPrefs}
            />
          </div>

          {/* Water Logging */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Hydration Milestones</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  When a squadmate hits their daily water target.
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.waterLogging !== false}
              onCheckedChange={() =>
                handleToggle("waterLogging", preferences.waterLogging !== false)
              }
              disabled={isUpdatingPrefs}
            />
          </div>

          {/* Squad Moments */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Squad Moments</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  When a squadmate posts gym photos, meals, or PR moments.
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.moments !== false}
              onCheckedChange={() =>
                handleToggle("moments", preferences.moments !== false)
              }
              disabled={isUpdatingPrefs}
            />
          </div>

          {/* Workout Completion */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Workouts Completed</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  When a squadmate crushes a training session.
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.workoutCompletion !== false}
              onCheckedChange={() =>
                handleToggle("workoutCompletion", preferences.workoutCompletion !== false)
              }
              disabled={isUpdatingPrefs}
            />
          </div>

          {/* Achievements & Badges */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Badges & Achievements</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  When a squadmate unlocks a new milestone badge.
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.achievements !== false}
              onCheckedChange={() =>
                handleToggle("achievements", preferences.achievements !== false)
              }
              disabled={isUpdatingPrefs}
            />
          </div>

          {/* Friend & Squad Invites */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Squad Invites & New Members</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  When teammates join your squad or send invites.
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.friendRequests !== false}
              onCheckedChange={() =>
                handleToggle("friendRequests", preferences.friendRequests !== false)
              }
              disabled={isUpdatingPrefs}
            />
          </div>
        </div>
      </GlassCard>

      {/* 4. Reminders & Sounds */}
      <GlassCard className="p-4 sm:p-5 space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Personal Reminders & Sound</h3>
          <p className="text-xs text-slate-500 font-medium">
            Scheduled habit reminders and alert tones.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Scheduled Daily Reminders</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Personal reminders for breakfast, lunch, water, and workout routines.
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.scheduledReminders !== false}
              onCheckedChange={() =>
                handleToggle("scheduledReminders", preferences.scheduledReminders !== false)
              }
              disabled={isUpdatingPrefs}
            />
          </div>

          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Notification Sound</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Play default chime on incoming push notifications where supported.
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.soundEnabled !== false}
              onCheckedChange={() =>
                handleToggle("soundEnabled", preferences.soundEnabled !== false)
              }
              disabled={isUpdatingPrefs}
            />
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default NotificationSettings;

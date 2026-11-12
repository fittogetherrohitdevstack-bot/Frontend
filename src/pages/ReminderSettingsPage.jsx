import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reminderApi, authApi, pushApi } from "../api/endpoints";
import {
  isPushSupported,
  getCurrentPushSubscription,
  subscribeToWebPush,
  unsubscribeFromWebPush,
} from "../utils/pwaPush";
import { useAuth } from "../context/AuthContext";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Switch } from "../components/ui/Switch";
import { Skeleton } from "../components/ui/Skeleton";
import { haptics } from "../motion/Haptics";
import { toast } from "sonner";
import {
  Bell,
  Scale,
  Ruler,
  Camera,
  Target,
  Moon,
  Send,
  ArrowLeft,
  Info,
  Sparkles,
  CheckCircle2,
  Clock,
} from "lucide-react";

const WEEKDAYS = [
  { id: 0, short: "Sun" },
  { id: 1, short: "Mon" },
  { id: 2, short: "Tue" },
  { id: 3, short: "Wed" },
  { id: 4, short: "Thu" },
  { id: 5, short: "Fri" },
  { id: 6, short: "Sat" },
];

export const ReminderSettingsPage = () => {
  const queryClient = useQueryClient();
  const { user, profile, refreshUser } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["reminder-settings"],
    queryFn: async () => {
      const res = await reminderApi.getSettings();
      return res.data?.data;
    },
  });

  const [form, setForm] = useState(null);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    getCurrentPushSubscription()
      .then((sub) => setPushSubscribed(Boolean(sub)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (data?.settings) {
      const s = data.settings;
      setForm({
        timezone: s.timezone || user?.timezone || "Asia/Kolkata",
        dailyWeight: { ...s.dailyWeight },
        weeklyMeasurements: { ...s.weeklyMeasurements },
        biweeklyPhotos: {
          enabled: s.biweeklyPhotos?.enabled ?? true,
          weekday: s.biweeklyPhotos?.weekday ?? 0,
          time: s.biweeklyPhotos?.time || "08:30",
          anchorDateLocal: s.biweeklyPhotos?.anchorDateLocal || "",
        },
        weeklyTarget: { ...s.weeklyTarget },
        quietHours: { ...s.quietHours },
        channels: {
          inApp: s.channels?.inApp ?? true,
          push: s.channels?.push ?? true,
        },
        snoozeMinutes: s.snoozeMinutes || 60,
        dailyReminder: {
          enabled: s.dailyReminder?.enabled ?? true,
          time: s.dailyReminder?.time || "20:00",
        },
        squadStreakAtRisk: {
          enabled: s.squadStreakAtRisk?.enabled ?? true,
          time: s.squadStreakAtRisk?.time || "20:30",
        },
        nudges: { enabled: s.nudges?.enabled ?? true },
        challengeUpdates: { enabled: s.challengeUpdates?.enabled ?? true },
        weeklyRecapReady: { enabled: s.weeklyRecapReady?.enabled ?? true },
      });
    }
  }, [data, user?.timezone]);

  const featureEnabled = Boolean(
    data?.enabled ?? profile?.featureFlags?.reminders
  );

  const enableMutation = useMutation({
    mutationFn: () => authApi.updateFeatures({ reminders: true }),
    onSuccess: async () => {
      haptics.goal();
      toast.success("Smart Reminders enabled!");
      await Promise.all([
        refreshUser(),
        queryClient.invalidateQueries({ queryKey: ["reminder-settings"] }),
        queryClient.invalidateQueries({ queryKey: ["reminders-due"] }),
      ]);
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => reminderApi.updateSettings(payload),
    onSuccess: async () => {
      haptics.goal();
      toast.success("Reminder schedule saved");
      await Promise.all([
        refreshUser(),
        queryClient.invalidateQueries({ queryKey: ["reminder-settings"] }),
        queryClient.invalidateQueries({ queryKey: ["reminders-due"] }),
        queryClient.invalidateQueries({ queryKey: ["weekly-target"] }),
      ]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Could not save reminder settings");
    },
  });

  const testMutation = useMutation({
    mutationFn: () => reminderApi.sendTest(),
    onSuccess: (res) => {
      haptics.goal();
      toast.success(res.data?.message || "Test reminder sent to your inbox!");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast.error("Failed to send test reminder");
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!form) return;
    saveMutation.mutate({
      timezone: form.timezone,
      dailyWeight: form.dailyWeight,
      weeklyMeasurements: form.weeklyMeasurements,
      biweeklyPhotos: {
        enabled: form.biweeklyPhotos.enabled,
        weekday: form.biweeklyPhotos.weekday,
        time: form.biweeklyPhotos.time,
        ...(form.biweeklyPhotos.anchorDateLocal
          ? { anchorDate: form.biweeklyPhotos.anchorDateLocal }
          : {}),
      },
      weeklyTarget: form.weeklyTarget,
      quietHours: form.quietHours,
      channels: form.channels,
      snoozeMinutes: Number(form.snoozeMinutes),
    });
  };

  if (isLoading || !form) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-20 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    );
  }

  const descriptions = data?.descriptions || {};

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Profile
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Smart Check-In Reminders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Calm in-app reminders that automatically skip if you already logged.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-h-[44px] px-4 self-start sm:self-auto"
          isLoading={testMutation.isPending}
          onClick={() => {
            haptics.tick();
            testMutation.mutate();
          }}
        >
          <Send className="w-3.5 h-3.5" /> Send test reminder
        </Button>
      </div>

      {/* Opt-In Banner for Existing Users */}
      {!featureEnabled && (
        <GlassCard className="p-5 bg-gradient-to-br from-amber-50/70 to-white border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Smart Reminders are paused for your account
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Enable gentle reminders when you want daily weight, weekly tape, and 14-day photo check-ins on Home.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="min-h-[44px] shrink-0"
            isLoading={enableMutation.isPending}
            onClick={() => enableMutation.mutate()}
          >
            Enable Reminders
          </Button>
        </GlassCard>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* 1. Daily Weight */}
        <GlassCard className="p-5 bg-white/95 border-slate-200 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Daily Body Weight
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {descriptions.daily_weight?.why}
                </p>
              </div>
            </div>
            <Switch
              checked={form.dailyWeight.enabled}
              onCheckedChange={(val) =>
                setForm((p) => ({ ...p, dailyWeight: { ...p.dailyWeight, enabled: val } }))
              }
            />
          </div>

          {form.dailyWeight.enabled && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Morning Time ({form.timezone})
                  </label>
                  <input
                    type="time"
                    value={form.dailyWeight.time}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        dailyWeight: { ...p.dailyWeight, time: e.target.value },
                      }))
                    }
                    className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 min-h-[44px]">
                  <span className="text-xs font-bold text-slate-700">
                    Skip if already logged today
                  </span>
                  <Switch
                    checked={form.dailyWeight.onlyIfNotLogged}
                    onCheckedChange={(val) =>
                      setForm((p) => ({
                        ...p,
                        dailyWeight: { ...p.dailyWeight, onlyIfNotLogged: val },
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                  Active Days
                </span>
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAYS.map((wd) => {
                    const active = form.dailyWeight.days?.includes(wd.id);
                    return (
                      <button
                        key={wd.id}
                        type="button"
                        onClick={() => {
                          haptics.tick();
                          setForm((p) => {
                            const cur = p.dailyWeight.days || [];
                            const next = active
                              ? cur.length > 1
                                ? cur.filter((d) => d !== wd.id)
                                : cur
                              : [...cur, wd.id].sort((a, b) => a - b);
                            return { ...p, dailyWeight: { ...p.dailyWeight, days: next } };
                          });
                        }}
                        className={`min-h-[44px] rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                          active
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {wd.short}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        {/* 2. Weekly Measurements */}
        <GlassCard className="p-5 bg-white/95 border-slate-200 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Weekly Body Measurements
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {descriptions.weekly_measurements?.why}
                </p>
              </div>
            </div>
            <Switch
              checked={form.weeklyMeasurements.enabled}
              onCheckedChange={(val) =>
                setForm((p) => ({
                  ...p,
                  weeklyMeasurements: { ...p.weeklyMeasurements, enabled: val },
                }))
              }
            />
          </div>

          {form.weeklyMeasurements.enabled && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAYS.map((wd) => {
                  const active = form.weeklyMeasurements.weekday === wd.id;
                  return (
                    <button
                      key={wd.id}
                      type="button"
                      onClick={() => {
                        haptics.tick();
                        setForm((p) => ({
                          ...p,
                          weeklyMeasurements: { ...p.weeklyMeasurements, weekday: wd.id },
                        }));
                      }}
                      className={`min-h-[44px] rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        active
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {wd.short}
                    </button>
                  );
                })}
              </div>
              <div className="max-w-xs">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Reminder Time
                </label>
                <input
                  type="time"
                  value={form.weeklyMeasurements.time}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      weeklyMeasurements: { ...p.weeklyMeasurements, time: e.target.value },
                    }))
                  }
                  className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900"
                />
              </div>
            </div>
          )}
        </GlassCard>

        {/* 3. Bi-Weekly Progress Photos */}
        <GlassCard className="p-5 bg-white/95 border-slate-200 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Bi-Weekly Progress Photos (Every 14 Days)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {descriptions.biweekly_photos?.why}
                </p>
              </div>
            </div>
            <Switch
              checked={form.biweeklyPhotos.enabled}
              onCheckedChange={(val) =>
                setForm((p) => ({
                  ...p,
                  biweeklyPhotos: { ...p.biweeklyPhotos, enabled: val },
                }))
              }
            />
          </div>

          {form.biweeklyPhotos.enabled && (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Preferred Time
                </label>
                <input
                  type="time"
                  value={form.biweeklyPhotos.time}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      biweeklyPhotos: { ...p.biweeklyPhotos, time: e.target.value },
                    }))
                  }
                  className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Cycle Anchor Date (Day 1)
                </label>
                <input
                  type="date"
                  value={form.biweeklyPhotos.anchorDateLocal}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      biweeklyPhotos: { ...p.biweeklyPhotos, anchorDateLocal: e.target.value },
                    }))
                  }
                  className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900"
                />
              </div>
            </div>
          )}
        </GlassCard>

        {/* 4. Weekly Review & Target Check */}
        <GlassCard className="p-5 bg-white/95 border-slate-200 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Weekly Review & Target Check
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {descriptions.weekly_target?.why}
                </p>
              </div>
            </div>
            <Switch
              checked={form.weeklyTarget.enabled}
              onCheckedChange={(val) =>
                setForm((p) => ({
                  ...p,
                  weeklyTarget: { ...p.weeklyTarget, enabled: val },
                }))
              }
            />
          </div>

          {form.weeklyTarget.enabled && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAYS.map((wd) => {
                  const active = form.weeklyTarget.weekday === wd.id;
                  return (
                    <button
                      key={wd.id}
                      type="button"
                      onClick={() => {
                        haptics.tick();
                        setForm((p) => ({
                          ...p,
                          weeklyTarget: { ...p.weeklyTarget, weekday: wd.id },
                        }));
                      }}
                      className={`min-h-[44px] rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        active
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {wd.short}
                    </button>
                  );
                })}
              </div>
              <div className="max-w-xs">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Evening Review Time
                </label>
                <input
                  type="time"
                  value={form.weeklyTarget.time}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      weeklyTarget: { ...p.weeklyTarget, time: e.target.value },
                    }))
                  }
                  className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900"
                />
              </div>
            </div>
          )}
        </GlassCard>

        {/* 5. Quiet Hours, Snooze & In-App Channel */}
        <GlassCard className="p-5 bg-white/95 border-slate-200 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Quiet Hours & Snooze
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Never interrupt sleep. Missed reminders send at most one gentle follow-up ~3h later.
                </p>
              </div>
            </div>
            <Switch
              checked={form.quietHours.enabled}
              onCheckedChange={(val) =>
                setForm((p) => ({ ...p, quietHours: { ...p.quietHours, enabled: val } }))
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Quiet From
              </label>
              <input
                type="time"
                disabled={!form.quietHours.enabled}
                value={form.quietHours.from}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    quietHours: { ...p.quietHours, from: e.target.value },
                  }))
                }
                className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Quiet Until
              </label>
              <input
                type="time"
                disabled={!form.quietHours.enabled}
                value={form.quietHours.to}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    quietHours: { ...p.quietHours, to: e.target.value },
                  }))
                }
                className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Default Snooze
              </label>
              <select
                value={form.snoozeMinutes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, snoozeMinutes: Number(e.target.value) }))
                }
                className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Bell className="w-4 h-4 text-lime-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-extrabold text-slate-900">
                  In-App Reminders & Bell Inbox
                </p>
                <p className="text-[11px] text-slate-500">
                  Shows the Home Due Strip and notification bell alerts automatically.
                </p>
              </div>
            </div>
            <Switch
              checked={form.channels.inApp}
              onCheckedChange={(val) =>
                setForm((p) => ({ ...p, channels: { ...p.channels, inApp: val } }))
              }
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Timezone: <strong className="text-slate-700">{form.timezone}</strong> (change anytime in Profile)</span>
          </div>
        </GlassCard>

        {/* 6. Phase 4: Web Push & Squad Social Notifications */}
        <GlassCard className="p-5 bg-white/95 border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Web Push &amp; Squad Alerts
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instant alerts for daily streak check-ins, squad streak at risk, nudges, and Sunday recaps.
                </p>
              </div>
            </div>

            {isPushSupported() && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant={pushSubscribed ? "secondary" : "cyan"}
                  isLoading={pushBusy}
                  onClick={async () => {
                    setPushBusy(true);
                    try {
                      if (pushSubscribed) {
                        await unsubscribeFromWebPush(pushApi);
                        setPushSubscribed(false);
                        setForm((p) => ({ ...p, channels: { ...p.channels, push: false } }));
                        toast.info("Device push alerts turned off");
                      } else {
                        await subscribeToWebPush(pushApi);
                        setPushSubscribed(true);
                        setForm((p) => ({ ...p, channels: { ...p.channels, push: true } }));
                        toast.success("Web Push enabled on this device! 🔔");
                      }
                    } catch (err) {
                      toast.error(err.message || "Could not update push subscription");
                    } finally {
                      setPushBusy(false);
                    }
                  }}
                >
                  {pushSubscribed ? "Disable Push" : "Enable Device Push"}
                </Button>
                {pushSubscribed && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await pushApi.sendTest();
                        toast.success("Test push sent to your device!");
                      } catch (err) {
                        toast.error(err.response?.data?.message || "Test push failed");
                      }
                    }}
                  >
                    Test Push
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            {/* Daily Streak Reminder + time */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold text-slate-900">
                  Daily Habit Reminder
                </p>
                <p className="text-[11px] text-slate-500">
                  Reminds you if you haven&apos;t logged weight, water, or a meal yet today.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <input
                  type="time"
                  value={form.dailyReminder?.time || "20:00"}
                  disabled={!form.dailyReminder?.enabled}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      dailyReminder: { ...p.dailyReminder, time: e.target.value },
                    }))
                  }
                  className="min-h-[38px] px-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
                />
                <Switch
                  checked={form.dailyReminder?.enabled ?? true}
                  onCheckedChange={(val) =>
                    setForm((p) => ({
                      ...p,
                      dailyReminder: { ...p.dailyReminder, enabled: val },
                    }))
                  }
                />
              </div>
            </div>

            {/* Squad Streak at Risk (Evening) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold text-slate-900">
                  Squad Streak at Risk (Evening)
                </p>
                <p className="text-[11px] text-slate-500">
                  Evening heads-up when a squad member hasn&apos;t logged yet today.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <input
                  type="time"
                  value={form.squadStreakAtRisk?.time || "20:30"}
                  disabled={!form.squadStreakAtRisk?.enabled}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      squadStreakAtRisk: { ...p.squadStreakAtRisk, time: e.target.value },
                    }))
                  }
                  className="min-h-[38px] px-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
                />
                <Switch
                  checked={form.squadStreakAtRisk?.enabled ?? true}
                  onCheckedChange={(val) =>
                    setForm((p) => ({
                      ...p,
                      squadStreakAtRisk: { ...p.squadStreakAtRisk, enabled: val },
                    }))
                  }
                />
              </div>
            </div>

            {[
              {
                key: "nudges",
                title: "Friend Nudges",
                desc: "Receive push notifications when a squadmate nudges you.",
              },
              {
                key: "challengeUpdates",
                title: "Challenge Updates & Wins",
                desc: "Alerts for weekly squad challenges and podium victories.",
              },
              {
                key: "weeklyRecapReady",
                title: "Weekly Recap Ready (Sunday Evening)",
                desc: "Alert when your shareable Sunday Recap story card is ready.",
              },
            ].map((item) => (
              <div
                key={item.key}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-xs font-extrabold text-slate-900">{item.title}</p>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
                <Switch
                  checked={form[item.key]?.enabled ?? true}
                  onCheckedChange={(val) =>
                    setForm((p) => ({ ...p, [item.key]: { enabled: val } }))
                  }
                />
              </div>
            ))}
          </div>
        </GlassCard>

        <Button
          type="submit"
          size="lg"
          className="w-full min-h-[48px] text-sm font-extrabold"
          isLoading={saveMutation.isPending}
        >
          <CheckCircle2 className="w-4 h-4" /> Save Reminder Schedule
        </Button>
      </form>
    </div>
  );
};

export default ReminderSettingsPage;

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { authApi, pushApi, reminderApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { haptics } from "../../motion/Haptics";
import { subscribeToWebPush, isPushSupported } from "../../utils/pwaPush";
import { Sparkles, Target, Bell, Check, ArrowRight } from "lucide-react";

const AVATAR_OPTIONS = [
  { id: "flame", label: "🔥" },
  { id: "spark", label: "⚡" },
  { id: "dumbbell", label: "🏋️" },
  { id: "leaf", label: "🥗" },
  { id: "wave", label: "💧" },
  { id: "mountain", label: "⛰️" },
  { id: "crown", label: "👑" },
  { id: "heart", label: "❤️" },
];

const GOALS = [
  { id: "fat_loss", label: "Fat Loss", desc: "Steady deficit & daily movement" },
  { id: "muscle_gain", label: "Build Muscle", desc: "High protein & progressive workouts" },
  { id: "maintenance", label: "Stay Consistent", desc: "Daily streaks, water & balance" },
  { id: "endurance", label: "Energy & Stamina", desc: "Hydration & active days" },
];

export const QuickOnboardingModal = () => {
  const { user, profile, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(user?.name || "");
  const [avatarId, setAvatarId] = useState("flame");
  const [goal, setGoal] = useState(profile?.fitnessGoal || "maintenance");
  const [reminderTime, setReminderTime] = useState("20:00");
  const [enablePush, setEnablePush] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user?.needsOnboarding) return null;

  const handleFinish = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile({
        name: name.trim() || user.name,
        fitnessGoal: goal,
        needsOnboarding: false,
      });
      await authApi.uploadAvatar({ avatarId }).catch(() => {});
      await reminderApi
        .updateSettings({
          dailyReminder: { enabled: true, time: reminderTime },
          channels: { inApp: true, push: enablePush },
        })
        .catch(() => {});

      if (enablePush && isPushSupported()) {
        await subscribeToWebPush(pushApi).catch(() => {});
      }

      confetti({ particleCount: 70, spread: 75, origin: { y: 0.6 } });
      haptics.goal();
      toast.success("You're all set! Time to log your first habit 🔥");
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save onboarding setup");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5"
      >
        {/* Step Progress Dots */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-lime-700 bg-lime-100 px-2.5 py-1 rounded-full">
            Quick Setup · Step {step} / 3
          </span>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-1.5 rounded-full transition-all ${
                  n <= step ? "w-6 bg-lime-600" : "w-3 bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-lime-600" />
                  Pick your vibe
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  How your squad will see you on the streak strip &amp; feed.
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl border border-slate-200 text-base text-slate-900 font-semibold focus:outline-none focus:border-lime-500"
                  placeholder="Enter display name"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Choose Avatar</label>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        haptics.tick();
                        setAvatarId(av.id);
                      }}
                      className={`min-h-[48px] rounded-2xl text-xl border flex items-center justify-center cursor-pointer transition-all ${
                        avatarId === av.id
                          ? "bg-lime-100 border-lime-500 scale-105 shadow-xs"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {av.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                variant="primary"
                className="w-full min-h-[44px]"
                onClick={() => {
                  haptics.tick();
                  setStep(2);
                }}
              >
                Next: Your Goal
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-600" />
                  What’s your focus?
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  We tune daily targets around this — changeable anytime.
                </p>
              </div>
              <div className="space-y-2">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      haptics.tick();
                      setGoal(g.id);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      goal === g.id
                        ? "bg-lime-50 border-lime-500 shadow-xs"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-black text-slate-900">{g.label}</p>
                      <p className="text-xs text-slate-500">{g.desc}</p>
                    </div>
                    {goal === g.id && (
                      <div className="w-6 h-6 rounded-full bg-lime-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Button variant="secondary" className="min-h-[44px]" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button variant="primary" className="min-h-[44px]" onClick={() => setStep(3)}>
                  Last Step
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500" />
                  Daily Streak Ping
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pick a quiet evening time so you never lose a streak by accident.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Reminder Time
                </label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl border border-slate-200 text-base font-bold text-slate-900"
                />
              </div>

              {isPushSupported() && (
                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-cyan-50 border border-cyan-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePush}
                    onChange={(e) => setEnablePush(e.target.checked)}
                    className="w-5 h-5 accent-cyan-600"
                  />
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">
                      Turn on Push Alerts
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Get squad nudges &amp; streak-at-risk alerts on this device.
                    </p>
                  </div>
                </label>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <Button variant="secondary" className="min-h-[44px]" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  className="min-h-[44px]"
                  isLoading={saving}
                  onClick={handleFinish}
                >
                  Enter Squad 🚀
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

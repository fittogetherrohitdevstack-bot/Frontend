import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { progressApi } from "../api/endpoints";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Sheet } from "../components/ui/Sheet";
import { AnimatedNumber } from "../motion/AnimatedNumber";
import {
  Droplets,
  Plus,
  Minus,
  Trash2,
  Award,
  Sparkles,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Clock,
  Target,
  Edit2,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Info,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../motion/Haptics";
import { toast } from "sonner";

const QUICK_PRESETS = [
  { amount: 150, label: "Cup", emoji: "☕", desc: "150 ml" },
  { amount: 250, label: "Glass", emoji: "🥛", desc: "250 ml" },
  { amount: 330, label: "Can", emoji: "🥤", desc: "330 ml" },
  { amount: 500, label: "Bottle", emoji: "🧴", desc: "500 ml" },
  { amount: 750, label: "Shaker", emoji: "⚡", desc: "750 ml" },
  { amount: 1000, label: "Large Jug", emoji: "🫙", desc: "1000 ml" },
];

const TARGET_PRESETS = [2000, 2500, 3000, 3500, 4000];

export const WaterPage = () => {
  const queryClient = useQueryClient();
  const [customAmount, setCustomAmount] = useState("");
  const [showTargetSheet, setShowTargetSheet] = useState(false);
  const [newTargetInput, setNewTargetInput] = useState("");

  const { data: waterData, isLoading } = useQuery({
    queryKey: ["today-water"],
    queryFn: async () => {
      const res = await progressApi.getTodayWater();
      return res.data?.data;
    },
  });

  const { data: historyData } = useQuery({
    queryKey: ["water-history"],
    queryFn: async () => {
      const res = await progressApi.getWaterHistory();
      return res.data?.data?.history || [];
    },
  });

  const invalidateWaterQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["today-water"] });
    queryClient.invalidateQueries({ queryKey: ["water-history"] });
    queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] });
    queryClient.invalidateQueries({ queryKey: ["group-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["group-leaderboard"] });
    queryClient.invalidateQueries({ queryKey: ["group-challenges"] });
  };

  const addWaterMutation = useMutation({
    mutationFn: (amountMl) => progressApi.addWater({ amountMl }),
    onSuccess: (res, amount) => {
      invalidateWaterQueries();
      haptics.goal();
      toast.success(`+${amount} ml logged! 💧`, {
        description: "Hydration points & squad streak updated.",
      });
      if (res.data?.data?.percent >= 100) {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#06B6D4", "#38BDF8", "#84CC16", "#10B981"],
        });
      }
      setCustomAmount("");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to log water");
    },
  });

  const updateTargetMutation = useMutation({
    mutationFn: (targetMl) => progressApi.updateWaterTarget({ targetMl }),
    onSuccess: (res, newTarget) => {
      invalidateWaterQueries();
      haptics.goal();
      toast.success(`Daily hydration target set to ${newTarget} ml! 🎯`);
      setShowTargetSheet(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Could not update target");
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId) => progressApi.deleteWaterEntry(entryId),
    onSuccess: () => {
      invalidateWaterQueries();
      haptics.tick();
      toast("Water entry removed");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto px-1">
        <Skeleton className="h-80 w-full rounded-3xl" />
        <Skeleton className="h-44 w-full rounded-3xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    );
  }

  const totalConsumed = waterData?.totalConsumed || 0;
  const targetMl = waterData?.targetMl || 3000;
  const percent = targetMl > 0 ? Math.round((totalConsumed / targetMl) * 100) : 0;
  const clampedPercent = Math.min(100, percent);
  const entries = waterData?.entries || [];

  // Recent 7 days from historyData
  const recentDays = (historyData || []).slice(0, 7).reverse();

  // Daytime Milestones
  const milestones = [
    { label: "Morning Kickoff", target: Math.round(targetMl * 0.2), time: "By 11 AM", icon: "🌅" },
    { label: "Midday Boost", target: Math.round(targetMl * 0.5), time: "By 3 PM", icon: "☀️" },
    { label: "Afternoon Flow", target: Math.round(targetMl * 0.75), time: "By 7 PM", icon: "⚡" },
    { label: "Goal Complete", target: targetMl, time: "By 10 PM", icon: "🌙" },
  ];

  // Proportional points breakdown
  const pointsEarned =
    totalConsumed >= targetMl
      ? 15
      : totalConsumed >= 2000
      ? 10
      : totalConsumed >= 1000
      ? 5
      : totalConsumed >= 500
      ? 3
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 sm:space-y-5 max-w-2xl mx-auto text-slate-900 pb-28 lg:pb-12"
    >
      {/* 1. HERO HYDRATION TUMBLER CARD */}
      <GlassCard
        glow="cyan"
        className="bg-white/95 text-center p-4 sm:p-7 relative overflow-hidden border-cyan-100 shadow-[0_10px_35px_rgba(6,182,212,0.09)]"
      >
        {/* Soft background ambient liquid glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none -mt-24" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Header pill */}
          <div className="flex items-center justify-between w-full mb-3">
            <div className="inline-flex items-center gap-1.5 text-cyan-800 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200 text-xs font-black uppercase tracking-wider shadow-2xs">
              <Droplets className="w-3.5 h-3.5 fill-cyan-500 text-cyan-500 animate-pulse" />
              <span>Hydration Tracker</span>
            </div>

            <button
              type="button"
              onClick={() => {
                haptics.tick();
                setNewTargetInput(String(targetMl));
                setShowTargetSheet(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-cyan-100 text-slate-700 hover:text-cyan-800 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
            >
              <Target className="w-3.5 h-3.5 text-cyan-600" />
              <span>Target: {targetMl} ml</span>
              <Edit2 className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Daily Water Intake
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-sm">
            Keep hydrated throughout the day to earn up to +15 XP and stay penalty-free
          </p>

          {/* FLUID LIQUID CAPSULE / TUMBLER VISUALIZER */}
          <div className="relative w-44 h-52 sm:w-52 sm:h-60 my-5 flex items-center justify-center">
            {/* Outer Glass Bottle Silhouette */}
            <div className="absolute inset-0 rounded-[44px] sm:rounded-[52px] border-4 border-slate-200/90 bg-slate-50/70 overflow-hidden shadow-inner backdrop-blur-xs">
              {/* Animated Rising Liquid */}
              <motion.div
                initial={{ height: "0%" }}
                animate={{ height: `${clampedPercent}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 22 }}
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-600 via-cyan-400 to-sky-300 opacity-90"
              >
                {/* Liquid Top Surface Wave SVG */}
                <div className="absolute -top-3 left-0 right-0 h-4 overflow-hidden">
                  <svg
                    className="w-[200%] h-full animate-[wave_3s_linear_infinite] opacity-75"
                    viewBox="0 0 1000 100"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,50 C150,100 350,0 500,50 C650,100 850,0 1000,50 L1000,100 L0,100 Z"
                      fill="#38BDF8"
                    />
                  </svg>
                </div>

                {/* Animated Liquid Bubbles */}
                <span className="absolute bottom-4 left-6 w-2 h-2 rounded-full bg-white/60 animate-bounce" />
                <span className="absolute bottom-10 right-8 w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
                <span className="absolute bottom-16 left-12 w-2.5 h-2.5 rounded-full bg-white/40 animate-ping opacity-40" />
              </motion.div>
            </div>

            {/* Vessel Measurement Ticks */}
            <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-between py-6 pointer-events-none z-10 text-[9px] font-black text-slate-400/80">
              <span>{targetMl}ml</span>
              <span>{Math.round(targetMl * 0.75)}ml</span>
              <span>{Math.round(targetMl * 0.5)}ml</span>
              <span>{Math.round(targetMl * 0.25)}ml</span>
              <span>0ml</span>
            </div>

            {/* Centered Numbers Overlay */}
            <div className="relative z-20 flex flex-col items-center select-none bg-white/85 px-4 py-2.5 rounded-3xl backdrop-blur-md border border-white/80 shadow-md">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight tabular-nums">
                <AnimatedNumber value={totalConsumed} />
              </span>
              <span className="text-xs text-slate-500 font-bold">/ {targetMl} ml</span>
              <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-900 text-xs font-black">
                <Sparkles className="w-3 h-3 text-cyan-600" />
                <span>{percent}%</span>
              </div>
            </div>
          </div>

          {/* Goal Status Pill */}
          {percent >= 100 ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-500/20"
            >
              <Award className="w-4 h-4" /> Daily Goal Hit (+15 XP earned)!
            </motion.div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
              <span className="text-cyan-700 font-black">{Math.max(0, targetMl - totalConsumed)} ml</span>
              <span>left to reach today's target</span>
            </div>
          )}

          {/* 2. SIX 1-TAP QUICK DRINK PRESETS (Thumb-Friendly Mobile Grid) */}
          <div className="w-full mt-6">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2 text-left px-1">
              Quick Log by Container
            </span>
            <div className="grid grid-cols-3 gap-2 w-full">
              {QUICK_PRESETS.map((preset) => (
                <motion.button
                  key={preset.amount}
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  disabled={addWaterMutation.isPending}
                  onClick={() => addWaterMutation.mutate(preset.amount)}
                  className="flex flex-col items-center justify-center p-2.5 min-h-[64px] rounded-2xl bg-cyan-50/80 hover:bg-cyan-100/90 border border-cyan-200/90 text-slate-900 transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">{preset.emoji}</span>
                  <span className="text-xs font-black text-cyan-950 mt-0.5">+{preset.amount} ml</span>
                  <span className="text-[10px] text-cyan-700 font-bold leading-none">{preset.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 3. QUICK STEPPER & CUSTOM INPUT */}
          <div className="w-full mt-4 pt-3 border-t border-slate-100 space-y-2.5">
            {/* Quick Sips Steppers */}
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 px-1">Quick Sips:</span>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {[50, 100, 200].map((step) => (
                  <motion.button
                    key={step}
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    disabled={addWaterMutation.isPending}
                    onClick={() => addWaterMutation.mutate(step)}
                    className="min-h-[38px] px-3 rounded-xl bg-slate-100 hover:bg-cyan-100 text-slate-700 hover:text-cyan-900 text-xs font-black border border-slate-200 transition-colors cursor-pointer"
                  >
                    +{step} ml
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Custom Amount Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const amt = Number(customAmount);
                if (amt > 0) addWaterMutation.mutate(amt);
              }}
              className="flex items-center gap-2 w-full"
            >
              <div className="relative flex-1">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Custom ml (e.g. 350)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full min-h-[48px] px-4 pr-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:border-cyan-500 focus:bg-white transition-all shadow-inner"
                />
                {customAmount && (
                  <button
                    type="button"
                    onClick={() => setCustomAmount("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
              <Button
                type="submit"
                variant="cyan"
                size="md"
                disabled={!customAmount || Number(customAmount) <= 0 || addWaterMutation.isPending}
                className="min-h-[48px] px-5 shadow-sm font-bold shrink-0"
              >
                <Plus className="w-4 h-4 mr-1 stroke-[3]" /> Add
              </Button>
            </form>
          </div>
        </div>
      </GlassCard>

      {/* 4. SQUAD GAMIFICATION & POINTS BREAKDOWN CARD */}
      <GlassCard className="bg-white/95 p-4 sm:p-5 border-slate-200 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Hydration XP &amp; Habit Protection
              </h3>
            </div>
          </div>
          <span className="text-xs font-black text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
            +{pointsEarned} / 15 XP Today
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-2xl bg-cyan-50/70 border border-cyan-200/80">
            <span className="text-[10px] font-bold text-cyan-800 uppercase block">Proportional Points</span>
            <p className="text-slate-700 text-xs mt-0.5 font-medium leading-snug">
              Points award incrementally throughout the day (500ml = +3, 1L = +5, 2L = +10, full goal = +15 XP).
            </p>
          </div>

          <div className="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">No Missed Deduction</span>
            <p className="text-slate-700 text-xs mt-0.5 font-medium leading-snug">
              Logging your water prevents the <strong className="text-rose-600">-10 XP</strong> habit deduction on your squad leaderboard!
            </p>
          </div>
        </div>
      </GlassCard>

      {/* 5. DAYTIME HYDRATION MILESTONES */}
      <GlassCard className="bg-white/95 p-4 sm:p-5 border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Daytime Hydration Milestones
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400">Pacing Guide</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {milestones.map((ms, idx) => {
            const completed = totalConsumed >= ms.target;
            return (
              <div
                key={idx}
                className={`p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  completed
                    ? "bg-emerald-50/60 border-emerald-300 text-emerald-950 shadow-2xs"
                    : "bg-slate-50 border-slate-200/80 text-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">{ms.icon}</span>
                  {completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <span className="text-[9px] font-black uppercase text-slate-400">{ms.time}</span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-xs font-black block truncate">{ms.label}</span>
                  <span className="text-[10px] text-slate-500 font-bold">{ms.target} ml</span>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* 6. 7-DAY CONSISTENCY STRIP */}
      {recentDays.length > 0 && (
        <GlassCard className="bg-white/95 p-4 sm:p-5 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Recent Hydration Consistency
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Past {recentDays.length} Days</span>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center pt-1">
            {recentDays.map((item, idx) => {
              const met = item.totalConsumed >= item.targetMl;
              const dayName = new Date(item.date).toLocaleDateString([], { weekday: "narrow" });
              const dayNum = item.date.split("-")[2];
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all ${
                    met
                      ? "bg-cyan-50/90 border-cyan-200 text-cyan-900 shadow-2xs"
                      : "bg-slate-50/80 border-slate-200/70 text-slate-500"
                  }`}
                >
                  <span className="text-[10px] font-black uppercase">{dayName}</span>
                  <span className="text-xs font-black my-0.5">{dayNum}</span>
                  {met ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 fill-cyan-100" />
                  ) : (
                    <span className="text-[9px] font-extrabold text-slate-400">
                      {Math.round((item.totalConsumed / (item.targetMl || 3000)) * 100)}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* 7. TODAY'S DETAILED LOGS TIMELINE */}
      <GlassCard className="bg-white/95 p-4 sm:p-5 border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
            Today's Logs ({entries.length})
          </h3>
          <span className="text-xs font-bold text-cyan-700">{totalConsumed} ml logged</span>
        </div>

        {entries.length === 0 ? (
          <div className="py-8 text-center">
            <Droplets className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
            <p className="text-xs text-slate-400 font-medium">No water logged yet today.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tap any cup, bottle, or jug above to log!</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {entries.map((entry) => {
                const time = new Date(entry.consumedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <motion.div
                    key={entry._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-cyan-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                        <Droplets className="w-4 h-4 fill-cyan-500" />
                      </div>
                      <div>
                        <span className="text-sm font-extrabold text-slate-900">{entry.amountMl} ml</span>
                        <span className="text-xs text-slate-400 ml-2 font-medium">{time}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label="Delete entry"
                      onClick={() => deleteEntryMutation.mutate(entry._id)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </GlassCard>

      {/* 8. TARGET CUSTOMIZER SHEET */}
      <Sheet
        open={showTargetSheet}
        onOpenChange={setShowTargetSheet}
        title="Customize Daily Water Target"
        description="Set a daily hydration goal tailored to your body weight and workout intensity."
      >
        <div className="space-y-4 pt-2 pb-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Quick Target Presets
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {TARGET_PRESETS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    haptics.tick();
                    setNewTargetInput(String(t));
                  }}
                  className={`min-h-[44px] rounded-xl text-xs font-black border transition-all cursor-pointer ${
                    Number(newTargetInput) === t
                      ? "bg-cyan-600 text-white border-cyan-600 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {t} ml
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Custom Target (ml)
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={500}
              max={10000}
              value={newTargetInput}
              onChange={(e) => setNewTargetInput(e.target.value)}
              className="w-full min-h-[46px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-black text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Recommended: 3,000 ml for active adults; 3,500+ ml for intense training.
            </span>
          </div>

          <Button
            type="button"
            variant="cyan"
            disabled={!newTargetInput || Number(newTargetInput) < 500 || updateTargetMutation.isPending}
            isLoading={updateTargetMutation.isPending}
            onClick={() => updateTargetMutation.mutate(Number(newTargetInput))}
            className="w-full min-h-[48px] shadow-md font-extrabold"
          >
            Save Target Goal
          </Button>
        </div>
      </Sheet>
    </motion.div>
  );
};

export default WaterPage;
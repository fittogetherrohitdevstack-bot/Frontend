import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { progressApi } from "../api/endpoints";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import {
  Droplets,
  Plus,
  Trash2,
  Award,
  Sparkles,
  Calendar,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../motion/Haptics";
import { toast } from "sonner";

export const WaterPage = () => {
  const queryClient = useQueryClient();
  const [customAmount, setCustomAmount] = useState("");

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
        description: "Hydration points synced to your squad ledger.",
      });
      if (res.data?.data?.percent >= 100) {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#06B6D4", "#38BDF8", "#84CC16"],
        });
      }
      setCustomAmount("");
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
      <div className="space-y-4 max-w-3xl mx-auto px-1">
        <Skeleton className="h-72 w-full rounded-3xl" />
        <Skeleton className="h-44 w-full rounded-3xl" />
      </div>
    );
  }

  const totalConsumed = waterData?.totalConsumed || 0;
  const targetMl = waterData?.targetMl || 3000;
  const percent = Math.min(150, waterData?.percent || 0);
  const entries = waterData?.entries || [];

  // Recent 7 days from historyData
  const recentDays = (historyData || []).slice(0, 7).reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 max-w-3xl mx-auto text-slate-900 pb-8 sm:pb-12"
    >
      {/* Hydration Main Card */}
      <GlassCard glow="cyan" className="bg-white/95 text-center p-5 sm:p-8 relative overflow-hidden border-cyan-100 shadow-[0_8px_30px_rgba(6,182,212,0.08)]">
        {/* Soft background ambient liquid glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none -mt-20" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 text-cyan-700 bg-cyan-50/90 px-3.5 py-1.5 rounded-full border border-cyan-200/80 mb-3 shadow-xs">
            <Droplets className="w-4 h-4 fill-cyan-500 text-cyan-500 animate-bounce" />
            <span className="text-xs uppercase font-extrabold tracking-wider">Hydration Tracker</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Daily Water Intake
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Stay hydrated to unlock daily habit XP and avoid penalties</p>

          {/* Big Circular Ring Progress */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 my-5 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="text-slate-100"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                className="text-cyan-500"
                strokeWidth="10"
                strokeDasharray={264}
                initial={{ strokeDashoffset: 264 }}
                animate={{ strokeDashoffset: 264 - (264 * Math.min(100, percent)) / 100 }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>

            <div className="absolute flex flex-col items-center select-none">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {totalConsumed}
              </span>
              <span className="text-xs text-slate-500 font-bold">/ {targetMl} ml</span>
              <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-xs font-black">
                <Sparkles className="w-3 h-3 text-cyan-600" />
                {percent}%
              </div>
            </div>
          </div>

          {percent >= 100 ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-500/20"
            >
              <Award className="w-4 h-4" /> Goal Crushed (+15 pts earned)!
            </motion.div>
          ) : (
            <p className="text-xs text-slate-600 font-semibold bg-slate-100/80 px-3.5 py-1.5 rounded-xl border border-slate-200/60">
              <span className="text-cyan-700 font-bold">{Math.max(0, targetMl - totalConsumed)} ml</span> left to hit your daily goal (+15 pts).
            </p>
          )}

          {/* 1-Tap Quick Action Buttons (min 48px touch targets) */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-sm mt-6">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                size="md"
                variant="secondary"
                className="w-full flex-col min-h-[58px] py-2 bg-cyan-50/70 hover:bg-cyan-100/80 border-cyan-200 text-xs shadow-xs"
                isLoading={addWaterMutation.isPending}
                onClick={() => addWaterMutation.mutate(250)}
              >
                <span className="font-extrabold text-cyan-800 text-sm">+250 ml</span>
                <span className="text-[10px] text-cyan-600 font-bold">1 Glass</span>
              </Button>
            </motion.div>

            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                size="md"
                variant="secondary"
                className="w-full flex-col min-h-[58px] py-2 bg-cyan-50/70 hover:bg-cyan-100/80 border-cyan-200 text-xs shadow-xs"
                isLoading={addWaterMutation.isPending}
                onClick={() => addWaterMutation.mutate(500)}
              >
                <span className="font-extrabold text-cyan-800 text-sm">+500 ml</span>
                <span className="text-[10px] text-cyan-600 font-bold">1 Bottle</span>
              </Button>
            </motion.div>

            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                size="md"
                variant="secondary"
                className="w-full flex-col min-h-[58px] py-2 bg-cyan-50/70 hover:bg-cyan-100/80 border-cyan-200 text-xs shadow-xs"
                isLoading={addWaterMutation.isPending}
                onClick={() => addWaterMutation.mutate(1000)}
              >
                <span className="font-extrabold text-cyan-800 text-sm">+1000 ml</span>
                <span className="text-[10px] text-cyan-600 font-bold">Large Jug</span>
              </Button>
            </motion.div>
          </div>

          {/* Custom amount form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (Number(customAmount) > 0) addWaterMutation.mutate(Number(customAmount));
            }}
            className="flex items-center gap-2 w-full max-w-sm mt-4"
          >
            <input
              type="number"
              inputMode="numeric"
              placeholder="Custom ml (e.g. 350)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="flex-1 min-h-[48px] px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:border-cyan-500 focus:bg-white transition-all shadow-inner"
            />
            <Button
              type="submit"
              variant="cyan"
              size="md"
              disabled={!customAmount || Number(customAmount) <= 0}
              className="min-h-[48px] px-5 shadow-sm font-bold"
            >
              <Plus className="w-4 h-4 mr-1 stroke-[3]" /> Add
            </Button>
          </form>
        </div>
      </GlassCard>

      {/* 7-Day Consistency History */}
      {recentDays.length > 0 && (
        <GlassCard className="bg-white/95 p-4 sm:p-5 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Recent Hydration Consistency
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Past {recentDays.length} Days</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center pt-1">
            {recentDays.map((item, idx) => {
              const met = item.totalConsumed >= item.targetMl;
              const dayName = new Date(item.date).toLocaleDateString([], { weekday: "narrow" });
              const dayNum = item.date.split("-")[2];
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all ${
                    met
                      ? "bg-cyan-50/80 border-cyan-200 text-cyan-900 shadow-2xs"
                      : "bg-slate-50/70 border-slate-200/70 text-slate-500"
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

      {/* Today's Intake Entries Timeline */}
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
            <p className="text-[11px] text-slate-400 mt-0.5">Tap a quick amount above to start logging!</p>
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
    </motion.div>
  );
};

export default WaterPage;
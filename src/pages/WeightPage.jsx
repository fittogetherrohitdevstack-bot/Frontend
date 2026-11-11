import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { weightApi, weeklyTargetApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { getLocalDateString } from "../utils/date";
import { getStatusBadgeMeta } from "../components/targets/WeeklyHistoryView";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Sheet } from "../components/ui/Sheet";
import { Skeleton } from "../components/ui/Skeleton";
import {
  Scale,
  TrendingDown,
  TrendingUp,
  Minus,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Flame,
  ArrowRight,
  Target,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../motion/Haptics";
import AnimatedNumber from "../motion/AnimatedNumber";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export const WeightPage = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const quickEntryRef = useRef(null);

  useEffect(() => {
    if (searchParams.get("quick") === "1") {
      quickEntryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      const next = new URLSearchParams(searchParams);
      next.delete("quick");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Unit: 'kg' or 'lb'
  const [unit, setUnit] = useState("kg");
  const [hideNumbers, setHideNumbers] = useState(false);
  const isHidden = Boolean(hideNumbers || profile?.hideWeightNumbers);

  const { data: weeklyTargetData } = useQuery({
    queryKey: ["weekly-target"],
    queryFn: async () => {
      const res = await weeklyTargetApi.getWeekly();
      return res.data?.data;
    },
  });
  const [range, setRange] = useState("30d"); // 7d, 30d, 90d, all
  const [subTab, setSubTab] = useState("daily"); // daily, weekly, monthly

  // Edit / Backfill modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // Quick entry state for top card
  const todayDateStr = getLocalDateString(new Date(), user?.timezone);
  const [quickDate, setQuickDate] = useState(todayDateStr);
  const [quickWeightKg, setQuickWeightKg] = useState(profile?.currentWeight || 75.0);
  const [quickTimeOfDay, setQuickTimeOfDay] = useState("morning");
  const [quickNote, setQuickNote] = useState("");
  const [isManualInput, setIsManualInput] = useState(false);

  // Unit conversion helpers
  const toDisplay = (valKg) => {
    if (valKg === null || valKg === undefined || isNaN(valKg)) return "--";
    if (unit === "lb") {
      return +(valKg * 2.20462).toFixed(1);
    }
    return +(valKg).toFixed(1);
  };

  const toKg = (valDisplay) => {
    if (unit === "lb") {
      return +(valDisplay / 2.20462).toFixed(2);
    }
    return +valDisplay;
  };

  const unitLabel = unit === "lb" ? "lbs" : "kg";

  // Fetch summary analytics
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ["weight-summary", range],
    queryFn: async () => {
      const res = await weightApi.getWeightSummary(range);
      return res.data?.data;
    },
  });

  // Sync quickWeightKg when todayEntry loads
  React.useEffect(() => {
    if (summaryData?.todayEntry) {
      setQuickWeightKg(summaryData.todayEntry.weightKg);
      setQuickTimeOfDay(summaryData.todayEntry.timeOfDay || "morning");
      setQuickNote(summaryData.todayEntry.note || "");
    } else if (summaryData?.stats?.current) {
      setQuickWeightKg(summaryData.stats.current);
    }
  }, [summaryData]);

  // Mutation: Upsert Weight
  const upsertMutation = useMutation({
    mutationFn: (data) => weightApi.upsertWeight(data),
    onSuccess: (res, vars) => {
      haptics.goal();
      if (vars.date === todayDateStr) {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 },
          colors: ["#84CC16", "#7C3AED", "#06B6D4"],
        });
      }
      toast.success(
        vars.date === todayDateStr
          ? `Today's weigh-in logged (${toDisplay(vars.weightKg)} ${unitLabel})! ✓`
          : `Weigh-in saved for ${vars.date}!`
      );
      queryClient.invalidateQueries({ queryKey: ["weight-summary"] });
      queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["progress-history"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-target"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-targets-history"] });
      queryClient.invalidateQueries({ queryKey: ["reminders-due"] });
      setEditModalOpen(false);
      setEditingEntry(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to log weight");
    },
  });

  // Mutation: Delete Weight
  const deleteMutation = useMutation({
    mutationFn: (id) => weightApi.deleteWeightLog(id),
    onSuccess: (res, deletedId, context) => {
      haptics.tick();
      queryClient.invalidateQueries({ queryKey: ["weight-summary"] });
      queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["progress-history"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-target"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-targets-history"] });
      queryClient.invalidateQueries({ queryKey: ["reminders-due"] });
      toast("Weigh-in deleted", {
        action: context?.backup ? {
          label: "Undo",
          onClick: () => {
            upsertMutation.mutate(context.backup);
          },
        } : undefined,
      });
    },
  });

  // Handle Quick Stepper
  const adjustQuickWeight = (delta) => {
    haptics.tick();
    setQuickWeightKg((prev) => {
      const step = unit === "lb" ? delta / 2.20462 : delta;
      const next = +(prev + step).toFixed(2);
      return Math.max(20, Math.min(400, next));
    });
  };

  // Submit quick entry
  const handleSaveQuick = () => {
    haptics.selection();
    upsertMutation.mutate({
      date: quickDate,
      weightKg: Math.round(quickWeightKg * 10) / 10,
      timeOfDay: quickTimeOfDay,
      note: quickNote,
    });
  };

  // Prepare chart data with unit conversion
  const chartData = (summaryData?.chartData || []).map((item) => ({
    date: item.date?.slice(5), // MM-DD
    rawDate: item.date,
    weight: toDisplay(item.weightKg),
    movingAvg: toDisplay(item.movingAverage7d),
    note: item.note,
    changeVsPrevious: item.changeVsPrevious,
  }));

  const stats = summaryData?.stats || {};
  const targetWeight = summaryData?.targetWeight;
  const targetDisplay = targetWeight ? toDisplay(targetWeight) : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header & Settings Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-100 text-lime-800 text-xs font-black uppercase tracking-wider border border-lime-300">
              <Scale className="w-3.5 h-3.5 stroke-[2.5]" />
              Daily Weigh-In
            </span>
            {stats.currentStreak > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold border border-orange-300">
                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-pulse" />
                {stats.currentStreak}d streak
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Weight Analytics & Trend
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily weight fluctuates naturally — the 7-day moving average reveals your true trend.
          </p>
        </div>

        {/* Units & Privacy Toggles */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Unit Toggle (kg / lb) */}
          <div className="flex bg-white/90 border border-slate-200 p-1 rounded-2xl shadow-xs">
            {["kg", "lb"].map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => {
                  haptics.tick();
                  setUnit(u);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  unit === u
                    ? "bg-[#84CC16] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          {/* Hide Numbers Toggle */}
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setHideNumbers(!hideNumbers);
            }}
            title={isHidden ? "Show numbers" : "Hide numbers"}
            className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
          >
            {isHidden ? <EyeOff className="w-4 h-4 text-purple-600" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 1. Big Quick-Entry Card at the Top */}
      <div ref={quickEntryRef}>
      <GlassCard id="weight-quick-entry" className="p-5 sm:p-7 relative overflow-hidden bg-white/95 border-slate-200 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#84CC16] to-[#10B981] flex items-center justify-center text-white shadow-md shadow-lime-500/25">
              <Scale className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  {quickDate === todayDateStr ? "Today's Weigh-In" : `Weigh-In for ${quickDate}`}
                </h3>
                {summaryData?.todayLogged && quickDate === todayDateStr && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 stroke-[2.5]" /> Logged Today
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Weigh consistently, ideally in the morning fasted</p>
            </div>
          </div>

          {/* Date Picker Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <input
              type="date"
              value={quickDate}
              onChange={(e) => {
                haptics.tick();
                setQuickDate(e.target.value);
              }}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-lime-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Stepper & Main Big Number */}
        <div className="py-6 flex flex-col items-center justify-center">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Minus Button */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              type="button"
              onClick={() => adjustQuickWeight(-0.1)}
              aria-label="Decrease weight"
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xl font-bold border border-slate-200 transition-colors shadow-xs cursor-pointer select-none"
            >
              <Minus className="w-6 h-6 stroke-[3]" />
            </motion.button>

            {/* Central Big Number Display */}
            <div className="flex flex-col items-center min-w-[170px] sm:min-w-[210px]">
              {isManualInput ? (
                <div className="flex items-baseline justify-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    autoFocus
                    value={toDisplay(quickWeightKg)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setQuickWeightKg(toKg(val));
                    }}
                    onBlur={() => setIsManualInput(false)}
                    className="text-4xl sm:text-5xl font-black text-slate-900 text-center tracking-tight w-36 bg-slate-50 border-b-2 border-lime-500 focus:outline-none"
                  />
                  <span className="text-xl sm:text-2xl font-bold text-slate-400">{unitLabel}</span>
                </div>
              ) : (
                <div
                  onClick={() => {
                    haptics.tick();
                    setIsManualInput(true);
                  }}
                  className="cursor-pointer group flex flex-col items-center"
                  title="Tap to type exact number"
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight tabular-nums select-none group-hover:text-lime-700 transition-colors">
                      {hideNumbers ? "•••" : toDisplay(quickWeightKg)}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-slate-400 uppercase tracking-wider">
                      {unitLabel}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold mt-1 group-hover:text-slate-600 transition-colors flex items-center gap-1">
                    <Edit2 className="w-3 h-3" /> Tap to type
                  </span>
                </div>
              )}
            </div>

            {/* Plus Button */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              type="button"
              onClick={() => adjustQuickWeight(+0.1)}
              aria-label="Increase weight"
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xl font-bold border border-slate-200 transition-colors shadow-xs cursor-pointer select-none"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </motion.button>
          </div>

          {/* Time of Day Pills */}
          <div className="flex items-center gap-2 mt-5">
            {[
              { id: "morning", label: "Morning (Fasted)" },
              { id: "evening", label: "Evening" },
              { id: "other", label: "Other" },
            ].map((t) => {
              const active = quickTimeOfDay === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    haptics.tick();
                    setQuickTimeOfDay(t.id);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Optional Note & Submit Button */}
          <div className="w-full max-w-md mt-4 flex flex-col sm:flex-row items-center gap-2.5">
            <input
              type="text"
              placeholder="Add optional note (e.g. post-cardio, fasted)"
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
            />

            <Button
              onClick={handleSaveQuick}
              isLoading={upsertMutation.isPending}
              className="w-full sm:w-auto min-h-[44px] px-6 font-extrabold shadow-md shrink-0"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              {summaryData?.todayLogged && quickDate === todayDateStr ? "Update Entry" : "Save Weigh-In"}
            </Button>
          </div>
        </div>
      </GlassCard>
      </div>

      {/* 2. Stat Tiles Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Stat 1 (Headline): 7-Day Moving Avg */}
        <GlassCard className="p-4 bg-white/95 border-slate-200">
          <span className="text-[10px] font-black uppercase tracking-wider text-lime-700 block">
            7-Day Moving Avg
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-lime-700 tracking-tight">
              {isHidden ? "•••" : toDisplay(stats.movingAvg7d)}
            </span>
            <span className="text-xs font-bold text-slate-400">{unitLabel}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Primary trend signal
          </span>
        </GlassCard>

        {/* Stat 2 (Secondary): Latest Single-Day Weight */}
        <GlassCard className="p-4 bg-white/95 border-slate-200">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Latest Single Day
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {isHidden ? "•••" : toDisplay(stats.current)}
            </span>
            <span className="text-xs font-bold text-slate-400">{unitLabel}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Start: {isHidden ? "•••" : toDisplay(stats.starting)} {unitLabel}
          </span>
        </GlassCard>

        {/* Stat 3: Change This Week */}
        <GlassCard className="p-4 bg-white/95 border-slate-200">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Change This Week
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-2xl font-black tracking-tight ${
                stats.changeThisWeek > 0
                  ? "text-slate-800"
                  : stats.changeThisWeek < 0
                  ? "text-slate-800"
                  : "text-slate-600"
              }`}
            >
              {isHidden
                ? "•••"
                : stats.changeThisWeek > 0
                ? `+${toDisplay(stats.changeThisWeek)}`
                : `${toDisplay(stats.changeThisWeek)}`}
            </span>
            <span className="text-xs font-bold text-slate-400">{unitLabel}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Month:{" "}
            {isHidden
              ? "•••"
              : stats.changeThisMonth > 0
              ? `+${toDisplay(stats.changeThisMonth)}`
              : toDisplay(stats.changeThisMonth)}{" "}
            {unitLabel}
          </span>
        </GlassCard>

        {/* Stat 4: Progress to Target */}
        <GlassCard className="p-4 bg-white/95 border-slate-200">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">
            Target: {isHidden ? "•••" : targetDisplay} {unitLabel}
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-purple-700 tracking-tight">
              {isHidden ? "•••" : `${stats.progressPercent}%`}
            </span>
            <span className="text-xs font-bold text-purple-600">done</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            {stats.remainingToTarget !== null
              ? isHidden
                ? "••• to goal"
                : `${toDisplay(stats.remainingToTarget)} ${unitLabel} to goal`
              : "Set in profile"}
          </span>
        </GlassCard>
      </div>

      {/* 3. Range Selector & Interactive Chart */}
      <GlassCard className="p-5 sm:p-6 bg-white/95 border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.06)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base">Weight Progress Over Time</h3>
              {weeklyTargetData?.enabled && weeklyTargetData?.progress && (() => {
                const badge = getStatusBadgeMeta(weeklyTargetData.progress.status);
                const BadgeIcon = badge.Icon;
                const actualChange = weeklyTargetData.progress.actualChangeKg;
                const targetPace = weeklyTargetData.target?.weightChangeKgPerWeek;
                return (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.pillClass}`}
                  >
                    <BadgeIcon className={`w-3 h-3 ${badge.iconClass}`} />
                    <span>{badge.label}</span>
                    {targetPace !== null && targetPace !== undefined && (
                      <span className="opacity-80">
                        · {isHidden ? "•••" : `${actualChange ?? "—"} / ${targetPace} kg/wk`}
                      </span>
                    )}
                  </span>
                );
              })()}
            </div>
            <p className="text-xs text-slate-500">
              Solid line = 7-day moving trend · Dots = daily logs · Dashed = target
            </p>
          </div>

          {/* Range Tabs (7D, 30D, 90D, All) */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            {[
              { id: "7d", label: "7D" },
              { id: "30d", label: "30D" },
              { id: "90d", label: "90D" },
              { id: "all", label: "All" },
            ].map((t) => {
              const active = range === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    haptics.tick();
                    setRange(t.id);
                  }}
                  className={`relative px-3.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    active
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recharts Area / Composed Chart */}
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : chartData.length > 0 ? (
          <div className="h-68 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84CC16" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#84CC16" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  domain={["auto", "auto"]}
                  tickLine={false}
                  tickFormatter={(val) => (isHidden ? "••" : val)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-2xl bg-white/95 border border-slate-200 shadow-xl backdrop-blur-md text-xs space-y-1">
                          <p className="font-extrabold text-slate-900">{data.rawDate}</p>
                          <p className="font-bold text-slate-700">
                            Weigh-in:{" "}
                            <span className="font-black text-slate-900">
                              {isHidden ? "•••" : `${data.weight} ${unitLabel}`}
                            </span>
                          </p>
                          <p className="font-semibold text-lime-700">
                            7d Moving Avg:{" "}
                            <span className="font-black text-lime-800">
                              {isHidden ? "•••" : `${data.movingAvg} ${unitLabel}`}
                            </span>
                          </p>
                          {data.changeVsPrevious !== 0 && (
                            <p className="text-[11px] text-slate-500">
                              Change:{" "}
                              {isHidden
                                ? "•••"
                                : `${
                                    data.changeVsPrevious > 0
                                      ? `+${toDisplay(data.changeVsPrevious)}`
                                      : toDisplay(data.changeVsPrevious)
                                  } ${unitLabel}`}
                            </p>
                          )}
                          {data.note && (
                            <p className="text-[10px] text-slate-400 italic pt-0.5 border-t border-slate-100">
                              "{data.note}"
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Target Weight Reference Line */}
                {targetDisplay && (
                  <ReferenceLine
                    y={targetDisplay}
                    stroke="#A855F7"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Target: ${isHidden ? "••" : targetDisplay}`,
                      fill: "#9333EA",
                      fontSize: 10,
                      position: "right",
                    }}
                  />
                )}

                {/* Shaded Area for trend */}
                <Area
                  type="monotone"
                  dataKey="movingAvg"
                  fill="url(#weightGrad)"
                  stroke="none"
                />

                {/* Daily Dots */}
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Daily Log"
                  stroke="#CBD5E1"
                  strokeWidth={1}
                  dot={{ r: 3, fill: "#94A3B8", stroke: "#FFFFFF", strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: "#0F172A" }}
                />

                {/* 7-Day Moving Average Line */}
                <Line
                  type="monotone"
                  dataKey="movingAvg"
                  name="7-Day Avg"
                  stroke="#84CC16"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: "#10B981" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            No weigh-ins logged in this time range.
          </div>
        )}
      </GlassCard>

      {/* 4. Calendar Heat-Strip for the Last 30 Days */}
      <GlassCard className="p-4 sm:p-5 bg-white/95 border-slate-200">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-lime-600" />
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
              30-Day Weigh-In Consistency ({stats.daysLogged || 0} / 30 days)
            </h4>
          </div>
          <span className="text-xs font-black text-lime-700">
            {stats.consistencyPercent || 0}% Consistent
          </span>
        </div>

        {/* Heat Strip Circles/Squares */}
        <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5 sm:gap-2">
          {(summaryData?.heatStrip30Days || []).map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.isLogged ? `${toDisplay(day.weightKg)} ${unitLabel}` : "Not logged"}`}
              className={`h-8 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                day.isLogged
                  ? "bg-lime-400/80 text-lime-950 font-black shadow-xs"
                  : "bg-slate-100 text-slate-400 font-medium"
              } ${day.isToday ? "ring-2 ring-slate-900" : ""}`}
            >
              <span className="text-[10px]">{day.dayOfMonth}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* 5. Tabs Below Chart: Daily | Weekly | Monthly */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            {[
              { id: "daily", label: "Daily Entries" },
              { id: "weekly", label: "Weekly Averages" },
              { id: "monthly", label: "Monthly Averages" },
            ].map((t) => {
              const active = subTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    haptics.tick();
                    setSubTab(t.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    active
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <span className="text-xs font-bold text-slate-400">
            {subTab === "daily" && `${summaryData?.daily?.length || 0} logs`}
            {subTab === "weekly" && `${summaryData?.weekly?.length || 0} weeks`}
            {subTab === "monthly" && `${summaryData?.monthly?.length || 0} months`}
          </span>
        </div>

        {/* Tab 1: Daily Table List */}
        {subTab === "daily" && (
          <div className="space-y-2">
            {(summaryData?.daily || []).map((entry) => (
              <GlassCard
                key={entry._id}
                className="p-3.5 sm:p-4 bg-white/95 border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {new Date(entry.date + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className="text-xs font-black text-slate-900">{entry.date.slice(8)}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900 tabular-nums">
                        {isHidden ? "•••" : toDisplay(entry.weightKg)} {unitLabel}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                        {entry.timeOfDay}
                      </span>
                    </div>

                    {entry.note ? (
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">{entry.note}</p>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">{entry.date}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Delta vs Previous */}
                  {entry.changeVsPrevious !== 0 && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-lg tabular-nums ${
                        entry.changeVsPrevious < 0
                          ? "bg-slate-100 text-slate-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {isHidden
                        ? "•••"
                        : entry.changeVsPrevious > 0
                        ? `+${toDisplay(entry.changeVsPrevious)}`
                        : toDisplay(entry.changeVsPrevious)}
                    </span>
                  )}

                  {/* Actions: Edit & Delete */}
                  <button
                    type="button"
                    onClick={() => {
                      haptics.tick();
                      setEditingEntry(entry);
                      setEditModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete weigh-in for ${entry.date}?`)) {
                        deleteMutation.mutate(entry._id, {
                          backup: {
                            date: entry.date,
                            weightKg: entry.weightKg,
                            note: entry.note,
                            timeOfDay: entry.timeOfDay,
                          },
                        });
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Tab 2: Weekly Averages Cards */}
        {subTab === "weekly" && (
          <div className="space-y-2.5">
            {weeklyTargetData?.enabled && weeklyTargetData?.progress && (() => {
              const badge = getStatusBadgeMeta(weeklyTargetData.progress.status);
              const BadgeIcon = badge.Icon;
              const prog = weeklyTargetData.progress;
              const tgt = weeklyTargetData.target;
              const targetPace = tgt?.weightChangeKgPerWeek;
              const actualDelta = prog.actualChangeKg;
              return (
                <GlassCard className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50/40 border-indigo-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-indigo-900">
                        This Week&apos;s Pace
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.pillClass}`}
                      >
                        <BadgeIcon className={`w-3 h-3 ${badge.iconClass}`} />
                        <span>{badge.label}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {prog.weighInsLogged ?? 0} of {tgt?.weighInsTarget ?? 5} planned weigh-ins logged
                      {prog.thisWeekAvgKg !== null && prog.thisWeekAvgKg !== undefined && (
                        <>
                          {" "}· Current avg:{" "}
                          <strong className="text-slate-900">
                            {isHidden ? "•••" : `${toDisplay(prog.thisWeekAvgKg)} ${unitLabel}`}
                          </strong>
                        </>
                      )}
                    </p>
                  </div>

                  {targetPace !== null && targetPace !== undefined && (
                    <div className="sm:text-right shrink-0">
                      <div className="text-xs font-extrabold text-slate-900 tabular-nums">
                        {isHidden
                          ? "•••"
                          : actualDelta !== null && actualDelta !== undefined
                          ? `${actualDelta > 0 ? `+${actualDelta}` : actualDelta} kg`
                          : "—"}
                        <span className="text-slate-500 font-semibold">
                          {" "}/ target {targetPace > 0 ? `+${targetPace}` : targetPace} kg/wk
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Weekly avg vs last week (Mon–Sun)
                      </span>
                    </div>
                  )}
                </GlassCard>
              );
            })()}

            {(summaryData?.weekly || []).map((week, idx) => (
              <GlassCard
                key={week.weekStart}
                className="p-4 bg-white/95 border-slate-200 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {week.weekStart} to {week.weekEnd}
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {week.entriesCount} of 7 days logged • Range: {isHidden ? "••" : toDisplay(week.minWeightKg)} - {isHidden ? "••" : toDisplay(week.maxWeightKg)} {unitLabel}
                  </span>
                </div>

                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-lg font-black text-slate-900 tabular-nums">
                      {isHidden ? "•••" : toDisplay(week.avgWeightKg)}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{unitLabel}</span>
                  </div>

                  {idx < (summaryData?.weekly?.length || 0) - 1 && week.changeVsPreviousWeek !== 0 && (
                    <span className="text-[11px] font-bold text-slate-500">
                      {isHidden
                        ? "•••"
                        : week.changeVsPreviousWeek > 0
                        ? `+${toDisplay(week.changeVsPreviousWeek)}`
                        : toDisplay(week.changeVsPreviousWeek)}{" "}
                      vs prev week
                    </span>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Tab 3: Monthly Averages Cards */}
        {subTab === "monthly" && (
          <div className="space-y-2.5">
            {(summaryData?.monthly || []).map((month, idx) => (
              <GlassCard
                key={month.month}
                className="p-4 bg-white/95 border-slate-200 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{month.label}</h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {month.entriesCount} total weigh-ins • Min: {isHidden ? "••" : toDisplay(month.minWeightKg)} | Max: {isHidden ? "••" : toDisplay(month.maxWeightKg)} {unitLabel}
                  </span>
                </div>

                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-lg font-black text-slate-900 tabular-nums">
                      {isHidden ? "•••" : toDisplay(month.avgWeightKg)}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{unitLabel}</span>
                  </div>

                  {idx < (summaryData?.monthly?.length || 0) - 1 && month.changeVsPreviousMonth !== 0 && (
                    <span className="text-[11px] font-bold text-slate-500">
                      {isHidden
                        ? "•••"
                        : month.changeVsPreviousMonth > 0
                        ? `+${toDisplay(month.changeVsPreviousMonth)}`
                        : toDisplay(month.changeVsPreviousMonth)}{" "}
                      vs prev month
                    </span>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Edit Entry Bottom Sheet */}
      <Sheet
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title={editingEntry ? `Edit Weigh-In (${editingEntry.date})` : "Log Weigh-In"}
        description="Update your weight and details for this date"
      >
        {editingEntry && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Weight ({unitLabel})
              </label>
              <input
                type="number"
                step="0.1"
                required
                inputMode="decimal"
                value={toDisplay(editingEntry.weightKg)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setEditingEntry({ ...editingEntry, weightKg: toKg(val) });
                }}
                className="w-full min-h-[46px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-black text-lg focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Time of Day
              </label>
              <div className="flex gap-2">
                {["morning", "evening", "other"].map((tod) => (
                  <button
                    key={tod}
                    type="button"
                    onClick={() => {
                      haptics.tick();
                      setEditingEntry({ ...editingEntry, timeOfDay: tod });
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      editingEntry.timeOfDay === tod
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tod}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Note
              </label>
              <input
                type="text"
                value={editingEntry.note || ""}
                onChange={(e) => setEditingEntry({ ...editingEntry, note: e.target.value })}
                className="w-full min-h-[46px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              />
            </div>

            <Button
              className="w-full min-h-[46px] shadow-md font-bold"
              isLoading={upsertMutation.isPending}
              onClick={() => {
                upsertMutation.mutate({
                  date: editingEntry.date,
                  weightKg: editingEntry.weightKg,
                  timeOfDay: editingEntry.timeOfDay,
                  note: editingEntry.note,
                });
              }}
            >
              Save Changes
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  );
};

export default WeightPage;

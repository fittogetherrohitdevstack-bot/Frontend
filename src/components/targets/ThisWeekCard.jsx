import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { weeklyTargetApi, authApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import { SetWeeklyTargetSheet } from "./SetWeeklyTargetSheet";
import { WeeklyHistorySheet, getStatusBadgeMeta } from "./WeeklyHistoryView";
import { formatShortDateRange } from "../../utils/date";
import { haptics } from "../../motion/Haptics";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Target,
  Scale,
  Ruler,
  Camera,
  SlidersHorizontal,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Plus,
} from "lucide-react";

const CHECKIN_CHIP_STYLES = {
  done: {
    label: "Done",
    Icon: CheckCircle2,
    classes: "bg-slate-900 text-white border-slate-900",
  },
  completed: {
    label: "Done",
    Icon: CheckCircle2,
    classes: "bg-slate-900 text-white border-slate-900",
  },
  due: {
    label: "Due",
    Icon: Clock,
    classes: "bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100",
  },
  overdue: {
    label: "Overdue",
    Icon: AlertCircle,
    classes: "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100",
  },
  upcoming: {
    label: "Upcoming",
    Icon: Clock,
    classes: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

const formatKgVal = (val, hidden, showSign = false) => {
  if (hidden) return "•••";
  if (val === null || val === undefined) return "—";
  const rounded = Math.abs(val).toFixed(2).replace(/\.00$/, ".0");
  if (!showSign) return `${val} kg`;
  if (val === 0) return "0.0 kg";
  return `${val > 0 ? "+" : "−"}${rounded} kg`;
};

export const ThisWeekCard = ({ forceHideNumbers = false, className = "" }) => {
  const queryClient = useQueryClient();
  const { profile, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [targetSheetOpen, setTargetSheetOpen] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["weekly-target"],
    queryFn: async () => {
      const res = await weeklyTargetApi.getWeekly();
      return res.data?.data;
    },
  });

  useEffect(() => {
    const enabled = Boolean(data?.enabled ?? profile?.featureFlags?.weeklyTargets);
    if (searchParams.get("editTarget") === "1" && enabled) {
      setTargetSheetOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("editTarget");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, data?.enabled, profile?.featureFlags?.weeklyTargets]);

  const enableFlagMutation = useMutation({
    mutationFn: () => authApi.updateFeatures({ weeklyTargets: true }),
    onSuccess: async () => {
      haptics.goal();
      toast.success("Weekly Targets enabled!");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["weekly-target"] }),
        refreshUser(),
      ]);
      setTargetSheetOpen(true);
    },
    onError: () => {
      toast.error("Could not enable Weekly Targets right now");
    },
  });

  if (isLoading && !data) {
    return <Skeleton className="h-56 w-full rounded-3xl" />;
  }

  const featureEnabled = Boolean(
    data?.enabled ?? profile?.featureFlags?.weeklyTargets
  );
  const photoFeatureEnabled = Boolean(
    data?.featureFlags?.photoCheckins ?? profile?.featureFlags?.photoCheckins
  );
  const hideNumbers = Boolean(
    forceHideNumbers || profile?.hideWeightNumbers || data?.hideWeightNumbers
  );

  const progress = data?.progress || {};
  const target = data?.target || null;
  const targetDefaults = data?.targetDefaults || null;
  const weekStart = data?.weekStart;
  const weekEnd = data?.weekEnd;

  // Opt-in state for existing users until configured
  if (!featureEnabled) {
    return (
      <>
        <GlassCard
          className={`p-5 sm:p-6 bg-gradient-to-br from-white via-slate-50/80 to-indigo-50/40 border-slate-200/90 shadow-sm ${className}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Optional Feature
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  This Week — Calm Weekly Pace Tracking
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                  Daily weight fluctuates naturally. Track your <strong>weekly average weight</strong> against a steady target with gentle guardrails — nothing changes until you opt in.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                size="sm"
                className="min-h-[44px] px-4 text-xs font-extrabold"
                isLoading={enableFlagMutation.isPending}
                onClick={() => enableFlagMutation.mutate()}
              >
                <Sparkles className="w-3.5 h-3.5" /> Set Weekly Target
              </Button>
            </div>
          </div>
        </GlassCard>

        <SetWeeklyTargetSheet
          open={targetSheetOpen}
          onOpenChange={setTargetSheetOpen}
          weekStart={weekStart}
          currentTarget={target}
          targetDefaults={targetDefaults}
          currentWeightKg={progress.latestSingleWeight || profile?.currentWeight}
        />
      </>
    );
  }

  const weighInsLogged = progress.weighInsLogged ?? 0;
  const weighInsTarget = progress.weighInsTarget ?? 5;
  const ringPercent = Math.min(
    100,
    Math.round((weighInsLogged / Math.max(1, weighInsTarget)) * 100)
  );
  const ringSize = 84;
  const strokeW = 8;
  const radius = (ringSize - strokeW) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (ringPercent / 100) * circumference;

  const statusMeta = getStatusBadgeMeta(progress.status);
  const StatusIcon = statusMeta.Icon;

  const measMeta =
    CHECKIN_CHIP_STYLES[progress.measurementsStatus] || CHECKIN_CHIP_STYLES.due;
  const MeasIcon = measMeta.Icon;

  const photoMeta =
    CHECKIN_CHIP_STYLES[progress.photoStatus] || CHECKIN_CHIP_STYLES.due;
  const PhotoIcon = photoMeta.Icon;

  return (
    <>
      <GlassCard
        className={`p-5 sm:p-6 bg-white/95 border-slate-200/90 shadow-[0_8px_30px_rgba(15,23,42,0.05)] space-y-4 ${className}`}
      >
        {/* Top Row: Title, Week Range & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <Target className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  This Week
                </h2>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {formatShortDateRange(weekStart, weekEnd)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Weekly average smooths daily water & food noise
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                haptics.tick();
                setHistorySheetOpen(true);
              }}
              className="min-h-[44px] px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>History</span>
            </button>
            <button
              type="button"
              onClick={() => {
                haptics.tick();
                setTargetSheetOpen(true);
              }}
              className="min-h-[44px] px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{target ? "Edit Target" : "Set Target"}</span>
            </button>
          </div>
        </div>

        {/* Core Visual: Progress Ring + Weekly Average Headline + Target vs Actual */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Animated Weigh-In Progress Ring */}
            <div
              className="relative flex items-center justify-center shrink-0"
              style={{ width: ringSize, height: ringSize }}
              aria-label={`Weekly weigh-in progress: ${weighInsLogged} of ${weighInsTarget} days`}
            >
              <svg width={ringSize} height={ringSize} className="-rotate-90">
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth={strokeW}
                />
                <motion.circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-black text-slate-900 tabular-nums leading-none">
                  {weighInsLogged}/{weighInsTarget}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                  days
                </span>
              </div>
            </div>

            {/* Headline: Weekly Avg Weight (Primary) & Today Single-Day (Secondary) */}
            <div className="min-w-0 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Weekly Avg Weight
              </span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums tracking-tight">
                  {formatKgVal(progress.thisWeekAvgWeight, hideNumbers)}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.pillClass}`}
                >
                  <StatusIcon className={`w-3.5 h-3.5 ${statusMeta.iconClass}`} />
                  <span>{statusMeta.label}</span>
                </span>
              </div>

              <div className="text-xs text-slate-600 font-medium flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {target?.weightChangeKgPerWeek !== null &&
                target?.weightChangeKgPerWeek !== undefined ? (
                  <span className="font-bold text-slate-800 tabular-nums">
                    {formatKgVal(progress.actualChangeKg, hideNumbers, true)} / target{" "}
                    {formatKgVal(target.weightChangeKgPerWeek, hideNumbers, true)}
                  </span>
                ) : (
                  <span className="text-slate-500">No weekly pace set yet</span>
                )}

                {progress.latestSingleWeight !== null && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-400">
                      Latest day:{" "}
                      <strong className="text-slate-600 font-semibold">
                        {formatKgVal(progress.latestSingleWeight, hideNumbers)}
                      </strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Weigh-In Dots + Encouragement */}
          <div className="sm:text-right flex flex-col sm:items-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200/70">
            <div
              className="flex items-center gap-1.5"
              role="img"
              aria-label={`${weighInsLogged} of ${weighInsTarget} weigh-ins logged this week`}
            >
              {Array.from({ length: weighInsTarget }).map((_, idx) => {
                const filled = idx < weighInsLogged;
                return (
                  <span
                    key={idx}
                    className={`w-3 h-3 rounded-full transition-all ${
                      filled
                        ? "bg-indigo-600 shadow-xs"
                        : "bg-white border-2 border-slate-300"
                    }`}
                  />
                );
              })}
              <span className="text-[11px] font-bold text-slate-500 ml-1 tabular-nums">
                {weighInsLogged}/{weighInsTarget} weigh-ins
              </span>
            </div>

            {target?.waistChangeCm !== null && target?.waistChangeCm !== undefined && (
              <span className="text-[11px] font-bold text-slate-600 tabular-nums">
                Waist:{" "}
                {progress.waistActualChangeCm !== null
                  ? `${progress.waistActualChangeCm > 0 ? "+" : ""}${progress.waistActualChangeCm} cm`
                  : "— cm"}{" "}
                / target {target.waistChangeCm > 0 ? `+${target.waistChangeCm}` : target.waistChangeCm} cm
              </span>
            )}
          </div>
        </div>

        {/* Encouraging Neutral Guidance */}
        {progress.encouragingMessage && (
          <p className="text-xs text-slate-600 font-medium px-1">
            {progress.encouragingMessage}
          </p>
        )}

        {/* Bottom Check-in Chips & Quick Log CTA */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Tape Measurements Check-In Chip */}
            <Link
              to="/measurements"
              onClick={() => haptics.tick()}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${measMeta.classes}`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Measurements: {measMeta.label}</span>
              <MeasIcon className="w-3.5 h-3.5 opacity-80" />
            </Link>

            {/* Bi-weekly Photos Check-In Chip (shown when photoCheckins flag is enabled) */}
            {photoFeatureEnabled && (
              <Link
                to="/photos"
                onClick={() => haptics.tick()}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${photoMeta.classes}`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>
                  Photos: {progress.photoCompletedCount ?? 0}/3 {photoMeta.label}
                </span>
                <PhotoIcon className="w-3.5 h-3.5 opacity-80" />
              </Link>
            )}
          </div>

          <Link to="/weight" onClick={() => haptics.tick()}>
            <Button
              size="sm"
              variant={progress.todayLogged ? "secondary" : "primary"}
              className="min-h-[44px] px-4 text-xs font-extrabold"
            >
              {progress.todayLogged ? (
                <>
                  <Scale className="w-3.5 h-3.5" /> Today's Weight Logged
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Log Weight
                </>
              )}
            </Button>
          </Link>
        </div>
      </GlassCard>

      <SetWeeklyTargetSheet
        open={targetSheetOpen}
        onOpenChange={setTargetSheetOpen}
        weekStart={weekStart}
        currentTarget={target}
        targetDefaults={targetDefaults}
        currentWeightKg={progress.latestSingleWeight || profile?.currentWeight}
      />

      <WeeklyHistorySheet
        open={historySheetOpen}
        onOpenChange={setHistorySheetOpen}
        hideNumbersOverride={hideNumbers}
      />
    </>
  );
};

export default ThisWeekCard;

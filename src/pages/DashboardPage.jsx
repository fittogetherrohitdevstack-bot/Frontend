import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dietApi, progressApi, workoutApi, groupApi, weightApi, measurementApi } from "../api/endpoints";
import { useGroup } from "../context/GroupContext";
import { useAuth } from "../context/AuthContext";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { ProgressRing } from "../components/ui/ProgressRing";
import { Skeleton } from "../components/ui/Skeleton";
import { Avatar } from "../components/ui/Avatar";
import { Chip } from "../components/ui/Chip";
import { EmptyState } from "../components/ui/EmptyState";
import { AnimatedNumber } from "../motion/AnimatedNumber";
import { FadeUp } from "../motion";
import { MealSwipeCard } from "../components/dashboard/MealSwipeCard";
import { ThisWeekCard } from "../components/targets/ThisWeekCard";
import { DueTodayStrip } from "../components/reminders/DueTodayStrip";
import { haptics } from "../motion/Haptics";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  UtensilsCrossed,
  Droplets,
  Dumbbell,
  CheckCircle2,
  Users,
  Flame,
  ArrowRight,
  Plus,
  Trophy,
  Sparkles,
  Zap,
  Scale,
  Ruler,
} from "lucide-react";

export const DashboardPage = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const { activeGroup } = useGroup();
  const hideWeight = Boolean(profile?.hideWeightNumbers);
  const perfectDayCelebrated = useRef(false);

  // 1. Fetch individual dashboard summary
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["my-dashboard-summary"],
    queryFn: async () => {
      const res = await dietApi.getMyDashboard();
      return res.data?.data;
    },
    refetchInterval: 20000,
  });

  // 2. Fetch today's meal log snapshot
  const { data: mealLogData, isLoading: isMealLogLoading } = useQuery({
    queryKey: ["today-meal-log"],
    queryFn: async () => {
      const res = await dietApi.getOrCreateMealLog();
      return res.data?.data;
    },
  });

  // 3. Fetch group dashboard pulse
  const { data: groupPulse } = useQuery({
    queryKey: ["group-dashboard", activeGroup?._id],
    queryFn: async () => {
      if (!activeGroup?._id) return null;
      const res = await groupApi.getDashboard(activeGroup._id);
      return res.data?.data;
    },
    enabled: !!activeGroup?._id,
  });

  // 4. Fetch weight trend summary
  const { data: weightSummary } = useQuery({
    queryKey: ["weight-summary", "7d"],
    queryFn: async () => {
      const res = await weightApi.getWeightSummary("7d");
      return res.data?.data;
    },
  });

  // 5. Fetch measurements summary
  const { data: measurementSummary } = useQuery({
    queryKey: ["measurements-summary", "12w"],
    queryFn: async () => {
      const res = await measurementApi.getSummary("12w");
      return res.data?.data;
    },
  });

  // Meal status update mutation
  const mealStatusMutation = useMutation({
    mutationFn: async ({ mealId, status }) => {
      const logId = mealLogData?.mealLog?._id;
      if (!logId) throw new Error("No active meal log found");
      return dietApi.updateMealStatus(logId, { mealId, status });
    },
    onSuccess: (res, { mealId, status }) => {
      queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["today-meal-log"] });
      queryClient.invalidateQueries({ queryKey: ["group-dashboard"] });

      if (status === "eaten") {
        haptics.eaten();
        toast.success("Meal logged as eaten! 🔥", {
          action: {
            label: "Undo",
            onClick: () => mealStatusMutation.mutate({ mealId, status: "pending" }),
          },
          duration: 4000,
        });
      } else if (status === "skipped") {
        haptics.tick();
        toast("Meal marked as skipped", {
          action: {
            label: "Undo",
            onClick: () => mealStatusMutation.mutate({ mealId, status: "pending" }),
          },
        });
      }
    },
    onError: (err) => {
      haptics.warning();
      toast.error(err.response?.data?.message || "Failed to update meal status");
    },
  });

  // Quick add water mutation
  const waterMutation = useMutation({
    mutationFn: (amountMl) => progressApi.addWater({ amountMl }),
    onSuccess: (res, amount) => {
      haptics.goal();
      toast.success(`Hydrated! +${amount} ml logged 💧`);
      queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["group-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["today-water"] });

      const currentWater = summary?.water?.consumedMl || 0;
      const targetWater = summary?.water?.targetMl || 3000;
      if (currentWater + amount >= targetWater) {
        confetti({
          particleCount: 70,
          spread: 60,
          colors: ["#06B6D4", "#0284C7", "#10B981", "#84CC16"],
          origin: { y: 0.7 },
        });
      }
    },
  });

  // Quick mark workout attendance
  const workoutMutation = useMutation({
    mutationFn: (status) => workoutApi.markAttendance({ status }),
    onSuccess: (res, status) => {
      haptics.goal();
      toast.success(status === "completed" ? "Workout crushed! +30 points ⚡" : "Rest day logged");
      queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["group-dashboard"] });
    },
  });

  // Extract nutrition stats
  const nutrition = summary?.nutrition || {};
  const targets = nutrition.targets || { calories: 2200, protein: 140, carbs: 250, fats: 60 };
  const actual = nutrition.actual || { calories: 0, protein: 0, carbs: 0, fats: 0 };
  const water = summary?.water || { consumedMl: 0, targetMl: 3000, percent: 0 };
  const workout = summary?.workout;
  const streak = summary?.streak || 0;

  const meals = mealLogData?.mealLog?.meals || [];
  const eatenMealsCount = meals.filter((m) => m.status === "eaten").length;
  const totalMealsCount = meals.length;
  const isPerfectDay = totalMealsCount > 0 && eatenMealsCount === totalMealsCount;

  // Perfect day celebration effect
  useEffect(() => {
    if (isPerfectDay && !perfectDayCelebrated.current) {
      perfectDayCelebrated.current = true;
      haptics.goal();
      confetti({
        particleCount: 120,
        spread: 90,
        colors: ["#84CC16", "#7C3AED", "#06B6D4", "#EA580C", "#FFD700"],
        origin: { y: 0.5 },
      });
    }
  }, [isPerfectDay]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const userName = user?.name ? user.name.split(" ")[0] : "Athlete";

  if (isSummaryLoading && !summary) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-72 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* 1. HERO GREETING & STREAK HEADER */}
      <FadeUp>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-lime-700 flex items-center gap-1.5 bg-lime-100/70 px-2.5 py-0.5 rounded-full border border-lime-200">
                <Zap className="w-3.5 h-3.5 fill-lime-600 text-lime-600" /> Daily Performance
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              {getGreeting()},{" "}
              <span className="bg-gradient-to-r from-lime-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {userName}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Lock in your habits today. Consistency breeds dominance.
            </p>
          </div>

          {/* Quick Streak Flame Hero Card */}
          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-slate-200/90 px-4 py-2.5 rounded-2xl shadow-[0_2px_12px_rgba(15,23,42,0.05)] self-start sm:self-auto">
            <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shadow-xs">
              <Flame className="w-5 h-5 fill-orange-500 text-orange-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <AnimatedNumber
                  value={streak}
                  className="text-lg font-black text-slate-900"
                />
                <span className="text-xs font-bold text-orange-600">Days</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Active Streak
              </p>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* 2. FLAGSHIP HERO: TRIPLE ACTIVITY RING */}
      <FadeUp delay={0.1}>
        <GlassCard
          glow="lime"
          className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-b from-white/95 to-slate-50/90 border-slate-200/90 shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
        >
          {/* Subtle Ambient Pastel Bloom */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-lime-100/50 blur-[90px] pointer-events-none rounded-full" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            {/* The SVG Triple Ring */}
            <div className="w-full md:w-auto flex justify-center">
              <ProgressRing
                calories={{ current: actual.calories, target: targets.calories }}
                protein={{ current: actual.protein, target: targets.protein }}
                water={{ current: water.consumedMl, target: water.targetMl }}
                carbs={{ current: actual.carbs, target: targets.carbs }}
                fats={{ current: actual.fats, target: targets.fats }}
                size={260}
                strokeWidth={13}
                gap={5}
              />
            </div>

            {/* Quick Macro Legend & Targets */}
            <div className="flex-1 w-full space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Activity Fuel Rings
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Today's Progress</h3>
                </div>
                <Link
                  to="/tracker"
                  className="flex items-center gap-1.5 text-xs font-bold text-lime-700 hover:text-lime-800 bg-lime-100/80 hover:bg-lime-200/80 px-3 py-1.5 rounded-full border border-lime-300 transition-all shadow-xs"
                >
                  <span>Log Tracker</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Rings Legend Items */}
              <div className="space-y-2.5">
                {/* 1. Calories */}
                <div className="p-3 rounded-2xl bg-lime-50/60 border border-lime-200/80 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#84CC16] shadow-xs" />
                    <span className="text-xs font-bold text-slate-800">Calories Burned</span>
                  </div>
                  <div className="text-xs font-black text-slate-900">
                    <AnimatedNumber value={actual.calories} />
                    <span className="text-slate-500 font-normal"> / {targets.calories} kcal</span>
                  </div>
                </div>

                {/* 2. Protein */}
                <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-200/80 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#7C3AED] shadow-xs" />
                    <span className="text-xs font-bold text-slate-800">Protein Intake</span>
                  </div>
                  <div className="text-xs font-black text-slate-900">
                    <AnimatedNumber value={actual.protein} />
                    <span className="text-slate-500 font-normal"> / {targets.protein}g</span>
                  </div>
                </div>

                {/* 3. Water */}
                <div className="p-3 rounded-2xl bg-cyan-50/60 border border-cyan-200/80 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#06B6D4] shadow-xs" />
                    <span className="text-xs font-bold text-slate-800">Hydration</span>
                  </div>
                  <div className="text-xs font-black text-slate-900">
                    <AnimatedNumber value={water.consumedMl} />
                    <span className="text-slate-500 font-normal"> / {water.targetMl} ml</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </FadeUp>

      {/* 2A. SMART CHECK-INS DUE TODAY STRIP */}
      <FadeUp delay={0.11}>
        <DueTodayStrip />
      </FadeUp>

      {/* 2B. THIS WEEK TARGET & CHECK-IN OVERVIEW */}
      <FadeUp delay={0.12}>
        <ThisWeekCard />
      </FadeUp>

      {/* 3. TODAY'S MEALS: SWIPE-TO-COMPLETE CAROUSEL / LIST */}
      <FadeUp delay={0.15}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-lime-100 border border-lime-300 flex items-center justify-center text-lime-700 shadow-xs">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Today's Meals</h3>
                <span className="text-xs text-slate-500 font-medium">
                  Swipe right to mark eaten, swipe left to skip
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-lime-800 bg-lime-100 px-3 py-1 rounded-full border border-lime-300 shadow-xs">
                {eatenMealsCount} / {totalMealsCount} Done
              </span>
            </div>
          </div>

          {/* Perfect Day Banner */}
          <AnimatePresence>
            {isPerfectDay && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-3xl bg-gradient-to-r from-lime-100 via-emerald-50 to-teal-100 border border-lime-300 shadow-sm flex items-center justify-between backdrop-blur-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#84CC16] text-white flex items-center justify-center font-black shadow-md shadow-lime-500/30">
                    <Trophy className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Perfect Fuel Day Unlocked! ⚡
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">
                      100% meal target hit. Streak and bonus points applied!
                    </p>
                  </div>
                </div>
                <Sparkles className="w-6 h-6 text-lime-600 animate-spin" style={{ animationDuration: "8s" }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Meal Cards List */}
          {meals.length > 0 ? (
            <div className="space-y-3">
              {meals.map((meal) => (
                <MealSwipeCard
                  key={meal.mealId || meal._id}
                  meal={meal}
                  onStatusChange={(mealId, status) => {
                    mealStatusMutation.mutate({ mealId, status });
                  }}
                  isUpdating={mealStatusMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={UtensilsCrossed}
              title="No Meal Plan for Today"
              description="Activate a weekly diet plan to view and swipe your scheduled meals here."
              actionLabel="Go to Diet Planner"
              onAction={() => (window.location.href = "/diet")}
            />
          )}
        </div>
      </FadeUp>

      {/* 4. BENTO TILES ROW: WATER, WORKOUT, WEIGHT & MEASUREMENTS (Balanced 2x2 Bento Grid on Desktop) */}
      <FadeUp delay={0.2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Tile 1: Hydration Tile (Cool Cyan) */}
          <GlassCard glow="cyan" className="flex flex-col justify-between p-5 sm:p-6 h-full shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-cyan-100 border border-cyan-300 text-cyan-700 flex items-center justify-center shadow-xs shrink-0">
                    <Droplets className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight truncate">Hydration</h3>
                    <span className="text-xs text-slate-500 font-medium truncate block">Target: {water.targetMl} ml</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl font-black text-cyan-700 tabular-nums">{water.percent}%</span>
                </div>
              </div>

              {/* Liquid Progress Bar with Glow */}
              <div className="w-full h-3 rounded-full overflow-hidden bg-slate-100 p-0.5 border border-slate-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, water.percent)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#06B6D4] to-[#0284C7] rounded-full shadow-xs"
                />
              </div>

              <div className="flex items-baseline justify-between text-xs">
                <p className="text-slate-600 font-medium">
                  Logged <strong className="text-slate-900 font-extrabold">{water.consumedMl} ml</strong> of water today.
                </p>
                <span className="text-slate-400 font-bold text-[11px] shrink-0">
                  {Math.max(0, water.targetMl - water.consumedMl)} ml left
                </span>
              </div>
            </div>

            {/* Quick Add Chips */}
            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
              <Button
                size="sm"
                variant="cyan"
                className="flex-1 text-xs min-h-[42px] font-bold shadow-xs cursor-pointer"
                isLoading={waterMutation.isPending}
                onClick={() => waterMutation.mutate(250)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> +250 ml
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="flex-1 text-xs min-h-[42px] font-bold shadow-xs cursor-pointer"
                isLoading={waterMutation.isPending}
                onClick={() => waterMutation.mutate(500)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> +500 ml
              </Button>
              <Link
                to="/water"
                onClick={() => haptics.tick()}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-cyan-100 text-slate-700 hover:text-cyan-800 border border-slate-200 transition-colors shrink-0 shadow-xs cursor-pointer"
                title="Full Hydration Tracker"
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </GlassCard>

          {/* Tile 2: Workout Tile (Vivid Violet) */}
          <GlassCard glow="violet" className="flex flex-col justify-between p-5 sm:p-6 h-full shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-purple-100 border border-purple-300 text-purple-700 flex items-center justify-center shadow-xs shrink-0">
                    <Dumbbell className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight truncate">Today's Workout</h3>
                    <span className="text-xs text-slate-500 truncate block font-medium">
                      {workout ? workout.workoutName : "No active session"}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {workout?.status === "completed" ? (
                    <Chip variant="lime" active>
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </Chip>
                  ) : workout?.status === "rest" ? (
                    <Chip variant="violet" active>
                      Rest Day
                    </Chip>
                  ) : (
                    <Chip variant="orange">Pending</Chip>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {workout
                  ? `Routine: ${workout.workoutName} (${workout.durationMinutes} min planned). Log completion to earn +30 squad points!`
                  : "Honor your routine or log a planned rest day to protect your consistency streak."}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
              {workout?.status !== "completed" ? (
                <>
                  <Button
                    size="sm"
                    variant="violet"
                    className="flex-1 text-xs min-h-[42px] font-bold shadow-xs cursor-pointer"
                    isLoading={workoutMutation.isPending}
                    onClick={() => workoutMutation.mutate("completed")}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />
                    <span>Mark Done (+30 pts)</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs px-4 min-h-[42px] font-bold shrink-0 cursor-pointer"
                    isLoading={workoutMutation.isPending}
                    onClick={() => workoutMutation.mutate("rest")}
                  >
                    Rest Day
                  </Button>
                </>
              ) : (
                <Link to="/workouts" className="w-full">
                  <Button variant="secondary" size="sm" className="w-full text-xs min-h-[42px] font-bold shadow-xs cursor-pointer">
                    View Workout Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </GlassCard>

          {/* Tile 3: Daily Weight (Electric Lime) */}
          <GlassCard glow="lime" className="flex flex-col justify-between p-5 sm:p-6 h-full shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-lime-100 border border-lime-300 text-lime-700 flex items-center justify-center shadow-xs shrink-0">
                    <Scale className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight truncate">Daily Weight</h3>
                    <span className="text-xs text-slate-500 font-medium truncate block">
                      Target: {hideWeight ? "•••" : weightSummary?.targetWeight ? `${weightSummary.targetWeight} kg` : "--"}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {weightSummary?.todayLogged ? (
                    <Chip variant="lime" active>
                      <CheckCircle2 className="w-3 h-3" /> Logged
                    </Chip>
                  ) : (
                    <span className="text-xs text-purple-700 font-bold bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Weight Display (7d trend headline, single day secondary) */}
              <div className="my-2 flex items-baseline justify-between flex-wrap gap-2">
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                    {hideWeight
                      ? "•••"
                      : weightSummary?.stats?.movingAvg7d
                      ? `${weightSummary.stats.movingAvg7d} kg`
                      : weightSummary?.stats?.current
                      ? `${weightSummary.stats.current} kg`
                      : "--"}
                  </span>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    7d Trend · Latest day:{" "}
                    <strong className="text-slate-700">
                      {hideWeight
                        ? "•••"
                        : weightSummary?.stats?.current
                        ? `${weightSummary.stats.current} kg`
                        : "--"}
                    </strong>
                  </p>
                </div>

                <div className="text-right">
                  {weightSummary?.stats?.totalChange !== undefined &&
                    weightSummary?.stats?.totalChange !== null && (
                      <span className="text-xs font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                        {hideWeight
                          ? "•••"
                          : `${
                              weightSummary.stats.totalChange > 0
                                ? `+${weightSummary.stats.totalChange}`
                                : weightSummary.stats.totalChange
                            } kg total`}
                      </span>
                    )}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <Link to="/weight" onClick={() => haptics.tick()} className="w-full block">
                <Button variant="primary" size="sm" className="w-full text-xs font-bold shadow-md min-h-[42px] flex items-center justify-center cursor-pointer">
                  {weightSummary?.todayLogged ? "View Weight Analytics" : "Log Today's Weight"} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </GlassCard>

          {/* Tile 4: Body Measurements (Vivid Violet) */}
          <GlassCard glow="violet" className="flex flex-col justify-between p-5 sm:p-6 h-full shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-violet-100 border border-violet-300 text-violet-700 flex items-center justify-center shadow-xs shrink-0">
                    <Ruler className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight truncate">Measurements</h3>
                    <span className="text-xs text-slate-500 font-medium truncate block">
                      {measurementSummary?.consistency?.weeksLogged || 0} check-ins logged
                    </span>
                  </div>
                </div>

                <span className="text-xs text-violet-700 font-bold bg-violet-100 px-2.5 py-1 rounded-full border border-violet-200 shrink-0">
                  Weekly
                </span>
              </div>

              {/* Waist / Chest Display */}
              <div className="my-2 flex items-baseline justify-between flex-wrap gap-2">
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                    {measurementSummary?.summaryByPart?.waist?.current ? `${measurementSummary.summaryByPart.waist.current} cm` : "--"}
                  </span>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Waist · Chest: <strong className="text-violet-800">{measurementSummary?.summaryByPart?.chest?.current ? `${measurementSummary.summaryByPart.chest.current} cm` : "--"}</strong>
                  </p>
                </div>

                <div className="text-right">
                  {measurementSummary?.ratios?.waistToHip && (
                    <span className="text-xs font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                      W/H: {measurementSummary.ratios.waistToHip}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <Link to="/measurements" onClick={() => haptics.tick()} className="w-full block">
                <Button variant="secondary" size="sm" className="w-full text-xs font-bold shadow-xs min-h-[42px] flex items-center justify-center cursor-pointer">
                  Body Check-In & History <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </FadeUp>

      {/* 5. GROUP PULSE & CONSISTENCY TILE (Mobile-First Adaptive Layout) */}
      {groupPulse ? (
        <FadeUp delay={0.25}>
          <GlassCard glow="none" className="p-4 sm:p-6 bg-white/90">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-lime-50 border border-lime-200 flex items-center justify-center text-lime-700 shadow-xs shrink-0">
                  <Users className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight truncate">
                    {groupPulse.group?.name || "Squad Pulse"}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium block truncate">
                    {groupPulse.activeMembersCount} teammates active today
                  </span>
                </div>
              </div>

              <div className="self-start xs:self-auto shrink-0">
                <span className="text-xs font-black text-lime-800 bg-lime-100 px-3 py-1.5 rounded-full border border-lime-300 shadow-xs whitespace-nowrap inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
                  {groupPulse.groupConsistency}% Squad Consistency
                </span>
              </div>
            </div>

            {/* Teammate Activity Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-slate-100">
              {(groupPulse.members || []).map((m) => (
                <div
                  key={m.userId}
                  className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between hover:bg-slate-100/80 transition-all shadow-xs gap-2 min-h-[52px]"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <Avatar src={m.profileImage} name={m.name} size="sm" ringColor="lime" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{m.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">
                        Meals: {m.today.eatenMeals}/{m.today.totalMeals}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {m.today.workoutCompleted && (
                      <span className="w-2.5 h-2.5 rounded-full bg-lime-500 shadow-xs" title="Workout Completed" />
                    )}
                    <span className="text-xs font-black text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {m.today.mealCompletionRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <Link
                to="/group"
                onClick={() => haptics.tick()}
                className="text-xs text-lime-700 hover:text-lime-800 font-bold inline-flex items-center justify-center gap-1.5 transition-colors min-h-[44px] py-2 px-3 rounded-xl hover:bg-lime-50/80 w-full sm:w-auto"
              >
                View Full Squad Activity & Invite Code <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </GlassCard>
        </FadeUp>
      ) : (
        <FadeUp delay={0.25}>
          <GlassCard glow="lime" className="p-4 sm:p-6 bg-gradient-to-r from-lime-50/70 via-white to-emerald-50/70 border-lime-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#84CC16] to-[#10B981] flex items-center justify-center text-white shadow-md shadow-lime-500/20 shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Fitness is Better Together 🤝
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Join or create a squad to share meal streaks, compare progress, and earn bonuses!
                  </p>
                </div>
              </div>
              <Link to="/group" onClick={() => haptics.tick()} className="w-full sm:w-auto shrink-0">
                <Button size="sm" className="w-full sm:w-auto text-xs font-bold shadow-xs min-h-[42px]">
                  Join or Create Squad <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </GlassCard>
        </FadeUp>
      )}
    </div>
  );
};

export default DashboardPage;

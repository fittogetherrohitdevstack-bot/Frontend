import React from "react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import {
  Dumbbell,
  Play,
  CheckCircle2,
  Calendar,
  Flame,
  Clock,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Zap,
  ChevronRight,
  Plus,
  Trophy,
} from "lucide-react";
import { motion } from "motion/react";
import { haptics } from "../../motion/Haptics";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export const WorkoutDashboardTab = ({
  dashboardData,
  isLoading,
  onStartTodayWorkout,
  onResumeActiveWorkout,
  onMarkRestDay,
  onNavigateTab,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  const {
    hasActiveSession,
    activeSession,
    todaySession,
    activePlan,
    scheduledDay,
    weeklyCalendar = [],
    weeklyStats = {},
    streak = {},
    lastCompletedSession,
    recentWorkouts = [],
  } = dashboardData || {};

  const isTodayCompleted = todaySession?.status === "completed";
  const isTodayRest = todaySession?.status === "rest" || scheduledDay?.isRestDay;

  return (
    <div className="space-y-6">
      {/* 1. Unfinished / In-Progress Session Resume Banner */}
      {hasActiveSession && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
              <Dumbbell className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-200 block">
                Session In Progress
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {activeSession.workoutName || "Live Workout"}
              </h3>
              <p className="text-xs text-purple-100">
                You have an active session! Pick up right where you left off.
              </p>
            </div>
          </div>

          <Button
            size="md"
            onClick={() => {
              haptics.goal();
              onResumeActiveWorkout();
            }}
            className="bg-white text-purple-800 hover:bg-purple-50 font-black text-xs shadow-md min-h-[44px] shrink-0 justify-center"
          >
            <Play className="w-4 h-4 mr-1.5 fill-purple-800" /> Resume Workout
          </Button>
        </motion.div>
      )}

      {/* 2. Hero Today's Overview Card */}
      <GlassCard className="p-5 sm:p-7 bg-white/95 border-slate-200/90 shadow-sm relative overflow-hidden">
        {/* Soft radial glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
                {getGreeting()} 💪
              </span>

              {streak.current > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  {streak.current} Day Streak
                </span>
              )}

              {isTodayCompleted ? (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Workout Done (+30 pts)
                </span>
              ) : isTodayRest ? (
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  Rest & Recovery Day
                </span>
              ) : null}
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {scheduledDay?.dayName || todaySession?.workoutName || (activePlan ? "Scheduled Workout" : "Daily Workout")}
            </h1>

            {/* Target Muscles Chips */}
            {scheduledDay?.targetMuscles && scheduledDay.targetMuscles.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-slate-500 font-medium">Focus:</span>
                {scheduledDay.targetMuscles.map((muscle) => (
                  <span
                    key={muscle}
                    className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {muscle}
                  </span>
                ))}
              </div>
            )}

            {/* Active Plan reference */}
            <p className="text-xs text-slate-500 font-medium">
              Plan:{" "}
              <strong className="text-slate-800">
                {activePlan ? activePlan.name : "No active plan selected"}
              </strong>
            </p>
          </div>

          {/* Today CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {!hasActiveSession && (
              <Button
                size="lg"
                variant="primary"
                onClick={() => {
                  haptics.goal();
                  onStartTodayWorkout(scheduledDay);
                }}
                className="font-black text-sm min-h-[48px] shadow-lg shadow-purple-600/20 justify-center"
              >
                <Play className="w-4 h-4 mr-2 fill-current" />
                {isTodayCompleted ? "Start Another Workout" : "Start Workout"}
              </Button>
            )}

            {!isTodayCompleted && !isTodayRest && (
              <Button
                size="md"
                variant="secondary"
                onClick={() => {
                  haptics.tick();
                  onMarkRestDay();
                }}
                className="text-xs font-bold min-h-[44px] justify-center"
              >
                Mark as Rest Day
              </Button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* 3. Weekly 7-Day Activity Calendar Strip */}
      <GlassCard className="p-4 sm:p-5 bg-white/95 border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Weekly Activity Calendar
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {weeklyStats.completedWorkouts || 0} of {weeklyStats.weeklyGoal || 4} days hit (
            {weeklyStats.completionPercentage || 0}%)
          </span>
        </div>

        {/* 7 Day Pills */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weeklyCalendar.map((day) => {
            const isCompleted = day.status === "completed";
            const isRest = day.status === "rest";
            const isMissed = day.status === "missed";
            const isToday = day.isToday;

            return (
              <div
                key={day.date}
                className={`p-2.5 rounded-2xl text-center border transition-all ${
                  isToday
                    ? "ring-2 ring-purple-500 border-purple-300"
                    : "border-slate-200"
                } ${
                  isCompleted
                    ? "bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs"
                    : isRest
                    ? "bg-slate-50 text-slate-500"
                    : isMissed
                    ? "bg-amber-50/60 text-amber-800 border-amber-200"
                    : "bg-white text-slate-700"
                }`}
              >
                <span className="text-[10px] font-black uppercase block text-slate-400">
                  {day.dayLabel}
                </span>
                <span className="text-xs font-extrabold block my-1">
                  {day.date.split("-")[2]}
                </span>

                <div className="flex justify-center mt-0.5">
                  {isCompleted ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  ) : isRest ? (
                    <span className="text-[10px] font-bold text-slate-400">Rest</span>
                  ) : isMissed ? (
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* 4. Weekly Statistics Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassCard className="p-4 bg-white/95 border-slate-200">
          <TrendingUp className="w-4 h-4 text-purple-600 mb-1" />
          <span className="text-[10px] font-black uppercase text-slate-400 block">Weekly Volume</span>
          <span className="text-lg font-black text-slate-900">
            {weeklyStats.totalVolumeKg || 0} kg
          </span>
        </GlassCard>

        <GlassCard className="p-4 bg-white/95 border-slate-200">
          <Clock className="w-4 h-4 text-lime-600 mb-1" />
          <span className="text-[10px] font-black uppercase text-slate-400 block">
            Workout Time
          </span>
          <span className="text-lg font-black text-slate-900">
            {weeklyStats.totalDurationMinutes || 0} mins
          </span>
        </GlassCard>

        <GlassCard className="p-4 bg-white/95 border-slate-200">
          <Flame className="w-4 h-4 text-amber-500 mb-1" />
          <span className="text-[10px] font-black uppercase text-slate-400 block">
            Est. Calories
          </span>
          <span className="text-lg font-black text-slate-900">
            ~{weeklyStats.estimatedCaloriesBurned || 0}
          </span>
        </GlassCard>

        <GlassCard className="p-4 bg-white/95 border-slate-200">
          <Trophy className="w-4 h-4 text-cyan-600 mb-1" />
          <span className="text-[10px] font-black uppercase text-slate-400 block">Goal Progress</span>
          <span className="text-lg font-black text-slate-900">
            {weeklyStats.completedWorkouts || 0} / {weeklyStats.weeklyGoal || 4}
          </span>
        </GlassCard>
      </div>

      {/* 5. Quick Access Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          onClick={() => {
            haptics.tick();
            onNavigateTab("plans");
          }}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Calendar className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Workout Plans & Splits</h4>
              <p className="text-xs text-slate-500">7 built-in templates & custom plan builder</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        <div
          onClick={() => {
            haptics.tick();
            onNavigateTab("exercises");
          }}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Exercise Library</h4>
              <p className="text-xs text-slate-500">50+ exercises with form cues & alternatives</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* 6. Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Recent Workout Sessions
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab("history")}
              className="text-xs font-bold text-purple-700 hover:underline cursor-pointer"
            >
              View Full History →
            </button>
          </div>

          <div className="space-y-2">
            {recentWorkouts.map((w) => (
              <div
                key={w._id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      {w.workoutName || "Workout"}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {w.date} • {w.durationMinutes || 0} mins • {w.totalVolumeKg || 0} kg
                    </span>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                  Completed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutDashboardTab;

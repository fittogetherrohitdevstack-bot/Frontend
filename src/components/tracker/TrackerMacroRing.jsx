import React from "react";
import { motion } from "framer-motion";
import { Flame, CheckCheck, TrendingUp, Sparkles, Award } from "lucide-react";
import { AnimatedNumber } from "../../motion/AnimatedNumber";
import { GlassCard } from "../ui/GlassCard";

const MACRO_DETAILS = [
  {
    key: "protein",
    label: "Protein",
    fallback: 140,
    gradient: "from-violet-600 to-indigo-500",
    bgClass: "bg-violet-500/10 dark:bg-violet-500/20",
    textClass: "text-violet-700 dark:text-violet-400",
    barColor: "bg-gradient-to-r from-violet-600 to-indigo-500",
    unit: "g",
  },
  {
    key: "carbs",
    label: "Carbs",
    fallback: 250,
    gradient: "from-amber-500 to-orange-400",
    bgClass: "bg-amber-500/10 dark:bg-amber-500/20",
    textClass: "text-amber-700 dark:text-amber-400",
    barColor: "bg-gradient-to-r from-amber-500 to-orange-400",
    unit: "g",
  },
  {
    key: "fats",
    label: "Fats",
    fallback: 60,
    gradient: "from-rose-500 to-pink-500",
    bgClass: "bg-rose-500/10 dark:bg-rose-500/20",
    textClass: "text-rose-700 dark:text-rose-400",
    barColor: "bg-gradient-to-r from-rose-500 to-pink-500",
    unit: "g",
  },
];

export const TrackerMacroRing = ({
  consumedTotals = { calories: 0, protein: 0, carbs: 0, fats: 0 },
  plannedTotals = { calories: 2200, protein: 140, carbs: 250, fats: 60 },
  itemsCompleted = 0,
  totalItems = 0,
  completionPercentage = 0,
  streakDays = 0,
}) => {
  const targetCalories = plannedTotals?.calories || 2200;
  const consumedCalories = Math.round(consumedTotals?.calories || 0);
  const remainingCalories = Math.max(0, targetCalories - consumedCalories);
  const calPercent = targetCalories > 0 ? Math.min(100, Math.round((consumedCalories / targetCalories) * 100)) : 0;
  const isGoalReached = targetCalories > 0 && consumedCalories >= targetCalories * 0.95;

  // SVG circular ring calculation (radius 52)
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (calPercent / 100) * circumference;

  return (
    <GlassCard className="relative overflow-hidden p-4 sm:p-6 bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
      {/* Background ambient decorative glow */}
      <div
        className={`absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isGoalReached ? "bg-lime-500/15" : "bg-violet-500/10"
        }`}
      />

      {/* Top Header: Title, Streak and Completion badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-black text-slate-800 dark:text-slate-200">
            <TrendingUp className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />
            <span>Today's Nutrition</span>
          </div>

          {streakDays > 0 && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 text-amber-800 dark:text-amber-300 text-xs font-black"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{streakDays}d Streak</span>
            </motion.div>
          )}
        </div>

        {/* Eaten items pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-50 dark:bg-lime-950/50 border border-lime-300/80 dark:border-lime-700 text-lime-900 dark:text-lime-300 text-xs font-black tabular-nums">
          <CheckCheck className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />
          <span>
            {itemsCompleted}/{totalItems} items ({completionPercentage}%)
          </span>
        </div>
      </div>

      {/* Core Calorie Ring + Macro Split Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center pt-1">
        {/* Left Column: Interactive Circular Calorie Meter */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
              {/* Background track */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="text-slate-200 dark:text-slate-700 stroke-current"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Animated Progress Ring */}
              <motion.circle
                cx="60"
                cy="60"
                r={radius}
                stroke={isGoalReached ? "#84CC16" : "#7C5CFF"}
                strokeWidth="10"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500">
                Calories
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                <AnimatedNumber value={consumedCalories} />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                / {targetCalories} kcal
              </span>
            </div>
          </div>

          {/* Calorie Status Subtext */}
          <div className="mt-2 text-center">
            {isGoalReached ? (
              <span className="inline-flex items-center gap-1 text-xs font-black text-lime-700 dark:text-lime-400 bg-lime-100 dark:bg-lime-900/50 px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" /> Target Achieved!
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                <span className="text-violet-600 dark:text-violet-400 font-black">
                  {remainingCalories} kcal
                </span>{" "}
                remaining
              </span>
            )}
          </div>
        </div>

        {/* Right Column: 3-Macro Bars with Animated Meters */}
        <div className="md:col-span-7 space-y-3">
          {MACRO_DETAILS.map((macro) => {
            const consumed = Math.round(consumedTotals[macro.key] || 0);
            const planned = Math.round(plannedTotals[macro.key] || macro.fallback);
            const pct = planned > 0 ? Math.min(100, Math.round((consumed / planned) * 100)) : 0;
            const remaining = Math.max(0, planned - consumed);

            return (
              <div
                key={macro.key}
                className="p-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-black">
                  <span className={`${macro.textClass} flex items-center gap-1.5`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${macro.barColor}`} />
                    {macro.label}
                  </span>
                  <div className="text-slate-900 dark:text-white tabular-nums flex items-baseline gap-1">
                    <span className="font-black text-sm">
                      <AnimatedNumber value={consumed} />
                    </span>
                    <span className="text-slate-400 font-semibold">/{planned}{macro.unit}</span>
                    <span className="text-[10px] font-bold text-slate-400 ml-1">
                      ({pct}%)
                    </span>
                  </div>
                </div>

                {/* Progress track */}
                <div className="relative w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${macro.barColor}`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  <span>
                    {remaining > 0 ? `${remaining}g left to hit goal` : "Goal crushed! 🔥"}
                  </span>
                  <span className="tabular-nums font-bold">
                    {Math.round(consumed * (macro.key === "fats" ? 9 : 4))} kcal
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
};

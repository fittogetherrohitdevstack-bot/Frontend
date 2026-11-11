import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { weightApi, measurementApi, mealChartApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { getLocalDateString } from "../utils/date";
import { ThisWeekCard } from "../components/targets/ThisWeekCard";
import { DueTodayStrip } from "../components/reminders/DueTodayStrip";
import { WeeklyHistoryContent } from "../components/targets/WeeklyHistoryView";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import {
  TrendingUp,
  Scale,
  Ruler,
  UtensilsCrossed,
  Eye,
  EyeOff,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Activity,
  Layers,
  Percent,
  Camera,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { motion } from "motion/react";
import { haptics } from "../motion/Haptics";

export const ProgressPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [hideNumbers, setHideNumbers] = useState(Boolean(profile?.hideWeightNumbers));
  const isHidden = Boolean(hideNumbers || profile?.hideWeightNumbers);
  const todayLocalDate = getLocalDateString(new Date(), user?.timezone);

  // Queries for the three pillars: Weight, Measurements, Diet
  const { data: weightSummaryRes, isLoading: isWeightLoading } = useQuery({
    queryKey: ["weight-summary", "30d"],
    queryFn: async () => {
      const res = await weightApi.getWeightSummary("30d");
      return res.data?.data;
    },
  });

  const { data: measureSummaryRes, isLoading: isMeasureLoading } = useQuery({
    queryKey: ["measurements-summary", "12w"],
    queryFn: async () => {
      const res = await measurementApi.getSummary("12w");
      return res.data?.data;
    },
  });

  const { data: dietSummaryRes, isLoading: isDietLoading } = useQuery({
    queryKey: ["meal-summary", "30d"],
    queryFn: async () => {
      const res = await mealChartApi.getSummary("30d");
      return res.data?.data;
    },
  });

  const { data: todayDietRes } = useQuery({
    queryKey: ["meal-day-chart", todayLocalDate],
    queryFn: async () => {
      const res = await mealChartApi.getDayChart(todayLocalDate);
      return res.data?.data;
    },
  });

  const weightSummary = weightSummaryRes || {};
  const measureSummary = measureSummaryRes || {};
  const dietSummary = dietSummaryRes || {};
  const todayDiet = todayDietRes || {};

  // Combined Chart: Weekly Average Calories vs Weekly Average Weight
  const combinedChartData = useMemo(() => {
    const weeklyWeights = weightSummary.weeklyAverages || [];
    const weeklyDiets = dietSummary.weeklyAverages || [];

    // Map by weekStart
    const map = new Map();
    weeklyWeights.forEach((w) => {
      map.set(w.weekStart, {
        weekStart: w.weekStart,
        label: w.weekStart.slice(5),
        weight: w.averageWeight,
        calories: null,
      });
    });

    weeklyDiets.forEach((d) => {
      const existing = map.get(d.weekStart) || {
        weekStart: d.weekStart,
        label: d.weekStart.slice(5),
        weight: null,
      };
      existing.calories = d.averageCalories;
      map.set(d.weekStart, existing);
    });

    return Array.from(map.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  }, [weightSummary.weeklyAverages, dietSummary.weeklyAverages]);

  const mask = (val, suffix = "") => {
    if (isHidden) return "•••";
    if (val === undefined || val === null) return "--";
    return `${val}${suffix}`;
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] pb-28 pt-4 px-3 sm:px-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                My Progress Dashboard
              </h1>
              <p className="text-xs text-gray-500">
                Integrated body composition, weight trend, and nutritional compliance
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setHideNumbers(!hideNumbers);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200/80 text-xs font-semibold text-gray-600 hover:text-gray-900 shadow-sm transition-all min-h-[44px]"
          >
            {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isHidden ? "Show Numbers" : "Privacy Mode"}</span>
          </button>
        </div>
      </div>

      {/* Smart Check-Ins Due Today Strip */}
      <DueTodayStrip />

      {/* Quick Action Floating Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button
          onClick={() => navigate("/weight")}
          className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200/90 text-xs font-bold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 min-h-[44px]"
        >
          <Scale className="w-4 h-4 text-lime-600" />
          <span>Log Weight</span>
        </Button>

        <Button
          onClick={() => navigate("/measurements")}
          className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200/90 text-xs font-bold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 min-h-[44px]"
        >
          <Ruler className="w-4 h-4 text-violet-600" />
          <span>Weekly Check-in</span>
        </Button>

        <Button
          onClick={() => navigate("/photos")}
          className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200/90 text-xs font-bold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 min-h-[44px]"
        >
          <Camera className="w-4 h-4 text-sky-600" />
          <span>Bi-Weekly Photos</span>
        </Button>

        <Button
          onClick={() => navigate("/tracker")}
          className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200/90 text-xs font-bold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 min-h-[44px]"
        >
          <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
          <span>Diet Tracker</span>
        </Button>
      </div>

      {/* Weekly Target & Pace Overview ("This Week" card) */}
      <ThisWeekCard forceHideNumbers={isHidden} />

      {/* Bento Grid: 3 Pillars (Weight, Measurements, Diet) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Daily Weight */}
        <GlassCard
          onClick={() => navigate("/weight")}
          className="p-4 sm:p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm hover:border-lime-500/50 transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-lime-600" />
              <span>Weight Trend</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          </div>

          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              7-Day Weekly Avg
            </span>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-0.5">
              {mask(weightSummary.sevenDayMovingAverage, " kg")}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Latest Single Day</span>
            <span className="font-bold text-gray-900">
              {mask(weightSummary.currentWeight, " kg")}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Change This Week</span>
            <span
              className={`font-bold ${
                weightSummary.changeLast7Days !== 0
                  ? weightSummary.changeLast7Days < 0
                    ? "text-emerald-600"
                    : "text-violet-600"
                  : "text-gray-400"
              }`}
            >
              {mask(
                weightSummary.changeLast7Days !== undefined
                  ? `${weightSummary.changeLast7Days > 0 ? "+" : ""}${weightSummary.changeLast7Days} kg`
                  : "--"
              )}
            </span>
          </div>
        </GlassCard>

        {/* Pillar 2: Weekly Measurements */}
        <GlassCard
          onClick={() => navigate("/measurements")}
          className="p-4 sm:p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm hover:border-violet-500/50 transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-violet-600" />
              <span>Body Circumference</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          </div>

          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Weekly Check-in
            </span>
            <div className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-600" />
              <span>
                {measureSummary.lastEntry
                  ? `Last: ${measureSummary.lastEntry.date}`
                  : "Needs first check-in"}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Waist / Chest</span>
            <span className="font-bold text-gray-900">
              {mask(measureSummary.summaryByPart?.waist?.current, " cm")} /{" "}
              {mask(measureSummary.summaryByPart?.chest?.current, " cm")}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Waist-to-Hip Ratio</span>
            <span className="font-bold text-violet-600">
              {mask(measureSummary.ratios?.waistToHip)}
            </span>
          </div>
        </GlassCard>

        {/* Pillar 3: Daily Diet */}
        <GlassCard
          onClick={() => navigate("/tracker")}
          className="p-4 sm:p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm hover:border-emerald-500/50 transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
              <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
              <span>Today's Diet</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          </div>

          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Consumed Today
            </span>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-0.5">
              {mask(todayDiet.consumedTotals?.calories, " kcal")}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Completion</span>
            <span className="font-bold text-emerald-600">
              {mask(todayDiet.completionPercentage, "% eaten")}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Adherence Streak</span>
            <span className="font-bold text-amber-600 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>{mask(dietSummary.summary?.currentStreak, " days")}</span>
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Combined Chart: Weekly Calories vs Weekly Weight Trend */}
      <GlassCard className="p-4 sm:p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              Nutrition vs Bodyweight Correlation
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              Weekly Averages
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Compare average calorie intake (bars) against weight movement (line) to observe your body's energy balance
          </p>
        </div>

        <div className="h-72 w-full pt-2">
          {combinedChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={combinedChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickLine={false}
                />
                {/* Left Axis: Calories */}
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickLine={false}
                  domain={[0, "auto"]}
                />
                {/* Right Axis: Weight */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickLine={false}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs space-y-1">
                          <div className="font-bold text-gray-900 border-b pb-1 mb-1">{label}</div>
                          {payload.map((entry) => (
                            <div
                              key={entry.dataKey}
                              className="flex items-center justify-between gap-4"
                            >
                              <span className="font-medium text-gray-600">{entry.name}:</span>
                              <span className="font-bold text-gray-900">
                                {isHidden && entry.dataKey !== "calories" ? "•••" : entry.value}{" "}
                                {entry.dataKey === "calories" ? "kcal" : "kg"}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar
                  yAxisId="left"
                  dataKey="calories"
                  name="Avg Calories"
                  fill="#84CC16"
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="weight"
                  name="Avg Weight"
                  stroke="#7C5CFF"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#7C5CFF" }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
              <TrendingUp className="w-8 h-8 opacity-40 text-emerald-500" />
              <p className="text-xs">
                Log weight and diet across weeks to visualize your energy-balance correlation
              </p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* 12-Week Targets vs Actual History */}
      <WeeklyHistoryContent weeksCount={12} hideNumbersOverride={isHidden} hideWhenDisabled />
    </div>
  );
};

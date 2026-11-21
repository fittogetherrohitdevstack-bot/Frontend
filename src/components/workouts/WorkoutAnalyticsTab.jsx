import React from "react";
import { useQuery } from "@tanstack/react-query";
import { workoutApi } from "../../api/endpoints";
import { GlassCard } from "../ui/GlassCard";
import { Skeleton } from "../ui/Skeleton";
import { MuscleBodyMap } from "./MuscleBodyMap";
import {
  TrendingUp,
  BarChart3,
  Dumbbell,
  Clock,
  Layers,
  Sparkles,
  Flame,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export const WorkoutAnalyticsTab = () => {
  // 1. Fetch Analytics data (volume trends, frequency, summary)
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["workout-analytics"],
    queryFn: async () => {
      const res = await workoutApi.getAnalytics();
      return res.data?.data;
    },
  });

  // 2. Fetch Muscle Map data
  const { data: muscleMapData, isLoading: isLoadingMap } = useQuery({
    queryKey: ["workout-muscle-map"],
    queryFn: async () => {
      const res = await workoutApi.getMuscleMap();
      return res.data?.data?.muscleMap || [];
    },
  });

  if (isLoadingAnalytics || isLoadingMap) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  const summary = analyticsData?.summary || {};
  const volumeTrend = analyticsData?.volumeTrend || [];
  const muscleBreakdown = analyticsData?.muscleBreakdown || [];

  return (
    <div className="space-y-6">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassCard className="p-4 bg-white/95 border-slate-200">
          <Dumbbell className="w-5 h-5 text-purple-600 mb-1" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Workouts Logged
          </span>
          <span className="text-xl font-black text-slate-900">{summary.totalWorkouts || 0}</span>
        </GlassCard>

        <GlassCard className="p-4 bg-white/95 border-slate-200">
          <TrendingUp className="w-5 h-5 text-lime-600 mb-1" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Total Volume
          </span>
          <span className="text-xl font-black text-slate-900">{summary.totalVolumeKg || 0} kg</span>
        </GlassCard>

        <GlassCard className="p-4 bg-white/95 border-slate-200">
          <Clock className="w-5 h-5 text-amber-600 mb-1" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Avg Duration
          </span>
          <span className="text-xl font-black text-slate-900">
            {summary.avgDurationMinutes || 0} mins
          </span>
        </GlassCard>

        <GlassCard className="p-4 bg-white/95 border-slate-200">
          <Layers className="w-5 h-5 text-cyan-600 mb-1" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Total Duration
          </span>
          <span className="text-xl font-black text-slate-900">
            {summary.totalDurationMinutes || 0} mins
          </span>
        </GlassCard>
      </div>

      {/* Interactive Muscle Body Map (Front & Back) */}
      <MuscleBodyMap muscleMapData={muscleMapData} />

      {/* Weekly Training Volume Chart */}
      <GlassCard className="p-4 sm:p-6 bg-white/95 border-slate-200 space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-purple-600" /> Weekly Training Volume Progression (kg)
          </h3>
          <p className="text-xs text-slate-500">
            Total kilograms lifted per calendar week to track progressive overload
          </p>
        </div>

        {volumeTrend.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            Complete workouts to generate your weekly volume progression chart.
          </p>
        ) : (
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84CC16" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#84CC16" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#E2E8F0" }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}kg`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val) => [`${val} kg`, "Volume"]}
                  labelFormatter={(lbl) => `Week of ${lbl}`}
                />
                <Area
                  type="monotone"
                  dataKey="volumeKg"
                  stroke="#84CC16"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#volumeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>

      {/* Muscle Group Frequency Breakdown */}
      {muscleBreakdown.length > 0 && (
        <GlassCard className="p-4 sm:p-6 bg-white/95 border-slate-200 space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-purple-600" /> Muscle Group Training Frequency
            </h3>
            <p className="text-xs text-slate-500">
              Total number of sessions targeting each muscle group
            </p>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={muscleBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="muscle"
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#E2E8F0" }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default WorkoutAnalyticsTab;

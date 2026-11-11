import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { weeklyTargetApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { Sheet } from "../ui/Sheet";
import { Skeleton } from "../ui/Skeleton";
import { GlassCard } from "../ui/GlassCard";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from "recharts";
import {
  CheckCircle2,
  Compass,
  Clock,
  Sparkles,
  Calendar,
  Ruler,
} from "lucide-react";
import { formatShortDateRange } from "../../utils/date";

export const getStatusBadgeMeta = (status) => {
  switch (status) {
    case "on_track":
      return {
        label: "On track",
        Icon: CheckCircle2,
        pillClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
        iconClass: "text-indigo-600",
      };
    case "ahead":
      return {
        label: "Faster pace",
        Icon: Compass,
        pillClass: "bg-sky-50 text-sky-800 border-sky-200",
        iconClass: "text-sky-600",
      };
    case "behind":
      return {
        label: "Steadier pace",
        Icon: Clock,
        pillClass: "bg-stone-100 text-stone-700 border-stone-200",
        iconClass: "text-stone-600",
      };
    default:
      return {
        label: "Building data",
        Icon: Sparkles,
        pillClass: "bg-slate-100 text-slate-600 border-slate-200",
        iconClass: "text-slate-500",
      };
  }
};

const formatDelta = (val, hidden = false, unit = "kg") => {
  if (hidden) return "•••";
  if (val === null || val === undefined) return "—";
  const prefix = val > 0 ? "+" : val < 0 ? "−" : "";
  return `${prefix}${Math.abs(val).toFixed(2).replace(/\.00$/, ".0")} ${unit}`;
};

export const WeeklyHistoryContent = ({
  weeksCount = 12,
  hideNumbersOverride = false,
  hideWhenDisabled = false,
}) => {
  const { profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["weekly-targets-history", weeksCount],
    queryFn: async () => {
      const res = await weeklyTargetApi.getHistory(weeksCount);
      return res.data?.data;
    },
  });

  const hideNumbers = Boolean(
    hideNumbersOverride || profile?.hideWeightNumbers || data?.hideWeightNumbers
  );

  const weeks = data?.weeks || [];

  const chartData = useMemo(() => {
    return weeks.map((w) => ({
      label: w.label,
      weekStart: w.weekStart,
      target: w.targetChangeKg,
      actual: w.actualChangeKg,
      weighInsLogged: w.weighInsLogged,
    }));
  }, [weeks]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (hideWhenDisabled && data && data.enabled === false) {
    return null;
  }

  return (
    <div className="space-y-5">
      {/* Neutral Bar Chart: Target vs Actual */}
      <GlassCard className="p-4 sm:p-5 bg-white/95 border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              Target vs Actual Weekly Change
            </h3>
            <p className="text-xs text-slate-500">
              Calm week-over-week comparison using weekly average weights
            </p>
          </div>
          {data?.summary && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {data.summary.weeksWithData} / {data.summary.totalWeeks} weeks logged
            </span>
          )}
        </div>

        <div className="h-60 w-full pt-1">
          {chartData.some((d) => d.target !== null || d.actual !== null) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#64748B" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748B" }}
                  tickLine={false}
                  tickFormatter={(v) => (hideNumbers ? "••" : `${v}`)}
                />
                <ReferenceLine y={0} stroke="#CBD5E1" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-lg text-xs space-y-1">
                        <div className="font-bold text-slate-900 border-b border-slate-100 pb-1">
                          Week of {row.weekStart}
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Target Pace:</span>
                          <span className="font-bold text-slate-800">
                            {formatDelta(row.target, hideNumbers)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-indigo-700">Actual Change:</span>
                          <span className="font-bold text-indigo-900">
                            {formatDelta(row.actual, hideNumbers)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {row.weighInsLogged} weigh-ins logged
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                <Bar
                  dataKey="target"
                  name="Target (kg/wk)"
                  fill="#94A3B8"
                  radius={[4, 4, 4, 4]}
                />
                <Bar
                  dataKey="actual"
                  name="Actual Avg Change (kg)"
                  fill="#6366F1"
                  radius={[4, 4, 4, 4]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
              <Calendar className="w-7 h-7 opacity-40" />
              <p className="text-xs max-w-xs">
                Log weigh-ins across two consecutive weeks and set a weekly target to see your trend chart.
              </p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Week-by-Week List (Newest First) */}
      <div className="space-y-2.5">
        {[...weeks].reverse().map((w) => {
          const meta = getStatusBadgeMeta(w.status);
          const StatusIcon = meta.Icon;
          return (
            <div
              key={w.weekStart}
              className="p-3.5 sm:p-4 rounded-2xl bg-white/95 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                    {formatShortDateRange(w.weekStart, w.weekEnd)}
                  </span>
                  {w.isCurrentWeek && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime-100 text-lime-800 border border-lime-200">
                      This Week
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${meta.pillClass}`}
                  >
                    <StatusIcon className={`w-3 h-3 ${meta.iconClass}`} />
                    <span>{meta.label}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>
                    Avg: <strong className="text-slate-800">{hideNumbers ? "•••" : w.avgWeightKg ? `${w.avgWeightKg} kg` : "—"}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Weigh-ins: <strong className="text-slate-800">{w.weighInsLogged}/{w.weighInsTarget}</strong>
                  </span>
                  {w.measurementsDone && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                        <Ruler className="w-3 h-3 text-violet-600" /> Tape done
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-xs font-extrabold text-slate-900 tabular-nums">
                  {formatDelta(w.actualChangeKg, hideNumbers)}
                  <span className="text-slate-400 font-medium">
                    {" "}/ target {formatDelta(w.targetChangeKg, hideNumbers)}
                  </span>
                </div>
                {w.source && (
                  <span className="text-[10px] font-semibold text-slate-400 capitalize">
                    {w.source.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const WeeklyHistorySheet = ({ open, onOpenChange, hideNumbersOverride = false }) => {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="12-Week Target History"
      description="Monday–Sunday weekly average pace vs targets"
    >
      <div className="pt-1 pb-6">
        <WeeklyHistoryContent weeksCount={12} hideNumbersOverride={hideNumbersOverride} />
      </div>
    </Sheet>
  );
};

export default WeeklyHistorySheet;

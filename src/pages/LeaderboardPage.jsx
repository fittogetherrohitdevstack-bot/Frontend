import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { groupApi } from "../api/endpoints";
import { useGroup } from "../context/GroupContext";
import { GlassCard } from "../components/ui/GlassCard";
import { Skeleton } from "../components/ui/Skeleton";
import { Avatar } from "../components/ui/Avatar";
import {
  Trophy,
  Flame,
  UtensilsCrossed,
  Dumbbell,
  Droplets,
  Medal,
  Crown,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { haptics } from "../motion/Haptics";
import AnimatedNumber from "../motion/AnimatedNumber";

export const LeaderboardPage = () => {
  const { activeGroup } = useGroup();
  const [period, setPeriod] = useState("week"); // week, month, all

  const { data: boardResponse, isLoading } = useQuery({
    queryKey: ["group-leaderboard", activeGroup?._id, period],
    queryFn: async () => {
      if (!activeGroup?._id) return { leaderboard: [], weeklyStakes: null };
      const res = await groupApi.getLeaderboard(activeGroup._id, period);
      return res.data?.data || { leaderboard: [], weeklyStakes: null };
    },
    enabled: !!activeGroup?._id,
    refetchOnMount: "always",
  });

  const leaderboardData = boardResponse?.leaderboard || [];
  const weeklyStakes = boardResponse?.weeklyStakes;

  if (!activeGroup) {
    return (
      <GlassCard className="text-center py-12 px-6 max-w-md mx-auto bg-white/95 border-slate-200 mt-6 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Join a squad to view rankings</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4 leading-relaxed">
          Leaderboards show consistency points across your fitness group.
        </p>
      </GlassCard>
    );
  }

  const top3 = (leaderboardData || []).slice(0, 3);
  const theRest = (leaderboardData || []).slice(3);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider border border-amber-300">
              <Trophy className="w-3.5 h-3.5 stroke-[2.5]" />
              Squad Leaderboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Consistency Standings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rewarding consistent daily logging, meal adherence and hydration.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex bg-white/90 border border-slate-200 p-1.5 rounded-2xl shadow-xs self-start sm:self-auto">
          {[
            { id: "week", label: "This Week" },
            { id: "month", label: "This Month" },
            { id: "all", label: "All-Time" },
          ].map((tab) => {
            const isActive = period === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  haptics.tick();
                  setPeriod(tab.id);
                }}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-44 w-full rounded-3xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : leaderboardData.length === 0 ? (
        <GlassCard className="text-center py-12 bg-white/95 border-slate-200">
          <p className="text-slate-500 text-sm font-semibold">No points logged yet for this period.</p>
        </GlassCard>
      ) : (
        <>
          {/* Top 3 Animated Podium on Mobile & Desktop */}
          {top3.length > 0 && (
            <GlassCard className="p-5 sm:p-6 bg-white/95 border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.06)] relative overflow-hidden">
              <div className="flex items-end justify-center gap-2.5 sm:gap-6 pt-4 pb-2">
                {/* 2nd Place (Silver) */}
                {top3[1] && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 350, damping: 25 }}
                    className="flex-1 max-w-[130px] flex flex-col items-center text-center"
                  >
                    <div className="relative mb-2">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 border-2 border-slate-300 flex items-center justify-center font-black text-slate-700 shadow-sm">
                        {top3[1].name?.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-2 -right-1 text-xl">🥈</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate w-full">
                      {top3[1].name}
                    </span>
                    <span className="text-sm font-black text-slate-600 tabular-nums">
                      {top3[1].totalPoints} pts
                    </span>
                    <div className="w-full h-16 sm:h-20 bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-2xl mt-2 flex items-center justify-center font-black text-slate-400 text-lg">
                      2
                    </div>
                  </motion.div>
                )}

                {/* 1st Place (Gold / Crown) */}
                {top3[0] && (
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 350, damping: 25 }}
                    className="flex-1 max-w-[150px] flex flex-col items-center text-center -translate-y-2"
                  >
                    <div className="relative mb-2">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        className="absolute -top-6 text-amber-500"
                      >
                        <Crown className="w-6 h-6 fill-amber-400 stroke-amber-600" />
                      </motion.div>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-50 border-2 border-amber-400 flex items-center justify-center font-black text-amber-700 shadow-md shadow-amber-400/20 text-lg">
                        {top3[0].name?.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-2 -right-1 text-2xl">🥇</span>
                    </div>
                    <span className="text-sm font-extrabold text-slate-900 truncate w-full">
                      {top3[0].name}
                    </span>
                    <span className="text-base font-black text-amber-600 tabular-nums">
                      {top3[0].totalPoints} pts
                    </span>
                    <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-amber-200 to-amber-100 rounded-t-2xl mt-2 flex items-center justify-center font-black text-amber-700 text-2xl shadow-inner">
                      1
                    </div>
                  </motion.div>
                )}

                {/* 3rd Place (Bronze) */}
                {top3[2] && (
                  <motion.div
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 350, damping: 25 }}
                    className="flex-1 max-w-[130px] flex flex-col items-center text-center"
                  >
                    <div className="relative mb-2">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-orange-50 border-2 border-orange-300 flex items-center justify-center font-black text-orange-700 shadow-sm">
                        {top3[2].name?.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-2 -right-1 text-xl">🥉</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate w-full">
                      {top3[2].name}
                    </span>
                    <span className="text-sm font-black text-orange-600 tabular-nums">
                      {top3[2].totalPoints} pts
                    </span>
                    <div className="w-full h-12 sm:h-16 bg-gradient-to-t from-orange-200 to-orange-100 rounded-t-2xl mt-2 flex items-center justify-center font-black text-orange-500 text-lg">
                      3
                    </div>
                  </motion.div>
                )}
              </div>
            </GlassCard>
          )}

          {/* Full Rankings List */}
          <div className="space-y-2.5">
            {leaderboardData.map((item) => {
              const isFirst = item.rank === 1;
              return (
                <GlassCard
                  key={item.userId}
                  className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isFirst
                      ? "bg-amber-50/40 border-amber-300/80 shadow-xs"
                      : "bg-white/95 border-slate-200/90"
                  }`}
                >
                  {/* Left: Rank & User */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 flex items-center justify-center shrink-0">
                      {item.rank === 1 ? (
                        <span className="text-xl">🥇</span>
                      ) : item.rank === 2 ? (
                        <span className="text-xl">🥈</span>
                      ) : item.rank === 3 ? (
                        <span className="text-xl">🥉</span>
                      ) : (
                        <span className="text-xs font-black text-slate-400">#{item.rank}</span>
                      )}
                    </div>

                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isFirst
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {item.name?.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                          {item.name}
                        </h4>
                        {item.rankDelta > 0 && (
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700"
                          >
                            ▲ +{item.rankDelta}
                          </motion.span>
                        )}
                        {item.rankDelta < 0 && (
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700"
                          >
                            ▼ {item.rankDelta}
                          </motion.span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-bold text-lime-800 bg-lime-100 px-2 py-0.2 rounded-full border border-lime-300">
                          {item.consistencyPercent}% Consistency
                        </span>
                        {item.currentStreak > 0 && (
                          <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded-full border border-orange-200 inline-flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5 fill-orange-500 text-orange-500" />
                            {item.currentStreak}d
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-slate-500">
                          {item.loggedDays} days logged
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Points Breakdown */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                      <span className="flex items-center gap-1" title="Meal Points">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-lime-600" />
                        {item.mealPoints}
                      </span>
                      <span className="flex items-center gap-1" title="Workout Points">
                        <Dumbbell className="w-3.5 h-3.5 text-purple-600" />
                        {item.workoutPoints}
                      </span>
                      <span className="flex items-center gap-1" title="Water Points">
                        <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                        {item.waterPoints}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-amber-600 block tabular-nums">
                        {item.totalPoints} <span className="text-xs font-normal text-slate-400">pts</span>
                      </span>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {period === "week" && weeklyStakes?.enabled && weeklyStakes?.forfeitText && (
            <GlassCard className="p-4 bg-gradient-to-r from-rose-50 to-amber-50 border-rose-200">
              <p className="text-[11px] font-black uppercase tracking-wider text-rose-700">
                Playful Weekly Squad Forfeit
              </p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                Currently in last place:{" "}
                <span className="text-rose-700 font-black">{weeklyStakes.lowestUserName}</span> (
                {weeklyStakes.lowestPoints} pts) → &ldquo;{weeklyStakes.forfeitText}&rdquo;
              </p>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
};

export default LeaderboardPage;


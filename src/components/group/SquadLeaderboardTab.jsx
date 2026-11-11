import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { GlassCard } from "../ui/GlassCard";
import { Avatar } from "../ui/Avatar";
import { Skeleton } from "../ui/Skeleton";
import { AnimatedNumber } from "../../motion/AnimatedNumber";
import { haptics } from "../../motion/Haptics";
import {
  Trophy,
  Crown,
  UtensilsCrossed,
  Dumbbell,
  Droplets,
  Flame,
  Sparkles,
  ArrowRight,
  UserPlus,
  Zap,
  Award,
} from "lucide-react";

const PERIOD_OPTIONS = [
  { id: "week", label: "This Week" },
  { id: "month", label: "30 Days" },
  { id: "all", label: "All-Time" },
];

export const SquadLeaderboardTab = ({
  leaderboard = [],
  isLoading,
  period,
  onPeriodChange,
  currentUserId,
  onShareInvite,
  activeCountToday = 0,
  totalMembers = 0,
  openChallengesCount = 0,
  onJumpTab,
}) => {
  const maxPoints = Math.max(1, leaderboard[0]?.totalPoints || 1);
  const top3 = leaderboard.slice(0, 3);
  const myEntry = leaderboard.find((m) => String(m.userId) === String(currentUserId));
  const leader = leaderboard[0];
  const aboveEntry =
    myEntry && myEntry.rank > 1 ? leaderboard[myEntry.rank - 2] : null;
  const secondEntry = leaderboard.length > 1 ? leaderboard[1] : null;

  // Compute category MVPs from real ledger points
  const pickTopBy = (field) => {
    const candidates = leaderboard.filter((m) => (m[field] || 0) > 0);
    if (!candidates.length) return null;
    return [...candidates].sort((a, b) => (b[field] || 0) - (a[field] || 0))[0];
  };

  const mealsMvp = pickTopBy("mealPoints");
  const workoutMvp = pickTopBy("workoutPoints");
  const waterMvp = pickTopBy("waterPoints");
  const consistencyMvp = pickTopBy("consistencyPercent");

  const podiumSlots = [
    { item: top3[1], place: 2, medal: "🥈", ring: "violet", barHeight: "h-14 sm:h-20", barStyle: "from-slate-200 to-slate-100 text-slate-500", ptsColor: "text-slate-700" },
    { item: top3[0], place: 1, medal: "🥇", ring: "lime", barHeight: "h-20 sm:h-28", barStyle: "from-amber-300 via-amber-200 to-yellow-100 text-amber-800 shadow-inner", ptsColor: "text-amber-600", isFirst: true },
    { item: top3[2], place: 3, medal: "🥉", ring: "coral", barHeight: "h-12 sm:h-16", barStyle: "from-orange-200 to-orange-100 text-orange-600", ptsColor: "text-orange-600" },
  ];

  return (
    <div className="space-y-4">
      {/* Period Switcher + Competitive Subhead */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              Squad Standings
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Earn points daily from meals, workouts &amp; hydration
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 bg-white border border-slate-200 p-1 rounded-2xl shadow-2xs w-full sm:w-auto">
          {PERIOD_OPTIONS.map((opt) => {
            const active = period === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  haptics.tick();
                  onPeriodChange(opt.id);
                }}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  active
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-52 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : leaderboard.length === 0 ? (
        <GlassCard className="p-6 text-center space-y-3 bg-white/95">
          <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
          <div>
            <h3 className="text-sm font-black text-slate-900">Season kicks off today</h3>
            <p className="text-xs text-slate-500 mt-1">
              Log your first meal, workout, or water goal to claim #1 on the board.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
            <Link to="/tracker" onClick={() => haptics.tick()}>
              <span className="min-h-[44px] px-4 rounded-xl bg-lime-500 hover:bg-lime-600 text-black text-xs font-extrabold inline-flex items-center justify-center gap-1.5 w-full sm:w-auto">
                Log Today's Habits <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </GlassCard>
      ) : (
        <>
          {/* Competitive Gap Callout Banner */}
          {myEntry && (
            <GlassCard
              glow={myEntry.rank === 1 ? "lime" : "violet"}
              className={`p-3.5 sm:p-4 bg-gradient-to-r ${
                myEntry.rank === 1
                  ? "from-amber-50/90 via-lime-50/80 to-emerald-50/80 border-amber-300/80"
                  : "from-violet-50/80 via-white to-lime-50/70 border-violet-200/80"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start sm:items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      myEntry.rank === 1
                        ? "bg-amber-400 text-slate-950 shadow-xs"
                        : "bg-violet-600 text-white shadow-xs"
                    }`}
                  >
                    {myEntry.rank === 1 ? (
                      <Crown className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <Zap className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    {myEntry.rank === 1 ? (
                      <>
                        <p className="text-xs sm:text-sm font-black text-slate-900">
                          {secondEntry
                            ? `Defending #1 · +${Math.max(
                                0,
                                myEntry.totalPoints - secondEntry.totalPoints
                              )} pts ahead of ${secondEntry.name?.split(" ")[0]}`
                            : "You hold #1 on the squad board!"}
                        </p>
                        <p className="text-[11px] text-slate-600 font-medium">
                          Keep logging meals &amp; workouts to lock your lead this {period}.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs sm:text-sm font-black text-slate-900">
                          Ranked #{myEntry.rank} · Only{" "}
                          <span className="text-violet-700">
                            {Math.max(1, (aboveEntry?.totalPoints || 0) - myEntry.totalPoints)} pts
                          </span>{" "}
                          behind {aboveEntry?.name?.split(" ")[0]}
                        </p>
                        <p className="text-[11px] text-slate-600 font-medium">
                          Complete a workout (+30 pts) or hit meal targets to climb!
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to="/tracker"
                    onClick={() => haptics.tick()}
                    className="min-h-[40px] px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 w-full sm:w-auto"
                  >
                    Score Points <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Top 3 Animated Podium */}
          <GlassCard className="p-4 sm:p-6 bg-gradient-to-b from-white via-white to-amber-50/40 border-slate-200/90 overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Top 3 Podium
              </span>
              {leader && (
                <span className="text-[11px] font-bold text-slate-500 tabular-nums">
                  Pace setter: <strong className="text-slate-900">{leader.totalPoints} pts</strong>
                </span>
              )}
            </div>

            <div className="flex items-end justify-center gap-2 sm:gap-5 pt-5 pb-1">
              {podiumSlots.map((slot) => {
                if (!slot.item) {
                  return (
                    <button
                      key={`empty-${slot.place}`}
                      type="button"
                      onClick={() => {
                        haptics.tick();
                        onShareInvite?.();
                      }}
                      className="flex-1 max-w-[125px] flex flex-col items-center text-center group cursor-pointer"
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 group-hover:bg-lime-50 group-hover:border-lime-400 flex items-center justify-center text-slate-400 group-hover:text-lime-700 transition-colors mb-2">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 group-hover:text-lime-700">
                        Invite Rival
                      </span>
                      <span className="text-[10px] text-slate-400 tabular-nums">#{slot.place} open</span>
                      <div
                        className={`w-full ${slot.barHeight} bg-slate-100/80 border border-dashed border-slate-200 rounded-t-2xl mt-2 flex items-center justify-center font-black text-slate-300 text-base`}
                      >
                        {slot.place}
                      </div>
                    </button>
                  );
                }

                const isSelf = String(slot.item.userId) === String(currentUserId);
                return (
                  <motion.div
                    key={slot.item.userId}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: slot.isFirst ? 0.08 : 0.14,
                      type: "spring",
                      stiffness: 340,
                      damping: 26,
                    }}
                    className={`flex-1 max-w-[136px] flex flex-col items-center text-center min-w-0 ${
                      slot.isFirst ? "-translate-y-1" : ""
                    }`}
                  >
                    <div className="relative mb-2">
                      {slot.isFirst && (
                        <motion.div
                          animate={{ y: [0, -3, 0] }}
                          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                          className="absolute -top-5 left-1/2 -translate-x-1/2 text-amber-500 pointer-events-none"
                        >
                          <Crown className="w-5 h-5 fill-amber-400 stroke-amber-600" />
                        </motion.div>
                      )}
                      <Avatar
                        src={slot.item.profileImage}
                        name={slot.item.name}
                        size={slot.isFirst ? "lg" : "md"}
                        ringColor={slot.ring}
                      />
                      <span
                        className="absolute -bottom-1.5 -right-1 text-base sm:text-lg leading-none"
                        aria-hidden="true"
                      >
                        {slot.medal}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-1 w-full min-w-0 px-0.5">
                      <span className="text-xs font-extrabold text-slate-900 truncate">
                        {slot.item.name?.split(" ")[0]}
                      </span>
                      {isSelf && (
                        <span className="text-[9px] font-black bg-lime-100 text-lime-800 border border-lime-300 px-1 rounded-full shrink-0">
                          You
                        </span>
                      )}
                    </div>

                    <span className={`text-sm font-black tabular-nums ${slot.ptsColor}`}>
                      <AnimatedNumber value={slot.item.totalPoints || 0} /> pts
                    </span>

                    <div
                      className={`w-full ${slot.barHeight} bg-gradient-to-t ${slot.barStyle} rounded-t-2xl mt-1.5 flex flex-col items-center justify-center font-black text-lg`}
                    >
                      <span>{slot.place}</span>
                      <span className="text-[9px] font-bold opacity-75">
                        {slot.item.consistencyPercent}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>

          {/* Category MVP Badges (2x2 on Mobile, 4-col on Desktop) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {[
              {
                title: "Fuel Leader",
                icon: UtensilsCrossed,
                mvp: mealsMvp,
                stat: mealsMvp ? `${mealsMvp.mealPoints} meal pts` : "No logs yet",
                theme: "bg-lime-50/80 border-lime-200/90 text-lime-700",
                iconBg: "bg-lime-100 text-lime-700",
              },
              {
                title: "Workout MVP",
                icon: Dumbbell,
                mvp: workoutMvp,
                stat: workoutMvp ? `${workoutMvp.workoutPoints} pts` : "No logs yet",
                theme: "bg-purple-50/80 border-purple-200/90 text-purple-700",
                iconBg: "bg-purple-100 text-purple-700",
              },
              {
                title: "Hydration Pro",
                icon: Droplets,
                mvp: waterMvp,
                stat: waterMvp ? `${waterMvp.waterPoints} water pts` : "No logs yet",
                theme: "bg-cyan-50/80 border-cyan-200/90 text-cyan-700",
                iconBg: "bg-cyan-100 text-cyan-700",
              },
              {
                title: "Most Consistent",
                icon: Flame,
                mvp: consistencyMvp,
                stat: consistencyMvp ? `${consistencyMvp.consistencyPercent}% active` : "0% active",
                theme: "bg-orange-50/80 border-orange-200/90 text-orange-700",
                iconBg: "bg-orange-100 text-orange-700",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className={`rounded-2xl border p-3 ${card.theme} shadow-2xs flex flex-col justify-between gap-2`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider truncate">
                      {card.title}
                    </span>
                    <span className={`w-6 h-6 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  {card.mvp ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar src={card.mvp.profileImage} name={card.mvp.name} size="xs" ring={false} />
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          {card.mvp.name?.split(" ")[0]}
                        </p>
                        <p className="text-[10px] font-bold opacity-85 truncate tabular-nums">
                          {card.stat}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] font-semibold text-slate-400">Up for grabs!</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Full Standings List with Relative Score Bars */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Full Rankings ({leaderboard.length})
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                Meals · Workout · Water
              </span>
            </div>

            {leaderboard.map((item) => {
              const isSelf = String(item.userId) === String(currentUserId);
              const barPct = Math.max(
                4,
                Math.min(100, Math.round(((item.totalPoints || 0) / maxPoints) * 100))
              );

              return (
                <GlassCard
                  key={item.userId}
                  className={`p-3.5 sm:p-4 transition-all ${
                    isSelf
                      ? "bg-lime-50/70 border-lime-300 shadow-xs"
                      : item.rank === 1
                      ? "bg-amber-50/40 border-amber-200/90"
                      : "bg-white/95 border-slate-200/90"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div className="w-7 text-center shrink-0">
                        {item.rank === 1 ? (
                          <span className="text-lg">🥇</span>
                        ) : item.rank === 2 ? (
                          <span className="text-lg">🥈</span>
                        ) : item.rank === 3 ? (
                          <span className="text-lg">🥉</span>
                        ) : (
                          <span className="text-xs font-black text-slate-400 tabular-nums">
                            #{item.rank}
                          </span>
                        )}
                      </div>

                      <Avatar
                        src={item.profileImage}
                        name={item.name}
                        size="md"
                        ringColor={isSelf ? "lime" : item.rank === 1 ? "coral" : "violet"}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="font-extrabold text-slate-900 text-sm truncate">
                            {item.name}
                          </h4>
                          {isSelf && (
                            <span className="text-[10px] font-black text-lime-800 bg-lime-100 border border-lime-300 px-1.5 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-[11px] font-semibold text-slate-500 tabular-nums">
                          <span className="text-emerald-700 font-bold">
                            {item.consistencyPercent}% consistent
                          </span>
                          <span>·</span>
                          <span>{item.loggedDays}d active</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums leading-none block">
                        {item.totalPoints}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        pts
                      </span>
                    </div>
                  </div>

                  {/* Competitive Progress Bar + Macro Point Breakdown */}
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100/90 space-y-2">
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          item.rank === 1
                            ? "bg-gradient-to-r from-amber-400 to-lime-500"
                            : isSelf
                            ? "bg-gradient-to-r from-lime-500 to-emerald-500"
                            : "bg-gradient-to-r from-violet-500 to-cyan-500"
                        }`}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-600 tabular-nums">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1" title="Meal Points">
                          <UtensilsCrossed className="w-3 h-3 text-lime-600" />
                          {item.mealPoints}
                        </span>
                        <span className="inline-flex items-center gap-1" title="Workout Points">
                          <Dumbbell className="w-3 h-3 text-purple-600" />
                          {item.workoutPoints}
                        </span>
                        <span className="inline-flex items-center gap-1" title="Water Points">
                          <Droplets className="w-3 h-3 text-cyan-600" />
                          {item.waterPoints}
                        </span>
                      </div>
                      {item.bonusPoints > 0 && (
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                          +{item.bonusPoints} bonus
                        </span>
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {/* Quick Jump Bridges to Live Activities & Challenges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                haptics.tick();
                onJumpTab?.("activities");
              }}
              className="min-h-[54px] p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-lime-300 hover:bg-lime-50/40 flex items-center justify-between gap-3 text-left transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-lime-100 text-lime-700 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-900">Today's Squad Pulse</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {activeCountToday} of {totalMembers} logged habits today
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => {
                haptics.tick();
                onJumpTab?.("challenges");
              }}
              className="min-h-[54px] p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 flex items-center justify-between gap-3 text-left transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-900">Squad Challenges</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {openChallengesCount > 0
                      ? `${openChallengesCount} active competition${openChallengesCount > 1 ? "s" : ""}`
                      : "Start a head-to-head challenge"}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SquadLeaderboardTab;

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "../ui/GlassCard";
import { Avatar } from "../ui/Avatar";
import { Skeleton } from "../ui/Skeleton";
import { haptics } from "../../motion/Haptics";
import {
  Dumbbell,
  Droplets,
  UtensilsCrossed,
  Camera,
  Sparkles,
  CheckCircle2,
  Clock,
  Flame,
  Lock,
  ArrowRight,
  Award,
  X,
  Radio,
} from "lucide-react";

const FILTER_TABS = [
  { id: "all", label: "All Pulse" },
  { id: "workouts", label: "Workouts" },
  { id: "fuel", label: "Meals & Water" },
  { id: "social", label: "Photos & Goals" },
];

const formatRelativeTime = (isoString) => {
  if (!isoString) return "Live";
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
  if (diffSec < 60) return "Just now";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
};

const formatLiveEventCopy = (evt) => {
  switch (evt.type) {
    case "workout":
      return {
        category: "workouts",
        icon: Dumbbell,
        badge: "Workout",
        badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
        title: `${evt.userName || "Teammate"} completed ${evt.workoutName || "today's workout"}`,
        detail: "Live workout completion · +30 squad pts",
      };
    case "water":
      return {
        category: "fuel",
        icon: Droplets,
        badge: "Hydration",
        badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-200",
        title: `${evt.userName || "Teammate"} hit their daily hydration target`,
        detail: `${evt.totalConsumed || "Target"} ml logged today`,
      };
    case "meal":
      return {
        category: "fuel",
        icon: UtensilsCrossed,
        badge: "Meal Log",
        badgeClass: "bg-lime-100 text-lime-800 border-lime-200",
        title: `${evt.userName || "Teammate"} logged ${evt.mealName || "a meal"} (${evt.status || "eaten"})`,
        detail: "Live meal tracker update",
      };
    case "badge":
      return {
        category: "social",
        icon: Award,
        badge: "Badge",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
        title: `${evt.userName || "Teammate"} unlocked badge: ${evt.badgeName || "Achievement"}`,
        detail: "Milestone unlocked",
      };
    case "challenge-created":
      return {
        category: "social",
        icon: Sparkles,
        badge: "New Challenge",
        badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
        title: `${evt.userName || evt.createdBy || "Teammate"} launched "${evt.title}"`,
        detail: `Target: ${evt.target} days`,
      };
    case "challenge":
      return {
        category: "social",
        icon: CheckCircle2,
        badge: "Challenge",
        badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
        title: `${evt.userName || "Teammate"} joined ${evt.challengeTitle || "a challenge"}`,
        detail: "Competition heating up",
      };
    case "member-joined":
      return {
        category: "social",
        icon: Sparkles,
        badge: "New Member",
        badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
        title: `${evt.userName || "A new teammate"} joined the squad`,
        detail: "Welcome to the team",
      };
    default:
      return {
        category: "social",
        icon: Sparkles,
        badge: "Pulse",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
        title: `${evt.userName || "Teammate"} updated today's activity`,
        detail: "Live squad activity",
      };
  }
};

export const SquadActivityTab = ({
  dashboardData,
  isLoading,
  recentEvents = [],
  sharedPhotoSets = [],
  challenges = [],
  currentUserId,
}) => {
  const [filter, setFilter] = useState("all");
  const [lightboxImage, setLightboxImage] = useState(null);

  const members = dashboardData?.members || [];

  const summary = useMemo(() => {
    const workoutsDone = members.filter((m) => m.today?.workoutStatus === "completed").length;
    const waterGoalsHit = members.filter((m) => (m.today?.waterProgressPercent || 0) >= 100).length;
    const perfectMeals = members.filter(
      (m) => (m.today?.totalMeals || 0) > 0 && m.today?.mealCompletionRate === 100
    ).length;
    return { workoutsDone, waterGoalsHit, perfectMeals };
  }, [members]);

  // Build real chronological squad activities from persisted backend endpoints + live socket events
  const activityItems = useMemo(() => {
    const items = [];

    // 1. Real-time Socket Events received in this session
    recentEvents.forEach((evt) => {
      const meta = formatLiveEventCopy(evt);
      items.push({
        id: `live-${evt.id}`,
        isLive: true,
        timeLabel: formatRelativeTime(evt.timestamp),
        priority: 100,
        userName: evt.userName || evt.createdBy || "Squad",
        ...meta,
      });
    });

    // 2. Persisted Today's Squad Milestones from dashboard logs
    members.forEach((m) => {
      const t = m.today || {};
      const firstName = m.name || "Teammate";

      if (t.workoutStatus === "completed") {
        items.push({
          id: `wo-done-${m.userId}`,
          category: "workouts",
          icon: Dumbbell,
          badge: "Workout Done",
          badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
          title: `${firstName} crushed today's workout`,
          detail: "Completed session · +30 consistency pts",
          timeLabel: "Today",
          priority: 85,
          avatar: m.profileImage,
          userName: firstName,
          isSelf: String(m.userId) === String(currentUserId),
        });
      } else if (t.workoutStatus === "rest") {
        items.push({
          id: `wo-rest-${m.userId}`,
          category: "workouts",
          icon: Clock,
          badge: "Rest Day",
          badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
          title: `${firstName} logged a planned recovery rest day`,
          detail: "Streak protected",
          timeLabel: "Today",
          priority: 65,
          avatar: m.profileImage,
          userName: firstName,
          isSelf: String(m.userId) === String(currentUserId),
        });
      }

      if ((t.totalMeals || 0) > 0 && (t.eatenMeals > 0 || (t.mealCompletionRate || 0) > 0)) {
        const isPerfect = t.mealCompletionRate === 100;
        const hasItems = (t.totalItems || 0) > 0;
        items.push({
          id: `meal-${m.userId}`,
          category: "fuel",
          icon: UtensilsCrossed,
          badge: isPerfect ? "100% Fuel" : "Meals Logged",
          badgeClass: isPerfect
            ? "bg-lime-100 text-lime-800 border-lime-300"
            : "bg-emerald-50 text-emerald-700 border-emerald-200",
          title: isPerfect
            ? `${firstName} completed all ${t.totalMeals}/${t.totalMeals} planned meals`
            : hasItems
            ? `${firstName} checked off ${t.itemsCompleted || 0}/${t.totalItems} food items (${t.mealCompletionRate}%)`
            : `${firstName} checked off ${t.eatenMeals}/${t.totalMeals} meals (${t.mealCompletionRate}%)`,
          detail: isPerfect ? "Clean nutrition day unlocked" : "Fuel tracker in progress",
          timeLabel: "Today",
          priority: isPerfect ? 82 : 60,
          avatar: m.profileImage,
          userName: firstName,
          isSelf: String(m.userId) === String(currentUserId),
        });
      }

      if ((t.totalWaterMl || 0) > 0) {
        const hitGoal = (t.waterProgressPercent || 0) >= 100;
        items.push({
          id: `water-${m.userId}`,
          category: "fuel",
          icon: Droplets,
          badge: hitGoal ? "Water Goal" : "Hydrating",
          badgeClass: hitGoal
            ? "bg-cyan-100 text-cyan-800 border-cyan-300"
            : "bg-sky-50 text-sky-700 border-sky-200",
          title: hitGoal
            ? `${firstName} hit their ${t.waterTarget || 3000} ml hydration target`
            : `${firstName} drank ${t.totalWaterMl} ml (${t.waterProgressPercent}%)`,
          detail: hitGoal ? "Daily hydration bonus earned" : `${t.waterTarget - t.totalWaterMl} ml to target`,
          timeLabel: "Today",
          priority: hitGoal ? 78 : 50,
          avatar: m.profileImage,
          userName: firstName,
          isSelf: String(m.userId) === String(currentUserId),
        });
      }
    });

    // 3. Shared Check-In Photo Sets
    sharedPhotoSets.slice(0, 4).forEach((set) => {
      const ownerName = set.ownerName || set.user?.name || "Squad Member";
      items.push({
        id: `photo-${set._id}`,
        category: "social",
        icon: Camera,
        badge: "Photo Check-In",
        badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
        title: `${ownerName} shared Cycle #${set.cycleNumber} progress check-in`,
        detail: set.note || `Opt-in squad check-in · ${set.date}`,
        timeLabel: set.date || "Recent",
        priority: 72,
        avatar: set.ownerAvatar || set.user?.avatar,
        userName: ownerName,
      });
    });

    // 4. Active Challenges Launched
    challenges.slice(0, 3).forEach((ch) => {
      const creatorName = ch.createdBy?.name || "Squad Member";
      items.push({
        id: `challenge-${ch._id}`,
        category: "social",
        icon: Award,
        badge: "Challenge",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
        title: `Challenge active: "${ch.title}"`,
        detail: `Started by ${creatorName} · ${ch.participantCount || 1} competing`,
        timeLabel: ch.startDate || "Active",
        priority: 55,
        avatar: ch.createdBy?.profileImage,
        userName: creatorName,
      });
    });

    return items.sort((a, b) => b.priority - a.priority);
  }, [recentEvents, members, sharedPhotoSets, challenges, currentUserId]);

  const filteredActivities = useMemo(() => {
    if (filter === "all") return activityItems;
    return activityItems.filter((item) => item.category === filter);
  }, [activityItems, filter]);

  return (
    <div className="space-y-4">
      {/* 1. Today's Activity KPI Strip */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-2xl bg-purple-50/90 border border-purple-200/90 p-3 text-center shadow-2xs">
          <Dumbbell className="w-4 h-4 text-purple-600 mx-auto mb-1" />
          <p className="text-lg sm:text-xl font-black text-slate-900 tabular-nums leading-none">
            {summary.workoutsDone}
            <span className="text-xs font-bold text-slate-400">/{members.length || 0}</span>
          </p>
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block mt-1">
            Workouts
          </span>
        </div>

        <div className="rounded-2xl bg-lime-50/90 border border-lime-200/90 p-3 text-center shadow-2xs">
          <UtensilsCrossed className="w-4 h-4 text-lime-700 mx-auto mb-1" />
          <p className="text-lg sm:text-xl font-black text-slate-900 tabular-nums leading-none">
            {summary.perfectMeals}
            <span className="text-xs font-bold text-slate-400">/{members.length || 0}</span>
          </p>
          <span className="text-[10px] font-bold text-lime-800 uppercase tracking-wider block mt-1">
            100% Fuel
          </span>
        </div>

        <div className="rounded-2xl bg-cyan-50/90 border border-cyan-200/90 p-3 text-center shadow-2xs">
          <Droplets className="w-4 h-4 text-cyan-600 mx-auto mb-1" />
          <p className="text-lg sm:text-xl font-black text-slate-900 tabular-nums leading-none">
            {summary.waterGoalsHit}
            <span className="text-xs font-bold text-slate-400">/{members.length || 0}</span>
          </p>
          <span className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider block mt-1">
            Hydrated
          </span>
        </div>
      </div>

      {/* 2. Live Activity Feed */}
      <GlassCard className="p-4 sm:p-5 bg-white/95 border-slate-200/90 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
              <Radio className="w-3 h-3 animate-pulse" />
              Squad Activity Feed
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {filteredActivities.length} updates
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {FILTER_TABS.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    haptics.tick();
                    setFilter(tab.id);
                  }}
                  className={`shrink-0 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center space-y-2.5">
            <Flame className="w-8 h-8 text-orange-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              No activities logged in this filter yet today
            </p>
            <p className="text-[11px] text-slate-500">
              Be the first teammate to spark today's feed!
            </p>
            <Link
              to="/tracker"
              onClick={() => haptics.tick()}
              className="min-h-[44px] px-4 rounded-xl bg-lime-500 hover:bg-lime-600 text-black text-xs font-extrabold inline-flex items-center gap-1.5"
            >
              Log Activity Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredActivities.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border flex items-start gap-3 transition-colors ${
                    item.isLive
                      ? "bg-emerald-50/60 border-emerald-200"
                      : item.isSelf
                      ? "bg-lime-50/50 border-lime-200/80"
                      : "bg-slate-50/80 border-slate-200/75"
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar
                      src={item.avatar}
                      name={item.userName}
                      size="sm"
                      ringColor={item.isSelf ? "lime" : "violet"}
                    />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                      <Icon className="w-2.5 h-2.5 text-slate-700" />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-0.5">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.badgeClass}`}
                      >
                        {item.isLive ? `LIVE · ${item.badge}` : item.badge}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {item.timeLabel}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 leading-snug">{item.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* 3. Teammate Live Check-In Board */}
      <GlassCard className="p-4 sm:p-5 bg-white/95 border-slate-200/90 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              Today's Teammate Scorecards
            </h3>
            <p className="text-[11px] text-slate-500">
              Daily habit battle: Meals, Workouts &amp; Hydration
            </p>
          </div>
          <Link
            to="/tracker"
            onClick={() => haptics.tick()}
            className="min-h-[40px] px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 inline-flex items-center gap-1 shrink-0"
          >
            Update Yours <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {members.map((m) => {
            const t = m.today || {};
            const isSelf = String(m.userId) === String(currentUserId);
            const habitsDone =
              (t.mealCompletionRate >= 100 ? 1 : 0) +
              (t.workoutCompleted ? 1 : 0) +
              ((t.waterProgressPercent || 0) >= 100 ? 1 : 0);

            return (
              <div
                key={m.userId}
                className={`p-3.5 rounded-2xl border space-y-2.5 ${
                  isSelf
                    ? "bg-lime-50/50 border-lime-300"
                    : "bg-slate-50/75 border-slate-200/80"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      src={m.profileImage}
                      name={m.name}
                      size="sm"
                      ringColor={isSelf ? "lime" : "cyan"}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900 truncate">
                          {m.name}
                        </span>
                        {isSelf && (
                          <span className="text-[9px] font-black bg-lime-100 text-lime-800 border border-lime-300 px-1.5 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {habitsDone}/3 daily targets complete
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                      habitsDone === 3
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : habitsDone > 0
                        ? "bg-lime-100 text-lime-800 border-lime-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {habitsDone === 3 ? "⚡ 3/3 Sweep" : `${habitsDone}/3 Done`}
                  </span>
                </div>

                {/* 3 Compact Visual Trackers */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60">
                  <div className="min-w-0">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                      <span>Meals</span>
                      <span className="tabular-nums">{t.mealCompletionRate || 0}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-lime-500 rounded-full"
                        style={{ width: `${Math.min(100, t.mealCompletionRate || 0)}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-medium text-slate-400 tabular-nums truncate mt-0.5 block">
                      {(t.totalItems || 0) > 0
                        ? `${t.itemsCompleted || 0}/${t.totalItems} items`
                        : `${t.eatenMeals || 0}/${t.totalMeals || 0} meals`}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                      <span>Workout</span>
                      <span
                        className={
                          t.workoutStatus === "completed"
                            ? "text-purple-700"
                            : t.workoutStatus === "rest"
                            ? "text-indigo-600"
                            : "text-slate-400"
                        }
                      >
                        {t.workoutStatus === "completed"
                          ? "Done"
                          : t.workoutStatus === "rest"
                          ? "Rest"
                          : "Wait"}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          t.workoutCompleted ? "bg-purple-500 w-full" : "bg-transparent w-0"
                        }`}
                      />
                    </div>
                    <span className="text-[9px] font-medium text-slate-400 truncate mt-0.5 block">
                      {t.workoutCompleted ? "+30 pts" : "Pending"}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                      <span>Water</span>
                      <span className="tabular-nums">{t.waterProgressPercent || 0}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${Math.min(100, t.waterProgressPercent || 0)}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-medium text-slate-400 tabular-nums truncate mt-0.5 block">
                      {t.totalWaterMl || 0}/{t.waterTarget || 3000} ml
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* 4. Explicitly Shared Squad Progress Check-Ins (Opt-in Only) */}
      {sharedPhotoSets.length > 0 && (
        <GlassCard className="p-4 sm:p-5 bg-white/95 border-slate-200 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Shared Squad Check-Ins
                </h3>
                <p className="text-[11px] text-slate-500">
                  Bi-weekly sets teammates opted in to share
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <Lock className="w-3 h-3" /> Opt-in only
            </span>
          </div>

          <div className="space-y-3">
            {sharedPhotoSets.map((set) => {
              const memberName = set.ownerName || set.user?.name || "Squad Member";
              const memberAvatar = set.ownerAvatar || set.user?.avatar || "";
              return (
                <div
                  key={set._id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Avatar src={memberAvatar} name={memberName} size="sm" />
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{memberName}</p>
                      <p className="text-[11px] text-slate-500">
                        Cycle #{set.cycleNumber} · {set.date}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "front_relaxed", label: "Front" },
                      { key: "side_relaxed", label: "Side" },
                      { key: "back_relaxed", label: "Back" },
                    ].map(({ key, label }) => {
                      const pose = set.photos?.[key];
                      return pose?.url ? (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            haptics.tick();
                            setLightboxImage({
                              url: pose.url,
                              label: `${memberName} · Cycle #${set.cycleNumber} (${label})`,
                            });
                          }}
                          className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 cursor-pointer hover:opacity-95 transition-opacity"
                        >
                          <img
                            src={pose.url}
                            alt={`${memberName} ${label}`}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <div
                          key={key}
                          className="aspect-[3/4] rounded-xl border border-dashed border-slate-200 bg-white/60 flex items-center justify-center text-[10px] font-semibold text-slate-400"
                        >
                          No shot
                        </div>
                      );
                    })}
                  </div>
                  {set.note && <p className="text-xs text-slate-600">{set.note}</p>}
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Lightbox Modal for Shared Squad Check-In */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxImage.label}
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full flex flex-col items-center gap-3"
          >
            <div className="w-full flex items-center justify-between text-white gap-2">
              <span className="text-sm font-bold truncate">{lightboxImage.label}</span>
              <button
                type="button"
                aria-label="Close photo preview"
                onClick={() => setLightboxImage(null)}
                className="min-w-[44px] min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.label}
              className="max-h-[78dvh] w-auto rounded-2xl object-contain shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SquadActivityTab;

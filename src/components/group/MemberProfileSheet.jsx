import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Flame,
  Trophy,
  Award,
  Shield,
  CheckCircle2,
  Clock,
  Lock,
  Unlock,
  Droplets,
  Utensils,
  Dumbbell,
  Scale,
  Target,
  Calendar,
  Send,
  Sparkles,
  Zap,
  Activity,
  Heart,
} from "lucide-react";
import { groupApi } from "../../api/endpoints";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";

export const MemberProfileSheet = ({
  isOpen,
  onClose,
  groupId,
  member,
  currentUserId,
}) => {
  const queryClient = useQueryClient();
  const targetUserId =
    typeof member?.userId === "object" && member?.userId !== null
      ? member.userId._id
      : member?.userId || member?._id;

  const {
    data: profileData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["squad-member-profile", groupId, targetUserId],
    queryFn: async () => {
      if (!groupId || !targetUserId) return null;
      const res = await groupApi.getMemberProfile(groupId, targetUserId);
      return res.data?.data || null;
    },
    enabled: isOpen && !!groupId && !!targetUserId,
  });

  const nudgeMutation = useMutation({
    mutationFn: () =>
      groupApi.nudgeMember(groupId, targetUserId, "Keep our squad streak alive!"),
    onSuccess: () => {
      haptics.goal();
      toast.success(`Nudged ${member?.name || "teammate"}! 👋`);
      queryClient.invalidateQueries({
        queryKey: ["squad-member-profile", groupId, targetUserId],
      });
      queryClient.invalidateQueries({ queryKey: ["squad-today-status", groupId] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Could not send nudge");
    },
  });

  if (!isOpen || !member) return null;

  const user = profileData?.user;
  const today = profileData?.today;
  const leaderboard = profileData?.leaderboard;
  const badges = profileData?.badges || [];
  const personal = profileData?.personalDetails;
  const nudge = profileData?.nudge;

  const isSelf = String(targetUserId) === String(currentUserId);
  const currentStreak = user?.currentStreak ?? member?.currentStreak ?? 0;
  const longestStreak = user?.longestStreak ?? member?.longestStreak ?? 0;

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "Recently";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return "Recently";
    }
  };

  const waterLogged = today?.water?.loggedMl || 0;
  const waterTarget = today?.water?.targetMl || 3000;
  const waterPercent = Math.min(100, Math.round((waterLogged / waterTarget) * 100));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Bottom Sheet Drawer */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 320 }}
          className="relative w-full sm:max-w-xl bg-white border border-slate-200/90 rounded-t-[32px] sm:rounded-3xl shadow-2xl z-10 max-h-[92dvh] h-[90dvh] flex flex-col overflow-hidden safe-bottom"
        >
          {/* Top Drag Indicator for mobile */}
          <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          </div>

          {/* Sticky Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 shrink-0 bg-white/95 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                Squad Teammate Profile
              </span>
              {isSelf && (
                <span className="text-[10px] font-black bg-lime-100 text-lime-800 border border-lime-300 px-2 py-0.5 rounded-full">
                  You
                </span>
              )}
            </div>

            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                haptics.tick();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-1/2 rounded-lg" />
                    <Skeleton className="h-4 w-1/3 rounded-lg" />
                  </div>
                </div>
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>
            ) : isError ? (
              <div className="text-center py-12 space-y-3">
                <p className="text-sm font-semibold text-slate-600">
                  {error?.response?.data?.message || "Could not load member details."}
                </p>
                <Button size="sm" variant="secondary" onClick={() => refetch()}>
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                {/* Profile Hero Card */}
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white relative overflow-hidden shadow-lg border border-emerald-900/40">
                  {/* Subtle Glow Background */}
                  <div className="absolute top-0 right-0 w-44 h-44 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <Avatar
                        src={user?.profileImage || member?.profileImage}
                        name={user?.name || member?.name}
                        size="lg"
                        className="ring-2 ring-lime-400/80 shadow-md"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-black tracking-tight text-white">
                            {user?.name || member?.name}
                          </h2>
                          {user?.role === "admin" && (
                            <span className="text-[10px] font-black text-amber-200 bg-amber-950/80 border border-amber-400/50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Shield className="w-3 h-3 text-amber-300" /> Leader
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-lime-400" />
                          Joined squad in {formatDate(user?.joinedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Streak & Rank Badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                        <div>
                          <span className="text-xs font-black text-white">
                            {currentStreak}
                          </span>
                          <span className="text-[10px] text-slate-300 block leading-none">
                            Streak
                          </span>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-lime-400" />
                        <div>
                          <span className="text-xs font-black text-white">
                            #{leaderboard?.weeklyRank || 1}
                          </span>
                          <span className="text-[10px] text-slate-300 block leading-none">
                            Rank
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nudge Action Strip if pending */}
                  {!isSelf && nudge?.canNudge && (
                    <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between gap-3">
                      <span className="text-xs text-amber-200 flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Hasn't checked in today yet!
                      </span>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={nudgeMutation.isPending}
                        onClick={() => {
                          haptics.tick();
                          nudgeMutation.mutate();
                        }}
                        className="bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs px-3 py-1.5 h-auto rounded-xl shadow-xs"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        {nudgeMutation.isPending ? "Sending..." : "Nudge Teammate"}
                      </Button>
                    </div>
                  )}

                  {!isSelf && nudge?.nudgedByMeToday && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-lime-300 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
                      You nudged {user?.name || "this teammate"} today 👋
                    </div>
                  )}
                </div>

                {/* Section 1: Today's Daily Achievements */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Today's Habit Achievements
                    </h3>
                    <span
                      className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                        today?.loggedToday
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {today?.loggedToday ? "✓ Active Today" : "⏳ Pending Log"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Hydration */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                          <Droplets className="w-4 h-4 text-blue-600" /> Hydration
                        </span>
                        {today?.water?.completed && (
                          <span className="text-[10px] font-black text-blue-800 bg-blue-200/80 px-1.5 py-0.5 rounded-md">
                            Done
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-extrabold text-blue-950">
                        {waterLogged.toLocaleString()} / {waterTarget.toLocaleString()}{" "}
                        <span className="text-[10px] font-bold text-blue-700">ml</span>
                      </p>
                      <div className="w-full bg-blue-200/70 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${waterPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Diet / Meals */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                          <Utensils className="w-4 h-4 text-amber-600" /> Nutrition
                        </span>
                        {today?.meals?.completed && (
                          <span className="text-[10px] font-black text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded-md">
                            Done
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-extrabold text-amber-950">
                        {today?.meals?.eatenCount || 0}{" "}
                        <span className="text-xs text-amber-700 font-semibold">
                          {today?.meals?.totalMeals
                            ? `of ${today.meals.totalMeals} meals eaten`
                            : "meals logged"}
                        </span>
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-amber-800 font-semibold">
                        {today?.sources?.meal ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Diet plan tracked
                          </span>
                        ) : (
                          <span className="text-amber-700">Awaiting meal logs</span>
                        )}
                      </div>
                    </div>

                    {/* Workout */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                          <Dumbbell className="w-4 h-4 text-emerald-600" /> Workout
                        </span>
                        {today?.workout?.completed && (
                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-200/80 px-1.5 py-0.5 rounded-md">
                            Done
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-extrabold text-emerald-950 capitalize truncate">
                        {today?.workout?.name ||
                          (today?.workout?.status === "completed"
                            ? "Workout Done"
                            : today?.workout?.status === "rest"
                            ? "Rest Day"
                            : "Rest / Unscheduled")}
                      </p>
                      <div className="text-[11px] text-emerald-700 font-semibold truncate">
                        {today?.workout?.status === "completed"
                          ? "✓ Session finished"
                          : today?.workout?.status === "rest"
                          ? "🌱 Recovery day"
                          : "No session today"}
                      </div>
                    </div>

                    {/* Weigh-in */}
                    <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                          <Scale className="w-4 h-4 text-purple-600" /> Check-in
                        </span>
                        {today?.weightLogged && (
                          <span className="text-[10px] font-black text-purple-800 bg-purple-200/80 px-1.5 py-0.5 rounded-md">
                            Logged
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-extrabold text-purple-950">
                        {today?.weightLogged ? "Logged Today" : "Not logged"}
                      </p>
                      <p className="text-[11px] text-purple-700 font-semibold">
                        {today?.weightLogged
                          ? "Weigh-in recorded"
                          : "Optional morning weigh-in"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Consistency & Standings */}
                <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                    Squad Standings & Consistency
                  </span>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                      <span className="text-xs text-slate-500 font-semibold block">
                        Weekly XP
                      </span>
                      <span className="text-base font-black text-emerald-700">
                        +{leaderboard?.weeklyPoints || 0}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                      <span className="text-xs text-slate-500 font-semibold block">
                        Current Streak
                      </span>
                      <span className="text-base font-black text-amber-600 inline-flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {currentStreak}d
                      </span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                      <span className="text-xs text-slate-500 font-semibold block">
                        Best Streak
                      </span>
                      <span className="text-base font-black text-slate-800 inline-flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-lime-600" />
                        {longestStreak}d
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Earned Badges */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      Unlocked Badges ({badges.length})
                    </h3>
                  </div>

                  {badges.length === 0 ? (
                    <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                      No badges unlocked yet. Keep logging to earn squad trophies!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {badges.map((b) => (
                        <div
                          key={b.code}
                          className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-2.5"
                        >
                          <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
                            <Award className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black text-slate-900 truncate block">
                              {b.name}
                            </span>
                            <span className="text-[10px] text-slate-500 line-clamp-1">
                              {b.description}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 4: Personal Details & Baseline Metrics (Strictly Privacy-Gated) */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-slate-600" />
                    Personal Fitness Details & Metrics
                  </h3>

                  {/* Public Attributes */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Fitness Goal
                      </span>
                      <span className="text-xs font-black text-slate-900 capitalize mt-0.5 block truncate">
                        {personal?.fitnessGoal?.replace("_", " ") || "General Fitness"}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Activity Level
                      </span>
                      <span className="text-xs font-black text-slate-900 capitalize mt-0.5 block truncate">
                        {personal?.activityLevel?.replace("_", " ") || "Moderate"}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Diet Type
                      </span>
                      <span className="text-xs font-black text-slate-900 capitalize mt-0.5 block truncate">
                        {personal?.dietPreference?.replace("_", " ") || "Balanced"}
                      </span>
                    </div>

                    {personal?.height && (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Height
                        </span>
                        <span className="text-xs font-black text-slate-900 mt-0.5 block">
                          {personal.height} cm
                        </span>
                      </div>
                    )}

                    {personal?.targets?.calories && (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Target Calories
                        </span>
                        <span className="text-xs font-black text-slate-900 mt-0.5 block">
                          {personal.targets.calories} kcal
                        </span>
                      </div>
                    )}

                    {personal?.targets?.protein && (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Target Protein
                        </span>
                        <span className="text-xs font-black text-slate-900 mt-0.5 block">
                          {personal.targets.protein}g / day
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Weight Privacy Guarded Box */}
                  <div className="p-4 rounded-3xl border transition-all">
                    {personal?.weight?.isPrivate ? (
                      <div className="flex items-start gap-3 bg-slate-50/90 border-slate-200/90 p-3.5 rounded-2xl">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900">
                            Weight Metrics Kept Private
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            {user?.name || "This member"} has chosen to keep their weight
                            private. Only consistency, habits, and streak milestones are shared
                            with the squad.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <Scale className="w-4 h-4 text-emerald-600" />
                            Weight Progress (Shared)
                          </span>
                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Unlock className="w-2.5 h-2.5" /> Public in Squad
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
                            <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                              Current Weight
                            </span>
                            <span className="text-base font-black text-emerald-950 mt-0.5 block">
                              {personal?.weight?.currentWeight != null
                                ? `${personal.weight.currentWeight} kg`
                                : "Not set"}
                            </span>
                          </div>

                          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
                            <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                              Target Weight
                            </span>
                            <span className="text-base font-black text-emerald-950 mt-0.5 block">
                              {personal?.weight?.targetWeight != null
                                ? `${personal.weight.targetWeight} kg`
                                : "Not set"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Body Measurements Privacy Guarded Box */}
                  <div className="p-4 rounded-3xl border transition-all">
                    {personal?.measurements?.isPrivate ? (
                      <div className="flex items-start gap-3 bg-slate-50/90 border-slate-200/90 p-3.5 rounded-2xl">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900">
                            Body Measurements Kept Private
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            Circumference measurements are kept private in their profile
                            settings.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-indigo-600" />
                            Latest Body Measurements (Shared)
                          </span>
                          <span className="text-[10px] font-black text-indigo-800 bg-indigo-100 border border-indigo-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Unlock className="w-2.5 h-2.5" /> Public in Squad
                          </span>
                        </div>

                        {personal?.measurements?.measurementsCm ? (
                          <div className="grid grid-cols-3 gap-2">
                            {Object.entries(personal.measurements.measurementsCm)
                              .filter(([_, val]) => val != null)
                              .map(([part, val]) => (
                                <div
                                  key={part}
                                  className="p-2.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/60"
                                >
                                  <span className="text-[10px] font-bold uppercase text-indigo-700 capitalize block truncate">
                                    {part}
                                  </span>
                                  <span className="text-xs font-black text-indigo-950 mt-0.5 block">
                                    {val} cm
                                  </span>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">
                            No measurements logged yet.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MemberProfileSheet;

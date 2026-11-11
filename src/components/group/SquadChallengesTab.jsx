import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { groupApi, socialApi } from "../../api/endpoints";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Sheet } from "../ui/Sheet";
import { Skeleton } from "../ui/Skeleton";
import { Avatar } from "../ui/Avatar";
import { haptics } from "../../motion/Haptics";
import {
  Award,
  Plus,
  CheckCircle2,
  Users,
  Calendar,
  Target,
  Trophy,
  Clock,
} from "lucide-react";

const CHALLENGE_FILTERS = [
  { id: "all", label: "All" },
  { id: "joined", label: "Joined" },
  { id: "open", label: "Open to Join" },
];

const getDaysRemainingBadge = (endDate) => {
  if (!endDate) return "Active";
  const today = new Date().toISOString().split("T")[0];
  const diff = Math.ceil(
    (new Date(endDate).getTime() - new Date(today).getTime()) / 86400000
  );
  if (diff < 0) return "Ended";
  if (diff === 0) return "Ends today";
  return `${diff}d left`;
};

export const SquadChallengesTab = ({
  groupId,
  challenges = [],
  isLoading,
}) => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    challengeType: "meal_completion",
    target: 5,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  });

  const { data: standingsData, isLoading: isStandingsLoading } = useQuery({
    queryKey: ["challenge-standings", selectedChallengeId],
    queryFn: async () => {
      if (!selectedChallengeId) return null;
      const res = await socialApi.getChallengeDetails(selectedChallengeId);
      return res.data?.data;
    },
    enabled: !!selectedChallengeId,
  });

  const joinMutation = useMutation({
    mutationFn: (id) => socialApi.joinChallenge(id),
    onSuccess: () => {
      haptics.goal();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#7C3AED", "#84CC16", "#06B6D4"],
      });
      toast.success("Joined challenge! Crush your goal with the squad 🎯");
      queryClient.invalidateQueries({ queryKey: ["group-challenges", groupId] });
      if (selectedChallengeId) {
        queryClient.invalidateQueries({ queryKey: ["challenge-standings", selectedChallengeId] });
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Could not join challenge");
    },
  });

  const createChallengeMutation = useMutation({
    mutationFn: (data) => groupApi.createChallenge(groupId, data),
    onSuccess: () => {
      haptics.goal();
      toast.success("Challenge launched! Squad members can join now.");
      queryClient.invalidateQueries({ queryKey: ["group-challenges", groupId] });
      setShowCreateModal(false);
      setForm({
        title: "",
        description: "",
        challengeType: "meal_completion",
        target: 5,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Could not create challenge");
    },
  });

  const filteredChallenges = useMemo(() => {
    if (filter === "joined") return challenges.filter((c) => c.isJoined);
    if (filter === "open") return challenges.filter((c) => !c.isJoined);
    return challenges;
  }, [challenges, filter]);

  return (
    <div className="space-y-4">
      {/* Header + Launch Challenge Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              Head-to-Head Challenges
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Auto-tracks daily meals, workouts &amp; water targets
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="violet"
          onClick={() => {
            haptics.tick();
            setShowCreateModal(true);
          }}
          className="w-full sm:w-auto min-h-[44px] text-xs font-extrabold shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1 stroke-[2.8]" /> Launch Challenge
        </Button>
      </div>

      {/* Filter Pills */}
      {challenges.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CHALLENGE_FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  haptics.tick();
                  setFilter(f.id);
                }}
                className={`shrink-0 min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  active
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Challenges List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-36 w-full rounded-3xl" />
          <Skeleton className="h-36 w-full rounded-3xl" />
        </div>
      ) : filteredChallenges.length === 0 ? (
        <GlassCard className="p-6 text-center space-y-3 bg-white/95">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 mx-auto flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">
              {challenges.length === 0 ? "No active squad challenges" : "No challenges in this view"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Start a 7-day workout sprint or clean-eating streak for your teammates to join!
            </p>
          </div>
          <Button
            size="sm"
            variant="violet"
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-1" /> Create First Challenge
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filteredChallenges.map((c) => {
            const percent = Math.min(
              100,
              Math.round(((c.myProgress || 0) / Math.max(1, c.target || 1)) * 100)
            );
            const countdownLabel = getDaysRemainingBadge(c.endDate);

            return (
              <GlassCard
                key={c._id}
                glow={c.isJoined ? "violet" : "none"}
                className="p-4 sm:p-5 bg-white/95 border-slate-200/90 space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-black text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                        {c.challengeType?.replace("_", " ")}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Users className="w-3 h-3 text-slate-500" />
                        {c.participantCount || 0} joined
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        {countdownLabel}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      {c.title}
                    </h3>
                    {c.description && (
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {c.description}
                      </p>
                    )}
                    <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {c.startDate} to {c.endDate} · Target {c.target} days
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        haptics.tick();
                        setSelectedChallengeId(c._id);
                      }}
                      className="min-h-[44px] text-xs font-bold w-full sm:w-auto"
                    >
                      <Trophy className="w-3.5 h-3.5 mr-1 text-amber-500" /> Standings
                    </Button>

                    {!c.isJoined ? (
                      <Button
                        size="sm"
                        variant="violet"
                        isLoading={joinMutation.isPending}
                        onClick={() => joinMutation.mutate(c._id)}
                        className="min-h-[44px] text-xs font-extrabold w-full sm:w-auto shadow-xs"
                      >
                        Join &amp; Compete
                      </Button>
                    ) : (
                      <span className="min-h-[44px] px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs text-emerald-800 font-black bg-emerald-100 border border-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" /> Joined
                      </span>
                    )}
                  </div>
                </div>

                {c.isJoined && (
                  <div className="pt-2.5 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-bold text-slate-600">Your Progress</span>
                      <span className="font-black text-emerald-600 tabular-nums">
                        {c.myProgress || 0} / {c.target} days ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full"
                      />
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Standings Sheet Drawer */}
      <Sheet
        open={!!selectedChallengeId}
        onOpenChange={(open) => !open && setSelectedChallengeId(null)}
        title={standingsData?.challenge?.title || "Challenge Standings"}
        description={`Target: ${standingsData?.challenge?.target || 0} days of ${
          standingsData?.challenge?.challengeType?.replace("_", " ") || "activity"
        }`}
      >
        <div className="space-y-2.5 pt-2 pb-3">
          {isStandingsLoading ? (
            <div className="space-y-2.5">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : (standingsData?.standings || []).length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              No participants yet.
            </p>
          ) : (
            (standingsData?.standings || []).map((s, idx) => (
              <div
                key={s.userId}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-6 text-center font-black text-xs text-slate-500 shrink-0">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                  </span>
                  <Avatar
                    src={s.profileImage || s.avatar}
                    name={s.name}
                    size="sm"
                    ringColor={idx === 0 ? "lime" : "violet"}
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-slate-900 text-sm truncate">
                      {s.name}
                    </h4>
                    <div className="w-full max-w-[160px] h-2 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, s.percent || 0)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-emerald-600 tabular-nums">
                    {s.progress} / {s.target}
                  </span>
                  {s.completed && (
                    <span className="block text-[10px] text-emerald-700 font-bold">
                      Done! 🎯
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Sheet>

      {/* Create Challenge Sheet Drawer */}
      <Sheet
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Launch Squad Challenge"
        description="Pick a goal and timeframe for teammates to compete"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createChallengeMutation.mutate(form);
          }}
          className="space-y-4 pt-2 pb-3"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Challenge Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 7-Day Clean Eating Sprint"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full min-h-[46px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Rules / Description
            </label>
            <input
              type="text"
              placeholder="What counts toward this challenge?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full min-h-[46px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Activity Type
              </label>
              <select
                value={form.challengeType}
                onChange={(e) => setForm({ ...form, challengeType: e.target.value })}
                className="w-full min-h-[46px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
              >
                <option value="meal_completion">Meal Completion</option>
                <option value="workout_days">Workout Days</option>
                <option value="water_goal">Water Goal Hit</option>
                <option value="streak">Consistency Streak</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Target Days
              </label>
              <input
                type="number"
                min={1}
                max={30}
                required
                value={form.target}
                onChange={(e) => setForm({ ...form, target: Number(e.target.value) })}
                className="w-full min-h-[46px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Start Date
              </label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full min-h-[46px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                End Date
              </label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full min-h-[46px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="violet"
            isLoading={createChallengeMutation.isPending}
            className="w-full min-h-[48px] text-sm font-extrabold shadow-md"
          >
            Launch Challenge
          </Button>
        </form>
      </Sheet>
    </div>
  );
};

export default SquadChallengesTab;

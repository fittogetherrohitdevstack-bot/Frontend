import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupApi, socialApi } from "../api/endpoints";
import { useGroup } from "../context/GroupContext";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Sheet } from "../components/ui/Sheet";
import { Skeleton } from "../components/ui/Skeleton";
import { Avatar } from "../components/ui/Avatar";
import {
  Award,
  Plus,
  CheckCircle2,
  Users,
  Calendar,
  ArrowRight,
  Sparkles,
  Trophy,
  Target,
  Flame,
} from "lucide-react";
import { motion } from "motion/react";
import { haptics } from "../motion/Haptics";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export const ChallengesPage = () => {
  const queryClient = useQueryClient();
  const { activeGroup } = useGroup();
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

  const { data: challenges, isLoading } = useQuery({
    queryKey: ["group-challenges", activeGroup?._id],
    queryFn: async () => {
      if (!activeGroup?._id) return [];
      const res = await groupApi.getChallenges(activeGroup._id);
      return res.data?.data?.challenges || [];
    },
    enabled: !!activeGroup?._id,
  });

  // Challenge details standings query
  const { data: standingsData } = useQuery({
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
      queryClient.invalidateQueries({ queryKey: ["group-challenges"] });
    },
  });

  const createChallengeMutation = useMutation({
    mutationFn: (data) => groupApi.createChallenge(activeGroup._id, data),
    onSuccess: () => {
      haptics.goal();
      toast.success("Challenge launched! Invite squad members to join.");
      queryClient.invalidateQueries({ queryKey: ["group-challenges"] });
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
  });

  if (!activeGroup) {
    return (
      <GlassCard className="text-center py-12 px-6 max-w-md mx-auto bg-white/95 border-slate-200 mt-6 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-purple-100 border border-purple-300 text-purple-700 flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Join a squad for challenges</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4 leading-relaxed">
          Collective challenges let you achieve daily targets alongside your teammates.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black uppercase tracking-wider border border-purple-300">
              <Award className="w-3.5 h-3.5 stroke-[2.5]" />
              Squad Challenges
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Collective Goals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Progress tracks automatically whenever you log your meals, workouts, or water.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            haptics.tick();
            setShowCreateModal(true);
          }}
          className="text-xs font-bold shadow-md self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 mr-1 stroke-[3]" /> Create Challenge
        </Button>
      </div>

      {/* Challenges List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
          </div>
        ) : challenges.length === 0 ? (
          <GlassCard className="text-center py-12 bg-white/95 border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6" />
            </div>
            <p className="text-slate-600 font-bold text-sm">No active challenges</p>
            <p className="text-slate-400 text-xs mt-1">Tap the button above to launch one for your squad!</p>
          </GlassCard>
        ) : (
          challenges.map((c) => {
            const percent = Math.min(100, Math.round(((c.myProgress || 0) / c.target) * 100));

            return (
              <GlassCard
                key={c._id}
                className="p-5 sm:p-6 bg-white/95 border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.06)] space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] uppercase font-black text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-300">
                        {c.challengeType.replace("_", " ")}
                      </span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {c.startDate} to {c.endDate}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1">{c.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xl">{c.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        haptics.tick();
                        setSelectedChallengeId(c._id);
                      }}
                      className="text-xs font-bold"
                    >
                      Standings
                    </Button>
                    {!c.isJoined ? (
                      <Button
                        size="sm"
                        isLoading={joinMutation.isPending}
                        onClick={() => joinMutation.mutate(c._id)}
                        className="text-xs font-bold shadow-xs"
                      >
                        Join Challenge
                      </Button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-800 font-black bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" /> Participating
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {c.isJoined && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-bold text-slate-600">Your Progress</span>
                      <span className="font-black text-emerald-600 tabular-nums">
                        {c.myProgress} / {c.target} days ({percent}%)
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
          })
        )}
      </div>

      {/* Standings Sheet Drawer */}
      <Sheet
        open={!!selectedChallengeId}
        onOpenChange={(open) => !open && setSelectedChallengeId(null)}
        title={standingsData?.challenge?.title || "Challenge Standings"}
        description={`Target: ${standingsData?.challenge?.target || 0} days of ${
          standingsData?.challenge?.challengeType?.replace("_", " ") || "activity"
        }`}
      >
        <div className="space-y-3 pt-2">
          {(standingsData?.standings || []).map((s, idx) => (
            <div
              key={s.userId}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center font-black text-xs text-slate-400">#{idx + 1}</span>
                <Avatar src={s.profileImage || s.avatar} name={s.name} size="sm" ringColor="violet" />
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{s.name}</h4>
                  <div className="w-28 sm:w-40 h-2 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full"
                      style={{ width: `${s.percent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-black text-emerald-600 tabular-nums">
                  {s.progress} / {s.target}
                </span>
                {s.completed && (
                  <span className="block text-[10px] text-emerald-700 font-bold">Completed! 🎯</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Sheet>

      {/* Create Challenge Modal */}
      <Sheet
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Create Group Challenge"
        description="Pick a target and timeframe for your squad"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createChallengeMutation.mutate(form);
          }}
          className="space-y-4 pt-2"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 7-Day Clean Eating Sprint"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full min-h-[46px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Description
            </label>
            <input
              type="text"
              placeholder="What must members achieve?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full min-h-[46px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Type
              </label>
              <select
                value={form.challengeType}
                onChange={(e) => setForm({ ...form, challengeType: e.target.value })}
                className="w-full min-h-[46px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
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
                className="w-full min-h-[46px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Start Date
              </label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full min-h-[46px] px-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
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
                className="w-full min-h-[46px] px-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
              />
            </div>
          </div>

          <Button
            type="submit"
            isLoading={createChallengeMutation.isPending}
            className="w-full min-h-[46px] shadow-md"
          >
            Launch Challenge
          </Button>
        </form>
      </Sheet>
    </div>
  );
};

export default ChallengesPage;


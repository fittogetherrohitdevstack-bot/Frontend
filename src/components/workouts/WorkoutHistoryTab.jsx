import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { workoutApi } from "../../api/endpoints";
import { GlassCard } from "../ui/GlassCard";
import { Skeleton } from "../ui/Skeleton";
import {
  Calendar,
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Trophy,
} from "lucide-react";
import { haptics } from "../../motion/Haptics";
import { motion, AnimatePresence } from "motion/react";

const MUSCLE_OPTIONS = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Legs",
  "Abs",
  "Full Body",
];

export const WorkoutHistoryTab = () => {
  const [selectedMuscle, setSelectedMuscle] = useState("All");
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  const { data: historyData, isLoading } = useQuery({
    queryKey: ["workout-history", selectedMuscle],
    queryFn: async () => {
      const res = await workoutApi.getHistory({
        muscle: selectedMuscle !== "All" ? selectedMuscle : undefined,
        limit: 30,
      });
      return res.data?.data?.sessions || [];
    },
  });

  const toggleExpand = (id) => {
    haptics.tick();
    setExpandedSessionId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      {/* Filters Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Workout History & Logs
          </h2>
          <p className="text-xs text-slate-500">
            Review your past workout sessions, exercises, sets, weights, and reps
          </p>
        </div>

        {/* Muscle Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Filter:</span>
          <select
            value={selectedMuscle}
            onChange={(e) => setSelectedMuscle(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
          >
            {MUSCLE_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m === "All" ? "All Muscles" : m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History Session Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : historyData?.length === 0 ? (
        <GlassCard className="p-8 text-center bg-white/95 border-slate-200">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
          <h3 className="font-extrabold text-slate-800 text-sm">No workout history found</h3>
          <p className="text-xs text-slate-400 mt-1">
            Completed workouts will automatically appear here with full set breakdowns.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {historyData.map((session) => {
            const isExpanded = expandedSessionId === session._id;
            const completedSets = session.exercises?.reduce(
              (acc, ex) => acc + (ex.sets?.filter((s) => s.completed).length || 0),
              0
            );

            return (
              <GlassCard
                key={session._id}
                className="p-4 sm:p-5 bg-white/95 border-slate-200 shadow-2xs hover:border-purple-200 transition-all cursor-pointer"
                onClick={() => toggleExpand(session._id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <Dumbbell className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-purple-700 font-mono">
                          {session.date}
                        </span>
                        {session.targetMuscles && session.targetMuscles.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                            {session.targetMuscles[0]}
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                        {session.workoutName || "Workout Session"}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-3 text-xs text-slate-600 font-medium">
                      <span>{session.durationMinutes || 0} mins</span>
                      <span>•</span>
                      <span>{session.totalVolumeKg || 0} kg</span>
                      <span>•</span>
                      <span>{completedSets || 0} sets</span>
                    </div>

                    <button
                      type="button"
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Session Breakdown */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-100 space-y-3 cursor-default"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Metric Summary Strip */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            Volume
                          </span>
                          <span className="font-black text-slate-800">
                            {session.totalVolumeKg || 0} kg
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            Duration
                          </span>
                          <span className="font-black text-slate-800">
                            {session.durationMinutes || 0} mins
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            Calories
                          </span>
                          <span className="font-black text-slate-800">
                            ~{session.caloriesBurned || 0} kcal
                          </span>
                        </div>
                      </div>

                      {/* Exercises Details */}
                      <div className="space-y-2">
                        {session.exercises?.map((ex, exIdx) => (
                          <div
                            key={exIdx}
                            className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1.5"
                          >
                            <span className="font-extrabold text-xs text-slate-900 block">
                              {ex.name}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {ex.sets?.map((set, sIdx) => (
                                <span
                                  key={sIdx}
                                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
                                    set.completed
                                      ? "bg-white text-emerald-800 border-emerald-200"
                                      : "bg-slate-100 text-slate-400 border-slate-200"
                                  }`}
                                >
                                  #{set.setNumber}: {set.weight}kg × {set.reps}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {session.notes && (
                        <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs text-purple-900 font-medium">
                          💬 {session.notes}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkoutHistoryTab;

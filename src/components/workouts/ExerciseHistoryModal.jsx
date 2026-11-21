import React from "react";
import { useQuery } from "@tanstack/react-query";
import { workoutApi } from "../../api/endpoints";
import { ExerciseMedia } from "./ExerciseMedia";
import { Button } from "../ui/Button";
import {
  Trophy,
  Calendar,
  Dumbbell,
  TrendingUp,
  X,
  Flame,
  Clock,
  Sparkles,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "motion/react";
import { haptics } from "../../motion/Haptics";

export const ExerciseHistoryModal = ({
  open,
  onClose,
  exerciseName,
  exerciseId = null,
}) => {
  const identifier = exerciseId || exerciseName;

  const { data: historyData, isLoading } = useQuery({
    queryKey: ["exercise-history", identifier],
    queryFn: async () => {
      if (!identifier) return null;
      const res = await workoutApi.getExerciseHistory(identifier);
      return res.data?.data;
    },
    enabled: Boolean(open && identifier),
  });

  if (!open) return null;

  const history = historyData?.history || [];
  const pr = historyData?.personalRecord;
  const exercise = historyData?.exercise;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="w-full max-w-xl max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base leading-tight">
                {exerciseName} History
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {history.length > 0
                  ? `${history.length} completed sessions logged`
                  : "Performance tracking & record breakdown"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Personal Record Hero Banner */}
          {pr && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 opacity-90">
                  <Sparkles className="w-3.5 h-3.5" /> All-Time Personal Record
                </span>
                {pr.achievedAt && (
                  <span className="text-[10px] font-bold opacity-80">
                    Achieved: {new Date(pr.achievedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs">
                  <span className="text-[10px] uppercase font-bold opacity-80 block">Max Weight</span>
                  <span className="text-xl font-black">{pr.bestWeight || 0} kg</span>
                </div>
                <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs">
                  <span className="text-[10px] uppercase font-bold opacity-80 block">Best Reps</span>
                  <span className="text-xl font-black">{pr.bestReps || 0}</span>
                </div>
                <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs">
                  <span className="text-[10px] uppercase font-bold opacity-80 block">Est. 1RM</span>
                  <span className="text-xl font-black">
                    {Math.round(pr.estimatedOneRepMax || 0)} kg
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Chronological Sessions Timeline */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-600" /> Previous Sessions Log
            </h4>

            {isLoading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center space-y-2 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <Dumbbell className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-extrabold text-slate-700 text-sm">No previous history yet</p>
                <p className="text-xs text-slate-500">
                  First time performing this exercise! Complete your sets today to build your progression timeline.
                </p>
              </div>
            ) : (
              history.map((session, sIdx) => (
                <div
                  key={session.sessionId || sIdx}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-purple-200 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-800">
                        {session.date}
                      </span>
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                        {session.workoutName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px]">
                      <span>Volume: {session.totalVolumeKg} kg</span>
                      <span>•</span>
                      <span className="text-amber-700 font-black">
                        Top: {session.maxWeight} kg
                      </span>
                    </div>
                  </div>

                  {/* Sets Pill Grid */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {(session.sets || []).map((set, sNo) => (
                      <span
                        key={sNo}
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 border ${
                          set.isPR
                            ? "bg-amber-100 border-amber-300 text-amber-800 font-black"
                            : "bg-white border-slate-200 text-slate-700"
                        }`}
                      >
                        <span className="text-[10px] text-slate-400 font-semibold">
                          #{set.setNumber || sNo + 1}:
                        </span>
                        {set.weight} kg × {set.reps}
                        {set.isPR && <Sparkles className="w-3 h-3 text-amber-600" />}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ExerciseHistoryModal;

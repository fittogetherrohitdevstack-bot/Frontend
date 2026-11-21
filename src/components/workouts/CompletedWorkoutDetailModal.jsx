import React from "react";
import { Sheet } from "../ui/Sheet";
import { Button } from "../ui/Button";
import { ExerciseMedia } from "./ExerciseMedia";
import {
  Calendar,
  Clock,
  Dumbbell,
  Flame,
  Trophy,
  Edit2,
  Trash2,
  Check,
  Sparkles,
  Share2,
  Layers,
  X,
  ChevronRight,
} from "lucide-react";
import { haptics } from "../../motion/Haptics";

export const CompletedWorkoutDetailModal = ({
  session,
  open,
  onOpenChange,
  onEditWorkout,
  onDeleteWorkout,
}) => {
  if (!session) return null;

  const totalCompletedSets = (session.exercises || []).reduce(
    (acc, ex) => acc + (ex.sets || []).filter((s) => s.completed !== false).length,
    0
  );

  const planName = session.workoutPlanId?.name || (typeof session.workoutPlanId === "string" ? "Custom Plan" : null);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={session.workoutName || "Completed Workout"}
      description={`${session.date} • ${session.durationMinutes || 0} minutes`}
    >
      <div className="space-y-5 pb-8">
        {/* Top Summary Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 text-white shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1.5 opacity-90">
              <Calendar className="w-3.5 h-3.5" /> {session.date}
            </span>
            {planName && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider backdrop-blur-xs">
                {planName}
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-xs">
              <span className="text-[9px] uppercase font-bold opacity-80 block">Volume</span>
              <span className="text-base sm:text-lg font-black">{session.totalVolumeKg || 0} kg</span>
            </div>
            <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-xs">
              <span className="text-[9px] uppercase font-bold opacity-80 block">Sets</span>
              <span className="text-base sm:text-lg font-black">{totalCompletedSets}</span>
            </div>
            <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-xs">
              <span className="text-[9px] uppercase font-bold opacity-80 block">Reps</span>
              <span className="text-base sm:text-lg font-black">{session.totalReps || 0}</span>
            </div>
            <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-xs">
              <span className="text-[9px] uppercase font-bold opacity-80 block">Burn</span>
              <span className="text-base sm:text-lg font-black">~{session.caloriesBurned || 0}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              haptics.tick();
              onEditWorkout(session);
            }}
            className="w-full justify-center text-xs font-black min-h-[44px] shadow-xs"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Workout
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              haptics.tick();
              onDeleteWorkout(session);
            }}
            className="w-full justify-center text-xs font-black min-h-[44px] text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Workout
          </Button>
        </div>

        {/* Workout Session Notes */}
        {session.notes && (
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-xs text-purple-950 font-medium">
            <span className="font-bold block text-purple-900 mb-0.5">Session Notes:</span>
            {session.notes}
          </div>
        )}

        {/* Exercises Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Exercises Performed ({(session.exercises || []).length})</span>
            {session.targetMuscles && session.targetMuscles.length > 0 && (
              <span className="text-purple-700 font-bold text-[10px]">
                {session.targetMuscles.join(" • ")}
              </span>
            )}
          </h3>

          <div className="space-y-3">
            {(session.exercises || []).map((ex, exIdx) => {
              const completedCount = (ex.sets || []).filter((s) => s.completed !== false).length;
              return (
                <div
                  key={exIdx}
                  className="p-3.5 sm:p-4 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">
                          {ex.name}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {ex.primaryMuscle || "Full Body"} • {completedCount} sets done
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sets Table */}
                  <div className="space-y-1.5 pt-1">
                    <div className="grid grid-cols-12 gap-1 text-[9px] font-black uppercase text-slate-400 px-1">
                      <span className="col-span-2 text-center">Set</span>
                      <span className="col-span-4 text-center">Weight</span>
                      <span className="col-span-3 text-center">Reps</span>
                      <span className="col-span-3 text-center">Status</span>
                    </div>

                    {(ex.sets || []).map((set, sIdx) => {
                      const isComplete = set.completed !== false;
                      return (
                        <div
                          key={sIdx}
                          className={`grid grid-cols-12 gap-1 items-center p-2 rounded-xl text-xs font-bold ${
                            isComplete
                              ? "bg-white border border-slate-200/80 text-slate-800"
                              : "bg-slate-100/70 text-slate-400 border border-transparent"
                          }`}
                        >
                          <span className="col-span-2 text-center font-mono font-black text-slate-500 text-[11px]">
                            #{set.setNumber || sIdx + 1}
                          </span>
                          <span className="col-span-4 text-center font-black">
                            {set.weight || 0} kg
                          </span>
                          <span className="col-span-3 text-center">
                            {set.reps || 0}
                          </span>
                          <div className="col-span-3 flex items-center justify-center gap-1">
                            {isComplete ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                                <Check className="w-3 h-3 stroke-[3]" /> Done
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Skipped</span>
                            )}
                            {set.isPR && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {ex.notes && (
                    <div className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200/60 font-medium">
                      Note: {ex.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Sheet>
  );
};

export default CompletedWorkoutDetailModal;

import React, { useState } from "react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { ExerciseMedia } from "./ExerciseMedia";
import {
  Plus,
  Minus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Dumbbell,
  History,
  RotateCcw,
  Check,
  Info,
  Repeat,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";

export const LiveWorkoutExerciseCard = ({
  exercise,
  exIdx,
  onToggleSet,
  onUpdateSet,
  onStepValue,
  onAddSet,
  onRemoveSet,
  onCopyPreviousSet,
  onCopyAllPreviousSets,
  onRemoveExercise,
  onReplaceExercise,
  onInspectExercise,
  onViewHistory,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showNotes, setShowNotes] = useState(Boolean(exercise.notes));
  const [dismissSuggestion, setDismissSuggestion] = useState(false);

  const prevPerf = exercise.previousPerformance;
  const prevSets = prevPerf?.sets || [];
  const hasPrevious = Boolean(prevPerf && prevSets.length > 0);

  const completedSetsCount = (exercise.sets || []).filter((s) => s.completed).length;
  const totalSetsCount = (exercise.sets || []).length;

  return (
    <GlassCard className="p-3.5 sm:p-5 border-slate-200/90 shadow-sm space-y-4 rounded-3xl">
      {/* Exercise Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200/80 overflow-hidden shrink-0 flex items-center justify-center">
            {exercise.videoUrl || exercise.gifUrl ? (
              <ExerciseMedia
                exercise={exercise}
                autoPlay={false}
                showControls={false}
                aspectRatio="aspect-square"
                className="w-full h-full object-cover"
              />
            ) : (
              <Dumbbell className="w-6 h-6 text-purple-600" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-slate-900 text-base leading-tight truncate">
              {exercise.name}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                {exercise.primaryMuscle || "Full Body"}
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                • {completedSetsCount}/{totalSetsCount} Sets Completed
              </span>
            </div>
          </div>
        </div>

        {/* Top Exercise Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            title="View Demonstration & Form Guide"
            onClick={() => onInspectExercise?.(exercise)}
            className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 hover:text-purple-600 hover:bg-purple-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Replace Exercise with Alternative"
            onClick={() => onReplaceExercise?.(exIdx)}
            className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-indigo-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Repeat className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Remove Exercise from Workout"
            onClick={() => onRemoveExercise?.(exIdx)}
            className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse exercise" : "Expand exercise"}
            className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3.5 pt-1">
          {/* Previous Performance Panel */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-purple-600" /> Previous Performance
              </span>
              <button
                type="button"
                onClick={() => onViewHistory?.(exercise.name, exercise.exerciseId)}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
              >
                Full History →
              </button>
            </div>

            {hasPrevious ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                  <span className="font-extrabold text-slate-800">
                    {prevPerf.lastDate}{" "}
                    <span className="text-slate-400 font-normal">
                      • {prevPerf.workoutName || "Workout"}
                    </span>
                  </span>
                  <span className="text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                    Top: {prevPerf.bestWeight} kg ({prevPerf.totalVolumeKg} kg vol)
                  </span>
                </div>

                {/* Previous Sets Breakdown Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {prevSets.map((ps, psIdx) => (
                    <span
                      key={psIdx}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center gap-1"
                    >
                      <span className="text-[9px] text-slate-400">#{ps.setNumber || psIdx + 1}:</span>
                      {ps.weight} kg × {ps.reps}
                    </span>
                  ))}
                </div>

                {/* Progressive Overload Suggestion */}
                {!dismissSuggestion && prevPerf.bestWeight > 0 && (
                  <div className="p-2 rounded-xl bg-purple-50/80 border border-purple-200/80 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-purple-800 font-bold min-w-0">
                      <Lightbulb className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="truncate">
                        Last time: {prevPerf.bestWeight} kg. Try matching or adding 1 rep today!
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDismissSuggestion(true)}
                      className="text-purple-400 hover:text-purple-700 text-xs font-bold shrink-0 p-0.5"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-medium">
                First time performing this exercise. Your progress starts today!
              </p>
            )}
          </div>

          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center gap-2">
            {hasPrevious && (
              <button
                type="button"
                onClick={() => {
                  haptics.selection();
                  onCopyAllPreviousSets?.(exIdx);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs flex items-center gap-1.5 border border-purple-200/80 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Use Previous Sets
              </button>
            )}
            <button
              type="button"
              onClick={() => onAddSet?.(exIdx)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center gap-1 border border-slate-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Set
            </button>
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
            >
              {showNotes ? "Hide Notes" : "+ Add Note"}
            </button>
          </div>

          {/* Optional Notes Input */}
          {showNotes && (
            <input
              type="text"
              placeholder="Exercise notes (e.g. paused at chest, 2nd pin on rack)..."
              value={exercise.notes || ""}
              onChange={(e) => onUpdateSet?.(exIdx, null, "exerciseNotes", e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-purple-400 font-medium text-slate-800"
            />
          )}

          {/* Current Workout Sets Table */}
          <div className="space-y-2">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
              <span className="col-span-2 text-center">Set</span>
              <span className="col-span-2 text-center">Prev</span>
              <span className="col-span-4 text-center">Weight (kg)</span>
              <span className="col-span-2 text-center">Reps</span>
              <span className="col-span-2 text-center">Done</span>
            </div>

            {/* Set Rows */}
            {(exercise.sets || []).map((set, setIdx) => {
              const matchedPrevSet = prevSets[setIdx];
              const prevDisplay = matchedPrevSet
                ? `${matchedPrevSet.weight} × ${matchedPrevSet.reps}`
                : set.previousWeight > 0
                ? `${set.previousWeight} × ${set.previousReps}`
                : "—";

              return (
                <div
                  key={set.setNumber || setIdx}
                  className={`grid grid-cols-12 gap-1 items-center p-1.5 rounded-2xl transition-all ${
                    set.completed
                      ? "bg-emerald-50/80 border border-emerald-200/90"
                      : "bg-slate-50/70 border border-slate-200/70 hover:bg-slate-100/60"
                  }`}
                >
                  {/* Set Number & Copy Single */}
                  <div className="col-span-2 flex items-center justify-center gap-1 font-mono font-black text-xs text-slate-700">
                    <span>{set.setNumber || setIdx + 1}</span>
                    {setIdx > 0 && !set.completed && (
                      <button
                        type="button"
                        title="Copy values from set above"
                        onClick={() => onCopyPreviousSet?.(exIdx, setIdx)}
                        className="p-0.5 rounded text-slate-400 hover:text-purple-600"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Previous Performance Tag */}
                  <div className="col-span-2 text-center">
                    <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200/80 px-1 py-0.5 rounded-md block truncate">
                      {prevDisplay}
                    </span>
                  </div>

                  {/* Weight Input with Steppers */}
                  <div className="col-span-4 flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={set.completed}
                      onClick={() => onStepValue?.(exIdx, setIdx, "weight", -2.5)}
                      className="w-6 sm:w-7 h-9 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs hover:bg-slate-100 disabled:opacity-40 cursor-pointer shrink-0"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.5"
                      inputMode="decimal"
                      disabled={set.completed}
                      value={set.weight}
                      onChange={(e) => onUpdateSet?.(exIdx, setIdx, "weight", e.target.value)}
                      className="w-full text-center h-9 rounded-lg bg-white border border-slate-200 font-black text-xs sm:text-sm focus:outline-none focus:border-purple-400 disabled:bg-slate-100"
                    />
                    <button
                      type="button"
                      disabled={set.completed}
                      onClick={() => onStepValue?.(exIdx, setIdx, "weight", 2.5)}
                      className="w-6 sm:w-7 h-9 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs hover:bg-slate-100 disabled:opacity-40 cursor-pointer shrink-0"
                    >
                      +
                    </button>
                  </div>

                  {/* Reps Input with Steppers */}
                  <div className="col-span-2 flex items-center gap-0.5">
                    <input
                      type="number"
                      inputMode="numeric"
                      disabled={set.completed}
                      value={set.reps}
                      onChange={(e) => onUpdateSet?.(exIdx, setIdx, "reps", e.target.value)}
                      className="w-full text-center h-9 rounded-lg bg-white border border-slate-200 font-black text-xs sm:text-sm focus:outline-none focus:border-purple-400 disabled:bg-slate-100"
                    />
                  </div>

                  {/* Completion Checkbox & Delete */}
                  <div className="col-span-2 flex items-center justify-center gap-1">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      type="button"
                      aria-label={`Complete set ${set.setNumber || setIdx + 1}`}
                      onClick={() => onToggleSet?.(exIdx, setIdx)}
                      className={`min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        set.completed
                          ? "bg-gradient-to-tr from-emerald-500 to-lime-500 text-white shadow-xs"
                          : "bg-white border-2 border-slate-300 text-transparent hover:border-purple-400"
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </motion.button>
                    {(exercise.sets || []).length > 1 && !set.completed && (
                      <button
                        type="button"
                        onClick={() => onRemoveSet?.(exIdx, setIdx)}
                        className="text-slate-300 hover:text-rose-500 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default LiveWorkoutExerciseCard;

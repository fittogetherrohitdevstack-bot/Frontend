import React, { useState } from "react";
import { GlassCard } from "../ui/GlassCard";
import { ExerciseMedia } from "./ExerciseMedia";
import {
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  History,
  Check,
  Info,
  Repeat,
  Lightbulb,
  Play,
  Film,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../../motion/Haptics";

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
  const [showDemo, setShowDemo] = useState(false);
  const [showNotes, setShowNotes] = useState(Boolean(exercise.notes));
  const [dismissSuggestion, setDismissSuggestion] = useState(false);

  const prevPerf = exercise.previousPerformance;
  const prevSets = prevPerf?.sets || [];
  const hasPrevious = Boolean(prevPerf && prevSets.length > 0);

  const completedSetsCount = (exercise.sets || []).filter((s) => s.completed).length;
  const totalSetsCount = (exercise.sets || []).length;

  const hasMedia = Boolean(
    exercise.videoUrl ||
      exercise.videoUrlFemale ||
      exercise.gifUrl ||
      (exercise.images && exercise.images.length > 0)
  );

  return (
    <GlassCard className="p-3.5 sm:p-5 border-slate-200/90 shadow-sm space-y-3.5 rounded-3xl">
      {/* Exercise Header */}
      <div className="flex items-start justify-between gap-2.5">
        <div
          onClick={() => {
            if (hasMedia) {
              haptics.tick();
              setShowDemo(!showDemo);
            }
          }}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
        >
          {/* Media Thumbnail with Play Overlay */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-50 border border-purple-200/80 overflow-hidden shrink-0 flex items-center justify-center relative shadow-2xs group-hover:border-purple-400 transition-colors">
            {hasMedia ? (
              <>
                <ExerciseMedia
                  exercise={exercise}
                  autoPlay={false}
                  showControls={false}
                  aspectRatio="aspect-square"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-white/90 text-purple-700 flex items-center justify-center shadow-xs">
                    <Play className="w-2.5 h-2.5 fill-purple-700 ml-0.5" />
                  </div>
                </div>
              </>
            ) : (
              <Dumbbell className="w-6 h-6 text-purple-600" />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate group-hover:text-purple-700 transition-colors">
              {exercise.name}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                {exercise.primaryMuscle || "Full Body"}
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                • {completedSetsCount}/{totalSetsCount} Sets Done
              </span>
            </div>
          </div>
        </div>

        {/* Top Exercise Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            title="Form & Instructions"
            onClick={() => onInspectExercise?.(exercise)}
            className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 hover:text-purple-600 hover:bg-purple-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Replace Exercise"
            onClick={() => onReplaceExercise?.(exIdx)}
            className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-indigo-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Repeat className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Remove Exercise"
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

      {/* Form Demo Video/GIF Toggle Button */}
      {hasMedia && (
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setShowDemo(!showDemo);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
              showDemo
                ? "bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-600/25"
                : "bg-purple-50/90 text-purple-800 hover:bg-purple-100 border-purple-200/90"
            }`}
          >
            <div className="flex items-center gap-2">
              <Film className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{showDemo ? "Hide Form Demonstration" : "Watch Video / GIF Demo"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {exercise.videoUrl ? (
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    showDemo ? "bg-white/20 text-white" : "bg-purple-200 text-purple-900"
                  }`}
                >
                  HD Video
                </span>
              ) : exercise.gifUrl ? (
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    showDemo ? "bg-white/20 text-white" : "bg-purple-200 text-purple-900"
                  }`}
                >
                  Animated GIF
                </span>
              ) : null}
              {showDemo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {/* Embedded Media Player */}
          <AnimatePresence>
            {showDemo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2.5 rounded-2xl overflow-hidden border border-purple-200 shadow-md bg-slate-950"
              >
                <ExerciseMedia
                  exercise={exercise}
                  autoPlay={true}
                  showControls={true}
                  aspectRatio="aspect-video"
                  className="w-full max-h-[320px]"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {isExpanded && (
        <div className="space-y-3 pt-1">
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

          {/* Mobile-First Sets List */}
          <div className="space-y-2 pt-1">
            {(exercise.sets || []).map((set, setIdx) => {
              const matchedPrevSet = prevSets[setIdx];
              const prevDisplay = matchedPrevSet
                ? `${matchedPrevSet.weight} kg × ${matchedPrevSet.reps}`
                : set.previousWeight > 0
                ? `${set.previousWeight} kg × ${set.previousReps}`
                : "—";

              return (
                <div
                  key={set.setNumber || setIdx}
                  className={`p-2 sm:p-2.5 rounded-2xl border transition-all ${
                    set.completed
                      ? "bg-emerald-50/80 border-emerald-300 shadow-2xs"
                      : "bg-white border-slate-200/90 shadow-2xs hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {/* Set Number Badge */}
                    <div className="w-8 sm:w-10 text-center shrink-0">
                      <span
                        className={`text-xs font-black px-1.5 py-1 rounded-xl block ${
                          set.completed
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        #{set.setNumber || setIdx + 1}
                      </span>
                    </div>

                    {/* Weight Input with Steppers */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50/80 overflow-hidden focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400">
                        <button
                          type="button"
                          disabled={set.completed}
                          onClick={() => onStepValue?.(exIdx, setIdx, "weight", -2.5)}
                          className="w-7 sm:w-8 h-10 flex items-center justify-center font-black text-xs sm:text-sm text-slate-600 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 shrink-0 cursor-pointer"
                        >
                          -
                        </button>
                        <div className="flex-1 min-w-0 text-center">
                          <input
                            type="number"
                            step="0.5"
                            inputMode="decimal"
                            disabled={set.completed}
                            value={set.weight}
                            onChange={(e) => onUpdateSet?.(exIdx, setIdx, "weight", e.target.value)}
                            className="w-full text-center bg-transparent font-black text-xs sm:text-sm focus:outline-none disabled:text-slate-500 py-1"
                          />
                          <span className="text-[9px] font-bold uppercase text-slate-400 block -mt-1">
                            kg
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={set.completed}
                          onClick={() => onStepValue?.(exIdx, setIdx, "weight", 2.5)}
                          className="w-7 sm:w-8 h-10 flex items-center justify-center font-black text-xs sm:text-sm text-slate-600 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 shrink-0 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Reps Input with Steppers */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50/80 overflow-hidden focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400">
                        <button
                          type="button"
                          disabled={set.completed}
                          onClick={() => onStepValue?.(exIdx, setIdx, "reps", -1)}
                          className="w-7 sm:w-8 h-10 flex items-center justify-center font-black text-xs sm:text-sm text-slate-600 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 shrink-0 cursor-pointer"
                        >
                          -
                        </button>
                        <div className="flex-1 min-w-0 text-center">
                          <input
                            type="number"
                            inputMode="numeric"
                            disabled={set.completed}
                            value={set.reps}
                            onChange={(e) => onUpdateSet?.(exIdx, setIdx, "reps", e.target.value)}
                            className="w-full text-center bg-transparent font-black text-xs sm:text-sm focus:outline-none disabled:text-slate-500 py-1"
                          />
                          <span className="text-[9px] font-bold uppercase text-slate-400 block -mt-1">
                            reps
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={set.completed}
                          onClick={() => onStepValue?.(exIdx, setIdx, "reps", 1)}
                          className="w-7 sm:w-8 h-10 flex items-center justify-center font-black text-xs sm:text-sm text-slate-600 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 shrink-0 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Touch-Friendly Completion Button */}
                    <div className="shrink-0 flex items-center gap-1">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        aria-label={`Complete set ${set.setNumber || setIdx + 1}`}
                        onClick={() => onToggleSet?.(exIdx, setIdx)}
                        className={`w-11 h-10 sm:w-12 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          set.completed
                            ? "bg-gradient-to-tr from-emerald-500 to-lime-500 text-white shadow-md shadow-emerald-500/25"
                            : "bg-slate-100 hover:bg-purple-50 text-slate-400 hover:text-purple-600 border border-slate-200"
                        }`}
                      >
                        <Check
                          className={`w-5 h-5 stroke-[3] ${set.completed ? "text-white" : ""}`}
                        />
                      </motion.button>
                    </div>
                  </div>

                  {/* Sub-row: Previous target & Set actions */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1 mt-1 border-t border-slate-100">
                    {prevDisplay !== "—" ? (
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                        <History className="w-3 h-3 text-purple-600" />
                        Prev: <strong className="text-slate-700">{prevDisplay}</strong>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">First time set</span>
                    )}

                    <div className="flex items-center gap-2">
                      {setIdx > 0 && !set.completed && (
                        <button
                          type="button"
                          onClick={() => onCopyPreviousSet?.(exIdx, setIdx)}
                          className="text-[10px] font-bold text-purple-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> Copy previous set
                        </button>
                      )}
                      {(exercise.sets || []).length > 1 && !set.completed && (
                        <button
                          type="button"
                          onClick={() => onRemoveSet?.(exIdx, setIdx)}
                          className="text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>
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

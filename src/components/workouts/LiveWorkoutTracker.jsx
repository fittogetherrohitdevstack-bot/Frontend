import React, { useState, useEffect, useRef, useMemo } from "react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import {
  Play,
  Pause,
  StopCircle,
  Timer,
  Check,
  Plus,
  Minus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  X,
  Volume2,
  Sparkles,
  Dumbbell,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";

/**
 * Generates an audible chime using Web Audio API without needing external asset files.
 */
const playRestChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    // AudioContext blocked or not supported
  }
};

export const LiveWorkoutTracker = ({
  session,
  onLiveSave,
  onFinishWorkout,
  onCancelWorkout,
  isFinishing,
}) => {
  const [exercises, setExercises] = useState(session?.exercises || []);
  const [sessionNotes, setSessionNotes] = useState(session?.notes || "");
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(session?.durationSeconds || 0);

  // Rest Timer State
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTotal, setRestTotal] = useState(60);
  const [isRestActive, setIsRestActive] = useState(false);

  // New exercise quick-add modal state
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");

  const saveTimeoutRef = useRef(null);

  // 1. Wall-clock resilient workout elapsed timer
  const startTimeRef = useRef(
    session?.startTime ? new Date(session.startTime).getTime() : Date.now()
  );

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((now - startTimeRef.current) / 1000);
      setElapsedSeconds(Math.max(0, diff));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // 2. Rest Timer Countdown
  useEffect(() => {
    let interval = null;
    if (isRestActive && restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds((sec) => sec - 1);
      }, 1000);
    } else if (restSeconds === 0 && isRestActive) {
      setIsRestActive(false);
      haptics.goal();
      playRestChime();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
      toast.info("Rest finished! Ready for your next set 💪");
    }
    return () => clearInterval(interval);
  }, [isRestActive, restSeconds]);

  // 3. Debounced Live Autosave to Backend
  const triggerAutosave = (newExercises, notesVal = sessionNotes) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onLiveSave?.({
        exercises: newExercises,
        durationSeconds: elapsedSeconds,
        notes: notesVal,
      });
    }, 1200);
  };

  // 4. Warn before closing if workout is live
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "You have an active workout in progress. Are you sure you want to exit?";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Set Operations
  const handleToggleSet = (exIdx, setIdx) => {
    const updated = JSON.parse(JSON.stringify(exercises));
    const currentCompleted = updated[exIdx].sets[setIdx].completed;
    const nextCompleted = !currentCompleted;
    updated[exIdx].sets[setIdx].completed = nextCompleted;

    setExercises(updated);
    triggerAutosave(updated);

    if (nextCompleted) {
      haptics.eaten();
      // Auto-start rest timer
      const targetRest = updated[exIdx].restSeconds || 60;
      setRestTotal(targetRest);
      setRestSeconds(targetRest);
      setIsRestActive(true);
    } else {
      haptics.tick();
    }
  };

  const handleUpdateSet = (exIdx, setIdx, field, val) => {
    const updated = JSON.parse(JSON.stringify(exercises));
    updated[exIdx].sets[setIdx][field] = Number(val);
    setExercises(updated);
    triggerAutosave(updated);
  };

  const handleStepValue = (exIdx, setIdx, field, delta) => {
    haptics.tick();
    const updated = JSON.parse(JSON.stringify(exercises));
    const current = Number(updated[exIdx].sets[setIdx][field]) || 0;
    const newVal = Math.max(0, current + delta);
    updated[exIdx].sets[setIdx][field] = newVal;
    setExercises(updated);
    triggerAutosave(updated);
  };

  const handleAddSet = (exIdx) => {
    haptics.tick();
    const updated = JSON.parse(JSON.stringify(exercises));
    const sets = updated[exIdx].sets || [];
    const lastSet = sets[sets.length - 1] || { weight: 20, reps: 10 };
    sets.push({
      setNumber: sets.length + 1,
      weight: lastSet.weight,
      reps: lastSet.reps,
      completed: false,
      previousWeight: lastSet.weight,
      previousReps: lastSet.reps,
      rpe: 8,
      notes: "",
    });
    updated[exIdx].sets = sets;
    setExercises(updated);
    triggerAutosave(updated);
  };

  const handleRemoveSet = (exIdx, setIdx) => {
    haptics.tick();
    const updated = JSON.parse(JSON.stringify(exercises));
    updated[exIdx].sets = updated[exIdx].sets.filter((_, i) => i !== setIdx);
    // Renumber remaining sets
    updated[exIdx].sets.forEach((s, idx) => {
      s.setNumber = idx + 1;
    });
    setExercises(updated);
    triggerAutosave(updated);
  };

  const handleCopyPreviousSet = (exIdx, setIdx) => {
    if (setIdx === 0) return;
    haptics.selection();
    const updated = JSON.parse(JSON.stringify(exercises));
    const prev = updated[exIdx].sets[setIdx - 1];
    updated[exIdx].sets[setIdx].weight = prev.weight;
    updated[exIdx].sets[setIdx].reps = prev.reps;
    setExercises(updated);
    triggerAutosave(updated);
    toast.success("Copied weight & reps from set #" + prev.setNumber);
  };

  const handleRemoveExercise = (exIdx) => {
    if (window.confirm("Remove this exercise from your active session?")) {
      haptics.tick();
      const updated = exercises.filter((_, i) => i !== exIdx);
      setExercises(updated);
      triggerAutosave(updated);
    }
  };

  const handleAddCustomExercise = (e) => {
    e.preventDefault();
    if (!newExerciseName.trim()) return;
    haptics.selection();
    const newEx = {
      name: newExerciseName.trim(),
      primaryMuscle: "Full Body",
      sets: [
        { setNumber: 1, weight: 20, reps: 10, completed: false, previousWeight: 0, previousReps: 0 },
        { setNumber: 2, weight: 20, reps: 10, completed: false, previousWeight: 0, previousReps: 0 },
        { setNumber: 3, weight: 20, reps: 10, completed: false, previousWeight: 0, previousReps: 0 },
      ],
    };
    const updated = [...exercises, newEx];
    setExercises(updated);
    triggerAutosave(updated);
    setNewExerciseName("");
    setShowAddExerciseModal(false);
  };

  // Formatted Time Helper
  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(
        secs
      ).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Quick stats
  const completedSets = useMemo(
    () => exercises.reduce((acc, ex) => acc + (ex.sets?.filter((s) => s.completed).length || 0), 0),
    [exercises]
  );
  const totalSets = useMemo(
    () => exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0),
    [exercises]
  );
  const totalVolume = useMemo(
    () =>
      exercises.reduce(
        (acc, ex) =>
          acc +
          (ex.sets || []).reduce(
            (sAcc, s) => sAcc + (s.completed ? (Number(s.weight) || 0) * (Number(s.reps) || 0) : 0),
            0
          ),
        0
      ),
    [exercises]
  );

  return (
    <div className="space-y-5 pb-24">
      {/* Top Floating Sticky HUD Bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border border-purple-200/90 rounded-2xl p-3 sm:p-4 shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-mono font-black text-xs">
            <Timer className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-purple-700 block">
              Live Workout Elapsed
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-slate-900 tracking-tight">
              {formatTimer(elapsedSeconds)}
            </span>
          </div>
        </div>

        {/* Live Metrics: Volume & Completed Sets */}
        <div className="hidden sm:flex items-center gap-4 text-xs font-bold text-slate-600">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Volume</span>
            <span className="text-slate-900 font-black">{totalVolume} kg</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Sets</span>
            <span className="text-slate-900 font-black">
              {completedSets} / {totalSets}
            </span>
          </div>
        </div>

        {/* Primary Workout Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setIsPaused(!isPaused);
            }}
            className={`min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center border font-bold text-xs transition-all cursor-pointer ${
              isPaused
                ? "bg-amber-100 border-amber-300 text-amber-800"
                : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
            }`}
            title={isPaused ? "Resume workout" : "Pause workout"}
          >
            {isPaused ? <Play className="w-4 h-4 fill-amber-700" /> : <Pause className="w-4 h-4" />}
          </button>

          <Button
            size="sm"
            variant="primary"
            isLoading={isFinishing}
            onClick={() => {
              haptics.goal();
              onFinishWorkout({
                exercises,
                durationSeconds: elapsedSeconds,
                notes: sessionNotes,
              });
            }}
            className="font-black text-xs min-h-[40px] px-3.5 shadow-md"
          >
            <Check className="w-4 h-4 mr-1 stroke-[3]" /> Finish Workout
          </Button>
        </div>
      </div>

      {/* Active Rest Timer Dock (when ticking) */}
      <AnimatePresence>
        {isRestActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-mono font-black text-sm">
                {restSeconds}s
              </div>
              <div>
                <span className="text-xs font-black block">Resting between sets</span>
                <span className="text-[11px] opacity-80">Take deep breaths & hydrate</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  haptics.tick();
                  setRestSeconds((sec) => sec + 30);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold cursor-pointer"
              >
                +30s
              </button>
              <button
                type="button"
                onClick={() => {
                  haptics.tick();
                  setIsRestActive(false);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white text-purple-700 hover:bg-purple-50 text-xs font-extrabold cursor-pointer"
              >
                Skip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercises Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Workout Exercises ({exercises.length})
          </h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowAddExerciseModal(true)}
            className="text-xs font-bold min-h-[38px]"
          >
            <Plus className="w-3.5 h-3.5 mr-1 stroke-[3]" /> Add Exercise
          </Button>
        </div>

        {exercises.map((exercise, exIdx) => {
          const setsDone = exercise.sets?.filter((s) => s.completed).length || 0;
          const setsTotal = exercise.sets?.length || 0;
          const isAllCompleted = setsTotal > 0 && setsDone === setsTotal;

          return (
            <GlassCard
              key={exIdx}
              className={`p-3.5 sm:p-5 transition-all ${
                isAllCompleted
                  ? "border-emerald-300 bg-emerald-50/20"
                  : "bg-white/95 border-slate-200"
              }`}
            >
              {/* Exercise Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isAllCompleted
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    <Dumbbell className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                      {exercise.name}
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      {setsDone} of {setsTotal} sets completed
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Remove exercise"
                  onClick={() => handleRemoveExercise(exIdx)}
                  className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Set Table with Steppers */}
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-12 gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">
                  <div className="col-span-2 text-center">Set</div>
                  <div className="col-span-5 text-center">Weight (kg)</div>
                  <div className="col-span-3 text-center">Reps</div>
                  <div className="col-span-2 text-center">Tick</div>
                </div>

                {exercise.sets?.map((set, setIdx) => (
                  <motion.div
                    key={setIdx}
                    layout
                    className={`grid grid-cols-12 gap-1.5 sm:gap-2 items-center p-2 rounded-2xl border transition-all ${
                      set.completed
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                        : "bg-slate-50/90 border-slate-200"
                    }`}
                  >
                    {/* Set Number with Copy Button */}
                    <div className="col-span-2 flex flex-col items-center justify-center">
                      <span className="font-black text-slate-700 text-xs">#{set.setNumber}</span>
                      {setIdx > 0 && !set.completed && (
                        <button
                          type="button"
                          onClick={() => handleCopyPreviousSet(exIdx, setIdx)}
                          className="text-[9px] font-bold text-purple-600 hover:underline flex items-center gap-0.5 mt-0.5 cursor-pointer"
                          title="Copy from previous set"
                        >
                          <Copy className="w-2.5 h-2.5" /> Prev
                        </button>
                      )}
                    </div>

                    {/* Weight Input with +/- 2.5 Steppers */}
                    <div className="col-span-5 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStepValue(exIdx, setIdx, "weight", -2.5)}
                        className="w-7 h-10 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs hover:bg-slate-100 cursor-pointer shrink-0"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step="0.5"
                        inputMode="decimal"
                        value={set.weight}
                        onChange={(e) => handleUpdateSet(exIdx, setIdx, "weight", e.target.value)}
                        className="w-full text-center min-h-[40px] rounded-xl bg-white border border-slate-200 font-black text-sm focus:outline-none focus:border-purple-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleStepValue(exIdx, setIdx, "weight", 2.5)}
                        className="w-7 h-10 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs hover:bg-slate-100 cursor-pointer shrink-0"
                      >
                        +
                      </button>
                    </div>

                    {/* Reps Input with +/- 1 Steppers */}
                    <div className="col-span-3 flex items-center gap-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={set.reps}
                        onChange={(e) => handleUpdateSet(exIdx, setIdx, "reps", e.target.value)}
                        className="w-full text-center min-h-[40px] rounded-xl bg-white border border-slate-200 font-black text-sm focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    {/* Completion Checkbox */}
                    <div className="col-span-2 flex justify-center">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        type="button"
                        aria-label={`Complete set ${set.setNumber}`}
                        onClick={() => handleToggleSet(exIdx, setIdx)}
                        className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          set.completed
                            ? "bg-gradient-to-tr from-emerald-500 to-lime-500 text-white shadow-md shadow-emerald-500/20"
                            : "bg-white border border-slate-300 hover:border-purple-400 text-slate-400 hover:text-purple-600"
                        }`}
                      >
                        <Check className="w-5 h-5 stroke-[3]" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add Set Button */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleAddSet(exIdx)}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 min-h-[38px] px-2.5 rounded-xl hover:bg-purple-50 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Set
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Workout Session Notes */}
      <GlassCard className="p-4 bg-white/95 border-slate-200 space-y-2">
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
          Workout Session Notes
        </label>
        <textarea
          rows={2}
          value={sessionNotes}
          onChange={(e) => {
            setSessionNotes(e.target.value);
            triggerAutosave(exercises, e.target.value);
          }}
          placeholder="How did this workout feel? Any personal milestones or notes..."
          className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white resize-none"
        />
      </GlassCard>

      {/* Bottom Danger Controls */}
      <div className="flex items-center justify-between pt-2 px-1">
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Are you sure you want to cancel this workout? Current unsaved session progress will be discarded."
              )
            ) {
              onCancelWorkout();
            }
          }}
          className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline min-h-[44px] flex items-center cursor-pointer"
        >
          Cancel Workout Session
        </button>
      </div>

      {/* Add Custom Exercise Sheet */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Add Exercise to Live Session</h3>
              <button
                type="button"
                onClick={() => setShowAddExerciseModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomExercise} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Search or Type Exercise Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Incline Dumbbell Press, Pull-ups..."
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:border-purple-400 focus:bg-white"
                />
              </div>

              {/* Quick Popular Suggestions */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  Popular Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Barbell Bench Press",
                    "Barbell Back Squat",
                    "Conventional Deadlift",
                    "Overhead Barbell Press",
                    "Pull-ups",
                    "Dumbbell Lateral Raise",
                    "Incline Dumbbell Curl",
                    "Tricep Rope Pushdown",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        haptics.tick();
                        setNewExerciseName(preset);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full min-h-[44px] font-bold shadow-md justify-center">
                Add to Live Workout
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LiveWorkoutTracker;

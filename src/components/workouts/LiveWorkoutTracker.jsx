import React, { useState, useEffect, useRef, useMemo } from "react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { workoutApi } from "../../api/endpoints";
import { LiveWorkoutExerciseCard } from "./LiveWorkoutExerciseCard";
import { ExercisePickerModal } from "./ExercisePickerModal";
import { ExerciseHistoryModal } from "./ExerciseHistoryModal";
import { ExerciseDetailSheet } from "./ExerciseDetailSheet";
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

  // Modals state
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [replaceIndex, setReplaceIndex] = useState(null);
  const [inspectExercise, setInspectExercise] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState({ name: "", id: null });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const saveTimeoutRef = useRef(null);

  // 1. Wall-clock resilient workout elapsed timer with pause compensation
  const startTimeRef = useRef(
    Date.now() - (session?.durationSeconds || 0) * 1000
  );
  const totalPausedMsRef = useRef(0);
  const pausedAtRef = useRef(null);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - startTimeRef.current - totalPausedMsRef.current;
      const diff = Math.floor(elapsedMs / 1000);
      setElapsedSeconds(Math.max(0, diff));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Helper to sanitize set numbers for API storage
  const sanitizeExercises = (exList) =>
    (exList || []).map((ex) => ({
      ...ex,
      sets: (ex.sets || []).map((s) => ({
        ...s,
        weight: s.weight === "" ? 0 : Number(s.weight) || 0,
        reps: s.reps === "" ? 0 : Number(s.reps) || 0,
      })),
    }));

  // Background hydration of previous performance for any exercises missing it
  useEffect(() => {
    exercises.forEach((ex, idx) => {
      if (!ex.previousPerformance) {
        workoutApi
          .getExercisePreviousPerformance(ex.exerciseId || ex.name)
          .then((res) => {
            const data = res.data?.data;
            if (data?.hasPreviousPerformance && data?.previousSession) {
              setExercises((prev) => {
                const next = JSON.parse(JSON.stringify(prev));
                if (next[idx]) {
                  next[idx].previousPerformance = data.previousSession;
                  (data.previousSession.sets || []).forEach((ps, sIdx) => {
                    if (next[idx].sets[sIdx]) {
                      if (!next[idx].sets[sIdx].previousWeight) {
                        next[idx].sets[sIdx].previousWeight = ps.weight;
                        next[idx].sets[sIdx].previousReps = ps.reps;
                      }
                    }
                  });
                }
                return next;
              });
            }
          })
          .catch(() => {});
      }

      // Hydrate rich media (video, gif, instructions) if missing from session
      if (!ex.videoUrl && !ex.gifUrl && (!ex.images || ex.images.length === 0)) {
        workoutApi
          .getExercises({ search: ex.name, limit: 1 })
          .then((res) => {
            const found = res.data?.data?.exercises?.[0];
            if (found) {
              setExercises((prev) => {
                const next = JSON.parse(JSON.stringify(prev));
                if (next[idx]) {
                  next[idx].exerciseId = next[idx].exerciseId || found._id;
                  next[idx].videoUrl = found.videoUrl || "";
                  next[idx].videoUrlFemale = found.videoUrlFemale || "";
                  next[idx].gifUrl = found.gifUrl || "";
                  next[idx].thumbnailUrl = found.thumbnailUrl || "";
                  next[idx].images = found.images || [];
                  next[idx].mediaType =
                    found.mediaType ||
                    (found.videoUrl ? "video" : found.gifUrl ? "gif" : "text_only");
                  next[idx].instructions = found.instructions || [];
                  next[idx].equipment = found.equipment || "";
                  next[idx].difficulty = found.difficulty || "";
                  next[idx].category = found.category || "";
                }
                return next;
              });
            }
          })
          .catch(() => {});
      }
    });
  }, []);

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
        exercises: sanitizeExercises(newExercises),
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
    if (field === "exerciseNotes") {
      updated[exIdx].notes = val;
    } else if (setIdx !== null) {
      updated[exIdx].sets[setIdx][field] = val === "" ? "" : Number(val);
    }
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

  // Copy ALL previous sets values into current workout
  const handleCopyAllPreviousSets = (exIdx) => {
    const updated = JSON.parse(JSON.stringify(exercises));
    const ex = updated[exIdx];
    const prevSets = ex.previousPerformance?.sets || [];
    if (prevSets.length === 0) return;

    ex.sets.forEach((set, sIdx) => {
      if (prevSets[sIdx]) {
        set.weight = prevSets[sIdx].weight;
        set.reps = prevSets[sIdx].reps;
      }
    });

    setExercises(updated);
    triggerAutosave(updated);
    toast.success(`Copied previous set values for ${ex.name}!`);
  };

  const handleRemoveExercise = (exIdx) => {
    if (window.confirm("Remove this exercise from your active session?")) {
      haptics.tick();
      const updated = exercises.filter((_, i) => i !== exIdx);
      setExercises(updated);
      triggerAutosave(updated);
    }
  };

  // Selection from comprehensive ExercisePickerModal
  const handleSelectFromPicker = async (selectedEx) => {
    const exName = selectedEx.name.trim();

    if (replaceIndex !== null) {
      // Replace existing exercise
      const updated = JSON.parse(JSON.stringify(exercises));
      const targetIdx = replaceIndex;
      updated[targetIdx] = {
        ...updated[targetIdx],
        exerciseId: selectedEx._id || null,
        name: exName,
        primaryMuscle: selectedEx.primaryMuscle || "Full Body",
        videoUrl: selectedEx.videoUrl || "",
        videoUrlFemale: selectedEx.videoUrlFemale || "",
        gifUrl: selectedEx.gifUrl || "",
        thumbnailUrl: selectedEx.thumbnailUrl || "",
        images: selectedEx.images || [],
        mediaType:
          selectedEx.mediaType ||
          (selectedEx.videoUrl ? "video" : selectedEx.gifUrl ? "gif" : "text_only"),
        instructions: selectedEx.instructions || [],
        equipment: selectedEx.equipment || "",
        difficulty: selectedEx.difficulty || "",
        category: selectedEx.category || "",
        previousPerformance: null,
      };
      setExercises(updated);
      setReplaceIndex(null);
      triggerAutosave(updated);

      toast.success(`Replaced with ${exName}`);

      // Fetch previous performance in background
      try {
        const res = await workoutApi.getExercisePreviousPerformance(selectedEx._id || exName);
        const data = res.data?.data;
        if (data?.hasPreviousPerformance && data?.previousSession) {
          setExercises((prev) => {
            const next = JSON.parse(JSON.stringify(prev));
            if (next[targetIdx]) {
              next[targetIdx].previousPerformance = data.previousSession;
              (data.previousSession.sets || []).forEach((ps, sIdx) => {
                if (next[targetIdx].sets[sIdx]) {
                  next[targetIdx].sets[sIdx].previousWeight = ps.weight;
                  next[targetIdx].sets[sIdx].previousReps = ps.reps;
                }
              });
            }
            return next;
          });
        }
      } catch (e) {}
      return;
    }

    // Add as new exercise
    const newEx = {
      exerciseId: selectedEx._id || null,
      name: exName,
      primaryMuscle: selectedEx.primaryMuscle || "Full Body",
      videoUrl: selectedEx.videoUrl || "",
      videoUrlFemale: selectedEx.videoUrlFemale || "",
      gifUrl: selectedEx.gifUrl || "",
      thumbnailUrl: selectedEx.thumbnailUrl || "",
      images: selectedEx.images || [],
      mediaType:
        selectedEx.mediaType ||
        (selectedEx.videoUrl ? "video" : selectedEx.gifUrl ? "gif" : "text_only"),
      instructions: selectedEx.instructions || [],
      equipment: selectedEx.equipment || "",
      difficulty: selectedEx.difficulty || "",
      category: selectedEx.category || "",
      sets: [
        { setNumber: 1, weight: 20, reps: 10, completed: false, previousWeight: 0, previousReps: 0 },
        { setNumber: 2, weight: 20, reps: 10, completed: false, previousWeight: 0, previousReps: 0 },
        { setNumber: 3, weight: 20, reps: 10, completed: false, previousWeight: 0, previousReps: 0 },
      ],
      previousPerformance: null,
    };

    const newIndex = exercises.length;
    const updated = [...exercises, newEx];
    setExercises(updated);
    triggerAutosave(updated);
    toast.success(`Added ${exName} to workout!`);

    // Fetch previous performance in background
    try {
      const res = await workoutApi.getExercisePreviousPerformance(selectedEx._id || exName);
      const data = res.data?.data;
      if (data?.hasPreviousPerformance && data?.previousSession) {
        setExercises((prev) => {
          const next = JSON.parse(JSON.stringify(prev));
          if (next[newIndex]) {
            next[newIndex].previousPerformance = data.previousSession;
            (data.previousSession.sets || []).forEach((ps, sIdx) => {
              if (next[newIndex].sets[sIdx]) {
                next[newIndex].sets[sIdx].previousWeight = ps.weight;
                next[newIndex].sets[sIdx].previousReps = ps.reps;
              }
            });
          }
          return next;
        });
      }
    } catch (e) {}
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
    <div className="space-y-4 pb-28">
      {/* Top Floating Sticky HUD Bar */}
      <div className="sticky top-14 sm:top-16 z-30 bg-white/95 backdrop-blur-md border border-purple-200/90 rounded-2xl p-2.5 sm:p-4 shadow-md flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-mono font-black text-xs shrink-0">
            <Timer className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-purple-700 block">
              Elapsed
            </span>
            <div className="text-base sm:text-2xl font-black font-mono text-slate-900 leading-none">
              {formatTimer(elapsedSeconds)}
            </div>
          </div>
        </div>

        {/* Live Volume & Sets summary pills */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="text-center px-2 sm:px-3 py-1 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 block">Sets</span>
            <span className="text-xs font-black text-slate-800">
              {completedSets}/{totalSets}
            </span>
          </div>
          <div className="text-center px-2 sm:px-3 py-1 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 block">Volume</span>
            <span className="text-xs font-black text-purple-700">{totalVolume} kg</span>
          </div>
        </div>

        {/* Primary Workout Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              if (!isPaused) {
                pausedAtRef.current = Date.now();
                setIsPaused(true);
              } else {
                if (pausedAtRef.current) {
                  totalPausedMsRef.current += Date.now() - pausedAtRef.current;
                  pausedAtRef.current = null;
                }
                setIsPaused(false);
              }
            }}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border font-bold text-xs transition-all cursor-pointer ${
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
                exercises: sanitizeExercises(exercises),
                durationSeconds: elapsedSeconds,
                notes: sessionNotes,
              });
            }}
            className="font-black text-xs h-9 sm:h-10 px-2.5 sm:px-3.5 shadow-md shrink-0"
          >
            <Check className="w-3.5 h-3.5 mr-1 stroke-[3]" /> Finish
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
            className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-lg flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">
                <Timer className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-200 block">
                  Rest Countdown
                </span>
                <span className="text-lg font-black font-mono">
                  {formatTimer(restSeconds)}
                </span>
              </div>
            </div>

            {/* Rest adjustments */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRestSeconds((s) => Math.max(0, s - 15))}
                className="px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-bold transition-colors cursor-pointer"
              >
                -15s
              </button>
              <button
                type="button"
                onClick={() => setRestSeconds((s) => s + 15)}
                className="px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-bold transition-colors cursor-pointer"
              >
                +15s
              </button>
              <button
                type="button"
                onClick={() => setIsRestActive(false)}
                className="px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-bold transition-colors cursor-pointer ml-1"
              >
                Skip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workout Metadata Header */}
      <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-purple-700">
            {session?.workoutName || "Live Workout"}
          </span>
          <span className="text-xs text-slate-500 font-bold">{session?.date}</span>
        </div>
        <input
          type="text"
          placeholder="Session notes (e.g. felt strong on bench press, energy high)..."
          value={sessionNotes}
          onChange={(e) => {
            setSessionNotes(e.target.value);
            triggerAutosave(exercises, e.target.value);
          }}
          className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400"
        />
      </div>

      {/* Exercises Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Workout Exercises ({exercises.length})
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Track sets, compare previous performance, and progressively overload
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setReplaceIndex(null);
              setShowPickerModal(true);
            }}
            className="text-xs font-bold min-h-[38px] shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1 stroke-[3]" /> Add Exercise
          </Button>
        </div>

        {/* Exercises Cards */}
        {exercises.map((exercise, exIdx) => (
          <LiveWorkoutExerciseCard
            key={exercise.exerciseId || exercise.name + exIdx}
            exercise={exercise}
            exIdx={exIdx}
            onToggleSet={handleToggleSet}
            onUpdateSet={handleUpdateSet}
            onStepValue={handleStepValue}
            onAddSet={handleAddSet}
            onRemoveSet={handleRemoveSet}
            onCopyPreviousSet={handleCopyPreviousSet}
            onCopyAllPreviousSets={handleCopyAllPreviousSets}
            onRemoveExercise={handleRemoveExercise}
            onReplaceExercise={(idx) => {
              setReplaceIndex(idx);
              setShowPickerModal(true);
            }}
            onInspectExercise={(ex) => {
              setInspectExercise(ex);
              setIsDetailOpen(true);
            }}
            onViewHistory={(name, id) => {
              setHistoryTarget({ name, id });
              setIsHistoryOpen(true);
            }}
          />
        ))}
      </div>

      {/* Sticky Mobile Bottom Bar (Thumb-Accessible Gym Controls) */}
      <div className="sticky bottom-3 sm:bottom-6 z-20 flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-purple-200/90 shadow-xl max-w-xl mx-auto">
        <Button
          size="md"
          variant="secondary"
          onClick={() => {
            haptics.selection();
            setReplaceIndex(null);
            setShowPickerModal(true);
          }}
          className="flex-1 font-black text-xs min-h-[44px] shadow-2xs"
        >
          <Plus className="w-4 h-4 mr-1.5 stroke-[3]" /> Add Exercise
        </Button>

        <Button
          size="md"
          variant="primary"
          isLoading={isFinishing}
          onClick={() => {
            haptics.goal();
            onFinishWorkout({
              exercises: sanitizeExercises(exercises),
              durationSeconds: elapsedSeconds,
              notes: sessionNotes,
            });
          }}
          className="flex-1 font-black text-xs min-h-[44px] shadow-lg shadow-purple-600/25"
        >
          <Check className="w-4 h-4 mr-1.5 stroke-[3]" /> Finish Workout
        </Button>
      </div>

      {/* Discard Workout Button */}
      <div className="pt-2 flex justify-center">
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

      {/* Dedicated Exercise Picker Modal (Full 2,100+ Catalog) */}
      <ExercisePickerModal
        open={showPickerModal}
        onClose={() => {
          setShowPickerModal(false);
          setReplaceIndex(null);
        }}
        onSelectExercise={handleSelectFromPicker}
        replaceMode={replaceIndex !== null}
        replacingExerciseName={
          replaceIndex !== null && exercises[replaceIndex] ? exercises[replaceIndex].name : ""
        }
      />

      {/* Exercise History Timeline Modal */}
      {isHistoryOpen && (
        <ExerciseHistoryModal
          open={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          exerciseName={historyTarget.name}
          exerciseId={historyTarget.id}
        />
      )}

      {/* Exercise Demonstration & Detail Sheet */}
      {inspectExercise && (
        <ExerciseDetailSheet
          exercise={inspectExercise}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      )}
    </div>
  );
};

export default LiveWorkoutTracker;

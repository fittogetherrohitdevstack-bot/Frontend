import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workoutApi } from "../api/endpoints";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Sheet } from "../components/ui/Sheet";
import { Chip } from "../components/ui/Chip";
import {
  Dumbbell,
  Play,
  CheckCircle2,
  Trophy,
  Plus,
  Trash2,
  Timer,
  Clock,
  Sparkles,
  Flame,
  Check,
  RotateCcw,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../motion/Haptics";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export const WorkoutsPage = () => {
  const queryClient = useQueryClient();
  const [restTimerSeconds, setRestTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [showAddExModal, setShowAddExModal] = useState(false);

  // Today's workout session query
  const { data: todayData, isLoading } = useQuery({
    queryKey: ["today-workout"],
    queryFn: async () => {
      const res = await workoutApi.getToday();
      return res.data?.data;
    },
  });

  // Personal records query
  const { data: recordsData } = useQuery({
    queryKey: ["personal-records"],
    queryFn: async () => {
      const res = await workoutApi.getRecords();
      return res.data?.data?.records || [];
    },
  });

  // Rest Timer Interval
  useEffect(() => {
    let interval = null;
    if (timerActive && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds((sec) => sec - 1);
      }, 1000);
    } else if (restTimerSeconds === 0) {
      if (timerActive) {
        haptics.goal();
        toast.info("Rest period over! Time for the next set 💪");
      }
      setTimerActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, restTimerSeconds]);

  const startRestTimer = (seconds = 60) => {
    haptics.tick();
    setRestTimerSeconds(seconds);
    setTimerActive(true);
  };

  const stopRestTimer = () => {
    haptics.tick();
    setTimerActive(false);
    setRestTimerSeconds(0);
  };

  // Session state derived from backend or local edits
  const session = todayData?.session;
  const scheduledDay = todayData?.scheduledDay;

  const [exercises, setExercises] = useState([]);
  const [newExName, setNewExName] = useState("");

  useEffect(() => {
    if (session?.exercises?.length) {
      setExercises(session.exercises);
    } else if (scheduledDay?.exercises?.length) {
      // populate from scheduled exercises
      setExercises(
        scheduledDay.exercises.map((ex) => ({
          name: ex.name,
          sets: Array.from({ length: ex.targetSets || 3 }, (_, idx) => ({
            setNumber: idx + 1,
            reps: ex.targetReps || 10,
            weight: ex.targetWeight || 20,
            completed: false,
          })),
        }))
      );
    }
  }, [session, scheduledDay]);

  // Mutation to save session
  const saveSessionMutation = useMutation({
    mutationFn: (status = "completed") =>
      workoutApi.saveSession({
        date: todayData?.date,
        workoutName: scheduledDay?.workoutName || "Daily Workout",
        status,
        exercises,
        durationMinutes: 45,
      }),
    onSuccess: () => {
      haptics.goal();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#84CC16", "#7C3AED", "#06B6D4", "#F59E0B"],
      });
      toast.success("Workout recorded! +30 points earned 🏆", {
        description: "Great consistency! Your squad rank is updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["today-workout"] });
      queryClient.invalidateQueries({ queryKey: ["personal-records"] });
      queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["group-dashboard"] });
    },
  });

  const toggleSetCompleted = (exIdx, setIdx) => {
    setExercises((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const currentVal = copy[exIdx].sets[setIdx].completed;
      copy[exIdx].sets[setIdx].completed = !currentVal;
      if (!currentVal) {
        haptics.eaten();
        startRestTimer(60); // Auto-start 60s rest timer on completing set
      } else {
        haptics.tick();
      }
      return copy;
    });
  };

  const updateSetField = (exIdx, setIdx, field, value) => {
    setExercises((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[exIdx].sets[setIdx][field] = Number(value);
      return copy;
    });
  };

  const handleAddSet = (exIdx) => {
    haptics.tick();
    setExercises((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const sets = copy[exIdx].sets;
      const last = sets[sets.length - 1] || { reps: 10, weight: 20 };
      sets.push({
        setNumber: sets.length + 1,
        reps: last.reps,
        weight: last.weight,
        completed: false,
      });
      return copy;
    });
  };

  const handleAddExercise = (e) => {
    e.preventDefault();
    if (!newExName.trim()) return;
    haptics.selection();
    setExercises((prev) => [
      ...prev,
      {
        name: newExName.trim(),
        sets: [
          { setNumber: 1, reps: 10, weight: 20, completed: false },
          { setNumber: 2, reps: 10, weight: 20, completed: false },
          { setNumber: 3, reps: 10, weight: 20, completed: false },
        ],
      },
    ]);
    setNewExName("");
    setShowAddExModal(false);
  };

  const handleRemoveExercise = (idx) => {
    haptics.tick();
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  const isCompleted = session?.status === "completed";
  const completedSetsCount = exercises.reduce(
    (acc, ex) => acc + (ex.sets?.filter((s) => s.completed).length || 0),
    0
  );
  const totalSetsCount = exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
  const progressPercent = totalSetsCount > 0 ? Math.round((completedSetsCount / totalSetsCount) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Athletic Hero Workout Card */}
      <GlassCard className="p-5 sm:p-7 relative overflow-hidden bg-white/95 border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        {/* Soft background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100/50 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-wider border border-purple-200">
                <Dumbbell className="w-3.5 h-3.5 stroke-[2.5]" />
                Workout Session
              </span>
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                  <Check className="w-3 h-3 stroke-[3]" /> Completed (+30 pts)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                  <Flame className="w-3 h-3 text-amber-600 fill-amber-500" /> In Progress
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {scheduledDay?.workoutName || session?.workoutName || "Full Body Power Split"}
            </h1>

            {/* Set Progress Bar */}
            <div className="pt-2 flex items-center gap-3 max-w-xs">
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-lime-500 rounded-full"
                />
              </div>
              <span className="text-xs font-bold text-slate-600 tabular-nums">
                {completedSetsCount}/{totalSetsCount} sets ({progressPercent}%)
              </span>
            </div>
          </div>

          {/* Action Row & Floating Rest Timer */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Rest Timer display */}
            <div
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border transition-all ${
                timerActive
                  ? "bg-purple-50 border-purple-300 text-purple-800 shadow-sm animate-pulse"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <Timer className={`w-4 h-4 ${timerActive ? "text-purple-600" : "text-slate-400"}`} />
              <span className="font-mono font-black text-sm">
                {timerActive ? `${restTimerSeconds}s Rest` : "Rest Timer"}
              </span>
              {timerActive ? (
                <button
                  type="button"
                  onClick={stopRestTimer}
                  className="text-xs text-rose-600 font-bold hover:underline ml-1"
                >
                  Skip
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => startRestTimer(60)}
                  className="text-xs text-purple-600 font-bold hover:underline ml-1"
                >
                  Start 60s
                </button>
              )}
            </div>

            <Button
              size="md"
              variant={isCompleted ? "secondary" : "primary"}
              isLoading={saveSessionMutation.isPending}
              onClick={() => saveSessionMutation.mutate("completed")}
              className="shadow-md"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              {isCompleted ? "Update Session" : "Complete Workout"}
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Exercises Section Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Exercises ({exercises.length})
          </h2>
          <p className="text-xs text-slate-500">Log your weights, reps, and check off sets as you crush them</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            haptics.tick();
            setShowAddExModal(true);
          }}
          className="text-xs font-bold"
        >
          <Plus className="w-3.5 h-3.5 mr-1 stroke-[3]" /> Add Exercise
        </Button>
      </div>

      {/* Exercise Cards */}
      <div className="space-y-4">
        {exercises.map((ex, exIdx) => {
          const setsDone = ex.sets?.filter((s) => s.completed).length || 0;
          const setsTotal = ex.sets?.length || 0;
          const isAllDone = setsTotal > 0 && setsDone === setsTotal;

          return (
            <GlassCard
              key={exIdx}
              className={`p-4 sm:p-5 transition-all ${
                isAllDone
                  ? "border-emerald-300 bg-emerald-50/30"
                  : "bg-white/95 border-slate-200/90"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isAllDone
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    <Dumbbell className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{ex.name}</h3>
                    <span className="text-xs text-slate-500 font-medium">
                      {setsDone} of {setsTotal} sets completed
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveExercise(exIdx)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Sets Table */}
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[11px] font-black text-slate-400 uppercase tracking-wider px-2">
                  <div className="col-span-2 text-center">Set</div>
                  <div className="col-span-4 text-center">Weight (kg)</div>
                  <div className="col-span-4 text-center">Reps</div>
                  <div className="col-span-2 text-center">Status</div>
                </div>

                {ex.sets?.map((set, setIdx) => (
                  <motion.div
                    key={setIdx}
                    layout
                    className={`grid grid-cols-12 gap-2 items-center p-2 rounded-2xl border transition-all ${
                      set.completed
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs"
                        : "bg-slate-50/80 border-slate-200 text-slate-900"
                    }`}
                  >
                    <div className="col-span-2 text-center font-black text-slate-700 text-xs">
                      #{set.setNumber}
                    </div>

                    <div className="col-span-4">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={set.weight}
                        onChange={(e) => updateSetField(exIdx, setIdx, "weight", e.target.value)}
                        className={`w-full text-center min-h-[40px] rounded-xl border font-black text-sm focus:outline-none transition-all ${
                          set.completed
                            ? "bg-white/80 border-emerald-200 text-emerald-900 focus:border-emerald-500"
                            : "bg-white border-slate-200 text-slate-900 focus:border-purple-400"
                        }`}
                      />
                    </div>

                    <div className="col-span-4">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={set.reps}
                        onChange={(e) => updateSetField(exIdx, setIdx, "reps", e.target.value)}
                        className={`w-full text-center min-h-[40px] rounded-xl border font-black text-sm focus:outline-none transition-all ${
                          set.completed
                            ? "bg-white/80 border-emerald-200 text-emerald-900 focus:border-emerald-500"
                            : "bg-white border-slate-200 text-slate-900 focus:border-purple-400"
                        }`}
                      />
                    </div>

                    <div className="col-span-2 flex justify-center">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        type="button"
                        onClick={() => toggleSetCompleted(exIdx, setIdx)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                          set.completed
                            ? "bg-gradient-to-tr from-emerald-500 to-lime-500 text-white shadow-md shadow-emerald-500/25"
                            : "bg-white border border-slate-300 hover:border-purple-400 text-slate-400 hover:text-purple-600 shadow-xs"
                        }`}
                      >
                        <Check className="w-5 h-5 stroke-[3]" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="pt-2 flex justify-start">
                <button
                  type="button"
                  onClick={() => handleAddSet(exIdx)}
                  className="text-xs font-bold text-purple-700 hover:text-purple-800 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Set
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Personal Records (PRs) Showcase */}
      {recordsData && recordsData.length > 0 && (
        <GlassCard className="p-5 bg-white/95 border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Trophy className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Personal Records (PRs)</h3>
              <p className="text-xs text-slate-500">Your all-time heaviest lifts and milestones</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {recordsData.map((pr) => (
              <div
                key={pr._id}
                className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/80 hover:border-amber-300 transition-all shadow-xs"
              >
                <span className="text-xs font-bold text-slate-700 truncate block">
                  {pr.exerciseName}
                </span>
                <p className="text-lg font-black text-amber-600 mt-0.5">
                  {pr.bestWeight} kg{" "}
                  <span className="text-xs font-medium text-slate-500">× {pr.bestReps} reps</span>
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Add Exercise Modal (Sheet) */}
      <Sheet
        open={showAddExModal}
        onOpenChange={setShowAddExModal}
        title="Add Exercise to Session"
        description="Choose a quick preset or type any custom movement"
      >
        <form onSubmit={handleAddExercise} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Exercise Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Barbell Squats, Incline Dumbbell Press"
              value={newExName}
              onChange={(e) => setNewExName(e.target.value)}
              className="w-full min-h-[46px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Popular Presets</label>
            <div className="flex flex-wrap gap-2">
              {[
                "Bench Press",
                "Squat",
                "Deadlift",
                "Pull-Ups",
                "Overhead Press",
                "Barbell Row",
                "Dumbbell Curls",
                "Lateral Raises",
                "Leg Press",
              ].map((quickEx) => (
                <button
                  key={quickEx}
                  type="button"
                  onClick={() => {
                    haptics.tick();
                    setNewExName(quickEx);
                  }}
                  className="text-xs font-bold bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-purple-300 transition-colors"
                >
                  {quickEx}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full min-h-[46px] shadow-md">
            Add Exercise
          </Button>
        </form>
      </Sheet>
    </div>
  );
};

export default WorkoutsPage;


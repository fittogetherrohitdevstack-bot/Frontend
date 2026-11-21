import React, { useState, useEffect } from "react";
import { Sheet } from "../ui/Sheet";
import { Button } from "../ui/Button";
import { ExercisePickerModal } from "./ExercisePickerModal";
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Dumbbell,
  Calendar,
  Clock,
  AlertTriangle,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";

export const EditCompletedWorkoutModal = ({
  session,
  open,
  onOpenChange,
  onSave,
  isSaving = false,
}) => {
  const [workoutName, setWorkoutName] = useState("");
  const [date, setDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState([]);

  // Exercise Picker modal state
  const [showPicker, setShowPicker] = useState(false);

  // Initialize state when session changes or modal opens
  useEffect(() => {
    if (session && open) {
      setWorkoutName(session.workoutName || "Workout Session");
      setDate(session.date || "");
      setDurationMinutes(session.durationMinutes || 45);
      setNotes(session.notes || "");
      setExercises(
        JSON.parse(
          JSON.stringify(
            (session.exercises || []).map((ex) => ({
              exerciseId: ex.exerciseId || null,
              name: ex.name || "Exercise",
              primaryMuscle: ex.primaryMuscle || "Full Body",
              notes: ex.notes || "",
              sets: (ex.sets || []).map((s, idx) => ({
                setNumber: s.setNumber || idx + 1,
                weight: s.weight ?? 20,
                reps: s.reps ?? 10,
                completed: s.completed !== false,
                rpe: s.rpe || null,
                notes: s.notes || "",
                previousWeight: s.previousWeight || 0,
                previousReps: s.previousReps || 0,
                isPR: Boolean(s.isPR),
              })),
            }))
          )
        )
      );
    }
  }, [session, open]);

  // Set operations
  const handleUpdateSet = (exIdx, setIdx, field, val) => {
    setExercises((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (field === "completed") {
        copy[exIdx].sets[setIdx].completed = !copy[exIdx].sets[setIdx].completed;
      } else {
        copy[exIdx].sets[setIdx][field] = val === "" ? "" : Number(val);
      }
      return copy;
    });
  };

  const handleStepValue = (exIdx, setIdx, field, delta) => {
    haptics.tick();
    setExercises((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const current = Number(copy[exIdx].sets[setIdx][field]) || 0;
      copy[exIdx].sets[setIdx][field] = Math.max(0, current + delta);
      return copy;
    });
  };

  const handleAddSet = (exIdx) => {
    haptics.tick();
    setExercises((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const sets = copy[exIdx].sets || [];
      const lastSet = sets[sets.length - 1] || { weight: 20, reps: 10 };
      sets.push({
        setNumber: sets.length + 1,
        weight: lastSet.weight || 20,
        reps: lastSet.reps || 10,
        completed: true,
        rpe: 8,
        notes: "",
        previousWeight: 0,
        previousReps: 0,
        isPR: false,
      });
      copy[exIdx].sets = sets;
      return copy;
    });
  };

  const handleRemoveSet = (exIdx, setIdx) => {
    haptics.tick();
    setExercises((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[exIdx].sets = copy[exIdx].sets.filter((_, i) => i !== setIdx);
      // Renumber
      copy[exIdx].sets.forEach((s, idx) => {
        s.setNumber = idx + 1;
      });
      return copy;
    });
  };

  // Exercise operations
  const handleRemoveExercise = (exIdx) => {
    if (window.confirm("Remove this exercise from the workout record?")) {
      haptics.tick();
      setExercises((prev) => prev.filter((_, i) => i !== exIdx));
    }
  };

  const handleMoveExercise = (exIdx, direction) => {
    haptics.tick();
    setExercises((prev) => {
      const copy = [...prev];
      const targetIdx = exIdx + direction;
      if (targetIdx < 0 || targetIdx >= copy.length) return prev;
      const temp = copy[exIdx];
      copy[exIdx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleAddExerciseFromPicker = (selectedEx) => {
    haptics.selection();
    const newEx = {
      exerciseId: selectedEx._id || null,
      name: selectedEx.name.trim(),
      primaryMuscle: selectedEx.primaryMuscle || "Full Body",
      notes: "",
      sets: [
        { setNumber: 1, weight: 20, reps: 10, completed: true, previousWeight: 0, previousReps: 0 },
        { setNumber: 2, weight: 20, reps: 10, completed: true, previousWeight: 0, previousReps: 0 },
        { setNumber: 3, weight: 20, reps: 10, completed: true, previousWeight: 0, previousReps: 0 },
      ],
    };
    setExercises((prev) => [...prev, newEx]);
    toast.success(`Added ${newEx.name} to workout`);
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!workoutName.trim()) {
      toast.error("Please enter a workout title");
      return;
    }
    if (exercises.length === 0) {
      toast.error("Workout must have at least 1 exercise");
      return;
    }

    const payload = {
      workoutName: workoutName.trim(),
      date,
      durationMinutes: Number(durationMinutes) || 45,
      notes: notes.trim(),
      exercises: exercises.map((ex) => ({
        exerciseId: ex.exerciseId || null,
        name: ex.name.trim(),
        primaryMuscle: ex.primaryMuscle || "Full Body",
        notes: ex.notes || "",
        sets: (ex.sets || []).map((s, idx) => ({
          setNumber: idx + 1,
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 0,
          completed: s.completed !== false,
          notes: s.notes || "",
        })),
      })),
    };

    onSave(session._id, payload);
  };

  if (!session) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Completed Workout"
      description={`Editing session from ${session.date}. Changes update volume & analytics.`}
    >
      <form onSubmit={handleSubmit} className="space-y-5 pb-8">
        {/* Warning Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-extrabold block">Modifying Historical Record</span>
            Updating weights, reps, or exercises will automatically recalculate total volume and your progression timeline.
          </div>
        </div>

        {/* Basic Details */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Workout Title *
            </label>
            <input
              type="text"
              required
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:border-purple-400 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Workout Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Duration (mins) *
              </label>
              <input
                type="number"
                min="1"
                max="360"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Session Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add or update workout notes..."
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        {/* Exercises Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
              Exercises ({exercises.length})
            </h3>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setShowPicker(true)}
              className="text-xs font-bold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1 stroke-[3]" /> Add Exercise
            </Button>
          </div>

          <div className="space-y-3.5">
            {exercises.map((ex, exIdx) => (
              <div
                key={exIdx}
                className="p-3.5 sm:p-4 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-2xs space-y-3"
              >
                {/* Exercise Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center shrink-0">
                      {exIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) => {
                        const copy = [...exercises];
                        copy[exIdx].name = e.target.value;
                        setExercises(copy);
                      }}
                      className="font-extrabold text-sm text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-purple-600 truncate"
                    />
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={exIdx === 0}
                      onClick={() => handleMoveExercise(exIdx, -1)}
                      className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 active:bg-slate-100 disabled:opacity-20 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={exIdx === exercises.length - 1}
                      onClick={() => handleMoveExercise(exIdx, 1)}
                      className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 active:bg-slate-100 disabled:opacity-20 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(exIdx)}
                      className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 active:bg-rose-50 cursor-pointer"
                      title="Remove Exercise"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sets Editor Table */}
                <div className="space-y-1.5">
                  <div className="grid grid-cols-12 gap-1 text-[9px] font-black uppercase text-slate-400 px-1">
                    <span className="col-span-2 text-center">Set</span>
                    <span className="col-span-5 text-center">Weight (kg)</span>
                    <span className="col-span-3 text-center">Reps</span>
                    <span className="col-span-2 text-center">Done</span>
                  </div>

                  {(ex.sets || []).map((set, setIdx) => (
                    <div
                      key={setIdx}
                      className={`grid grid-cols-12 gap-1 items-center p-1.5 rounded-2xl border transition-all ${
                        set.completed
                          ? "bg-white border-slate-200"
                          : "bg-slate-100/70 border-slate-200/50 opacity-60"
                      }`}
                    >
                      <span className="col-span-2 text-center font-mono font-black text-xs text-slate-600">
                        #{setIdx + 1}
                      </span>

                      {/* Weight Steppers */}
                      <div className="col-span-5 flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleStepValue(exIdx, setIdx, "weight", -2.5)}
                          className="w-7 sm:w-8 h-8 sm:h-9 rounded-lg bg-slate-100 text-slate-700 text-sm font-black hover:bg-slate-200 active:bg-slate-300 shrink-0 cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          value={set.weight}
                          onChange={(e) => handleUpdateSet(exIdx, setIdx, "weight", e.target.value)}
                          className="w-full text-center h-8 sm:h-9 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm font-black focus:outline-none focus:border-purple-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleStepValue(exIdx, setIdx, "weight", 2.5)}
                          className="w-7 sm:w-8 h-8 sm:h-9 rounded-lg bg-slate-100 text-slate-700 text-sm font-black hover:bg-slate-200 active:bg-slate-300 shrink-0 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Reps */}
                      <div className="col-span-3 flex items-center gap-0.5">
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => handleUpdateSet(exIdx, setIdx, "reps", e.target.value)}
                          className="w-full text-center h-8 sm:h-9 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm font-black focus:outline-none focus:border-purple-400"
                        />
                      </div>

                      {/* Toggle & Delete */}
                      <div className="col-span-2 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateSet(exIdx, setIdx, "completed")}
                          className={`w-8 sm:w-9 h-8 sm:h-9 rounded-xl flex items-center justify-center text-xs transition-colors cursor-pointer ${
                            set.completed
                              ? "bg-emerald-500 text-white shadow-2xs"
                              : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                        {ex.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(exIdx, setIdx)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Set"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleAddSet(exIdx)}
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" /> Add Set
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit CTA */}
        <div className="pt-3">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
            className="w-full min-h-[48px] justify-center font-black shadow-lg shadow-purple-600/20 text-sm"
          >
            <Save className="w-4 h-4 mr-2" /> Save Workout Changes
          </Button>
        </div>
      </form>

      {/* Exercise Picker Modal for Adding Exercises */}
      <ExercisePickerModal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelectExercise={handleAddExerciseFromPicker}
      />
    </Sheet>
  );
};

export default EditCompletedWorkoutModal;

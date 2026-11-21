import React, { useState, useEffect } from "react";
import { Sheet } from "../ui/Sheet";
import { Button } from "../ui/Button";
import {
  Plus,
  Trash2,
  Calendar,
  Dumbbell,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  Save,
} from "lucide-react";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";

const DAYS_OF_WEEK = [
  { dayOfWeek: 1, name: "Monday" },
  { dayOfWeek: 2, name: "Tuesday" },
  { dayOfWeek: 3, name: "Wednesday" },
  { dayOfWeek: 4, name: "Thursday" },
  { dayOfWeek: 5, name: "Friday" },
  { dayOfWeek: 6, name: "Saturday" },
  { dayOfWeek: 0, name: "Sunday" },
];

const MUSCLE_LIST = [
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

const STANDARD_FITNESS_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "All Levels",
];

const STANDARD_GOALS = [
  "Hypertrophy",
  "Strength",
  "Hypertrophy & Strength",
  "Strength & Muscle Growth",
  "Maximum Muscle Hypertrophy",
  "Fat Loss",
  "Endurance",
  "General Fitness",
  "Total Body Conditioning & Strength",
  "Foundational Form & Strength",
  "Powerbuilding (Strength + Hypertrophy)",
];

const buildInitialSchedule = (plan) => {
  if (plan?.schedule && plan.schedule.length > 0) {
    return DAYS_OF_WEEK.map((d) => {
      const found = plan.schedule.find(
        (s) => Number(s.dayOfWeek) === Number(d.dayOfWeek)
      );
      if (found) {
        return {
          dayOfWeek: d.dayOfWeek,
          dayName: found.dayName || `${d.name} Split`,
          workoutName: found.workoutName || "Workout",
          isRestDay: Boolean(found.isRestDay),
          targetMuscles: Array.isArray(found.targetMuscles)
            ? [...found.targetMuscles]
            : [],
          exercises: Array.isArray(found.exercises)
            ? found.exercises.map((ex) => {
                if (typeof ex === "string") {
                  return {
                    exerciseId: null,
                    name: ex,
                    targetSets: 3,
                    targetReps: 10,
                    restSeconds: 60,
                    targetWeight: 0,
                    primaryMuscle: "",
                    notes: "",
                  };
                }
                return {
                  exerciseId: ex.exerciseId || null,
                  name: ex.name || "Exercise",
                  targetSets: ex.targetSets ?? 3,
                  targetReps: ex.targetReps ?? 10,
                  restSeconds: ex.restSeconds ?? 60,
                  targetWeight: ex.targetWeight ?? 0,
                  primaryMuscle: ex.primaryMuscle || "",
                  notes: ex.notes || "",
                };
              })
            : [],
        };
      }
      return {
        dayOfWeek: d.dayOfWeek,
        dayName:
          d.dayOfWeek === 3 || d.dayOfWeek === 6 || d.dayOfWeek === 0
            ? "Rest Day"
            : `${d.name} Split`,
        workoutName: "Workout",
        isRestDay: d.dayOfWeek === 3 || d.dayOfWeek === 6 || d.dayOfWeek === 0,
        targetMuscles: [],
        exercises: [],
      };
    });
  }

  // Default 7-day schedule with Mon/Tue/Thu/Fri as workout days, Wed/Sat/Sun as rest
  return DAYS_OF_WEEK.map((d) => ({
    dayOfWeek: d.dayOfWeek,
    dayName:
      d.dayOfWeek === 3 || d.dayOfWeek === 6 || d.dayOfWeek === 0
        ? "Rest Day"
        : `${d.name} Split`,
    workoutName: "Workout",
    isRestDay: d.dayOfWeek === 3 || d.dayOfWeek === 6 || d.dayOfWeek === 0,
    targetMuscles: [],
    exercises: [],
  }));
};

export const CustomPlanBuilderModal = ({
  open,
  onOpenChange,
  existingPlan,
  onSavePlan,
  isSaving,
}) => {
  const [name, setName] = useState(existingPlan?.name || "");
  const [description, setDescription] = useState(existingPlan?.description || "");
  const [fitnessLevel, setFitnessLevel] = useState(
    existingPlan?.fitnessLevel || "Intermediate"
  );
  const [goal, setGoal] = useState(existingPlan?.goal || "Hypertrophy");
  const [isActive, setIsActive] = useState(existingPlan?.isActive !== false);
  const [schedule, setSchedule] = useState(() => buildInitialSchedule(existingPlan));
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  // Synchronize state when existingPlan prop changes or modal opens
  useEffect(() => {
    if (open) {
      setName(existingPlan?.name || "");
      setDescription(existingPlan?.description || "");
      setFitnessLevel(existingPlan?.fitnessLevel || "Intermediate");
      setGoal(existingPlan?.goal || "Hypertrophy");
      setIsActive(existingPlan?.isActive !== false);
      setSchedule(buildInitialSchedule(existingPlan));
      setActiveDayIdx(0);
    }
  }, [existingPlan, open]);

  const currentDay =
    schedule[activeDayIdx] || {
      dayOfWeek: 1,
      dayName: "Monday Split",
      isRestDay: false,
      targetMuscles: [],
      exercises: [],
    };

  const updateDayField = (idx, field, value) => {
    setSchedule((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const toggleTargetMuscle = (muscle) => {
    haptics.tick();
    setSchedule((prev) => {
      const copy = [...prev];
      const day = copy[activeDayIdx];
      const exists = day.targetMuscles?.includes(muscle);
      day.targetMuscles = exists
        ? day.targetMuscles.filter((m) => m !== muscle)
        : [...(day.targetMuscles || []), muscle];
      return copy;
    });
  };

  const addExerciseToCurrentDay = (exName = "New Exercise") => {
    haptics.tick();
    setSchedule((prev) => {
      const copy = [...prev];
      const day = copy[activeDayIdx];
      day.exercises = [
        ...(day.exercises || []),
        {
          name: exName,
          targetSets: 3,
          targetReps: 10,
          restSeconds: 60,
          primaryMuscle: day.targetMuscles?.[0] || "Chest",
        },
      ];
      return copy;
    });
  };

  const removeExerciseFromCurrentDay = (exIdx) => {
    haptics.tick();
    setSchedule((prev) => {
      const copy = [...prev];
      const day = copy[activeDayIdx];
      day.exercises = day.exercises.filter((_, i) => i !== exIdx);
      return copy;
    });
  };

  const moveExercise = (exIdx, direction) => {
    haptics.tick();
    setSchedule((prev) => {
      const copy = [...prev];
      const day = copy[activeDayIdx];
      const exercises = [...day.exercises];
      const targetIdx = exIdx + direction;
      if (targetIdx < 0 || targetIdx >= exercises.length) return prev;
      const temp = exercises[exIdx];
      exercises[exIdx] = exercises[targetIdx];
      exercises[targetIdx] = temp;
      day.exercises = exercises;
      return copy;
    });
  };

  const updateExerciseField = (exIdx, field, value) => {
    setSchedule((prev) => {
      const copy = [...prev];
      const day = copy[activeDayIdx];
      day.exercises[exIdx][field] = value;
      return copy;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please provide a name for your workout plan");
      return;
    }

    // Clean and validate schedule to prevent any malformed payload
    const cleanedSchedule = schedule.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      dayName: day.dayName || `${DAYS_OF_WEEK.find((d) => d.dayOfWeek === day.dayOfWeek)?.name || "Day"} Split`,
      workoutName: day.workoutName || "Workout",
      isRestDay: Boolean(day.isRestDay),
      targetMuscles: Array.isArray(day.targetMuscles) ? day.targetMuscles : [],
      exercises: day.isRestDay
        ? []
        : (day.exercises || []).map((ex, i) => ({
            exerciseId: ex.exerciseId || null,
            name: ex.name?.trim() || `Exercise ${i + 1}`,
            primaryMuscle: ex.primaryMuscle || day.targetMuscles?.[0] || "Chest",
            targetSets: Number(ex.targetSets) || 3,
            targetReps: Number(ex.targetReps) || 10,
            restSeconds: Number(ex.restSeconds) || 60,
            targetWeight: Number(ex.targetWeight) || 0,
            notes: ex.notes || "",
          })),
    }));

    const activeDaysCount = cleanedSchedule.filter((s) => !s.isRestDay).length;

    const payload = {
      name: name.trim(),
      description: description.trim(),
      fitnessLevel,
      goal,
      isActive,
      daysPerWeek: activeDaysCount || 4,
      schedule: cleanedSchedule,
    };

    onSavePlan(payload);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={existingPlan ? `Edit "${existingPlan.name}"` : "Create Custom Workout Plan"}
      description="Configure your weekly days, target muscle groups, and exercise sets."
    >
      <form onSubmit={handleSubmit} className="space-y-5 pb-8">
        {/* Basic Details */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Plan Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Upper / Lower Split"
              className="w-full min-h-[44px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Fitness Level
              </label>
              <select
                value={fitnessLevel}
                onChange={(e) => setFitnessLevel(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs"
              >
                {fitnessLevel && !STANDARD_FITNESS_LEVELS.includes(fitnessLevel) && (
                  <option value={fitnessLevel}>{fitnessLevel}</option>
                )}
                {STANDARD_FITNESS_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Training Goal
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs"
              >
                {goal && !STANDARD_GOALS.includes(goal) && (
                  <option value={goal}>{goal}</option>
                )}
                {STANDARD_GOALS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Day Selector Pills */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            Select Day to Configure
          </label>
          <div className="grid grid-cols-7 gap-1">
            {schedule.map((day, idx) => {
              const active = idx === activeDayIdx;
              return (
                <button
                  key={day.dayOfWeek}
                  type="button"
                  onClick={() => {
                    haptics.selection();
                    setActiveDayIdx(idx);
                  }}
                  className={`p-2 rounded-xl text-center transition-all cursor-pointer ${
                    active
                      ? "bg-purple-600 text-white shadow-xs font-black"
                      : day.isRestDay
                      ? "bg-slate-100 text-slate-400 hover:bg-slate-200 font-bold"
                      : "bg-purple-50 text-purple-800 hover:bg-purple-100 font-bold"
                  }`}
                >
                  <span className="text-[10px] block">
                    {DAYS_OF_WEEK[idx].name.slice(0, 3)}
                  </span>
                  <span className="text-[9px] block opacity-80">
                    {day.isRestDay ? "Rest" : `${day.exercises?.length || 0} ex`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Configuration Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">
                {DAYS_OF_WEEK[activeDayIdx].name} Configuration
              </h4>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={currentDay.isRestDay}
                onChange={(e) => updateDayField(activeDayIdx, "isRestDay", e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-400"
              />
              <span className="text-xs font-bold text-slate-700">Rest Day</span>
            </label>
          </div>

          {!currentDay.isRestDay ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Day Focus Title
                </label>
                <input
                  type="text"
                  value={currentDay.dayName}
                  onChange={(e) => updateDayField(activeDayIdx, "dayName", e.target.value)}
                  placeholder="e.g. Chest & Triceps"
                  className="w-full min-h-[40px] px-3 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold text-xs"
                />
              </div>

              {/* Target Muscles */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Target Muscle Groups
                </label>
                <div className="flex flex-wrap gap-1">
                  {MUSCLE_LIST.map((muscle) => {
                    const selected = currentDay.targetMuscles?.includes(muscle);
                    return (
                      <button
                        key={muscle}
                        type="button"
                        onClick={() => toggleTargetMuscle(muscle)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selected
                            ? "bg-purple-600 text-white"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {muscle}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exercises List for this Day */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800">
                    Day Exercises ({currentDay.exercises?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => addExerciseToCurrentDay()}
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Exercise
                  </button>
                </div>

                {currentDay.exercises?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4 bg-white rounded-xl border border-dashed border-slate-200">
                    No exercises assigned to this day yet. Click "Add Exercise" above.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {currentDay.exercises?.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={ex.name}
                            onChange={(e) =>
                              updateExerciseField(exIdx, "name", e.target.value)
                            }
                            placeholder="Exercise name"
                            className="flex-1 font-bold text-xs text-slate-900 border-b border-transparent focus:border-purple-400 focus:outline-none"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveExercise(exIdx, -1)}
                              disabled={exIdx === 0}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                              title="Move up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveExercise(exIdx, 1)}
                              disabled={exIdx === currentDay.exercises.length - 1}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                              title="Move down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeExerciseFromCurrentDay(exIdx)}
                              className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                              title="Remove exercise"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">Sets</span>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={ex.targetSets}
                              onChange={(e) =>
                                updateExerciseField(exIdx, "targetSets", Number(e.target.value))
                              }
                              className="w-full p-1.5 rounded-lg border border-slate-200 text-center font-bold"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">Reps</span>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={ex.targetReps}
                              onChange={(e) =>
                                updateExerciseField(exIdx, "targetReps", Number(e.target.value))
                              }
                              className="w-full p-1.5 rounded-lg border border-slate-200 text-center font-bold"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">Rest (sec)</span>
                            <input
                              type="number"
                              min="15"
                              step="15"
                              value={ex.restSeconds}
                              onChange={(e) =>
                                updateExerciseField(exIdx, "restSeconds", Number(e.target.value))
                              }
                              className="w-full p-1.5 rounded-lg border border-slate-200 text-center font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-6 text-center text-slate-500 font-medium text-xs">
              🧘 {DAYS_OF_WEEK[activeDayIdx].name} is marked as an active recovery & rest day.
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          isLoading={isSaving}
          className="w-full min-h-[46px] font-bold shadow-md justify-center"
        >
          <Save className="w-4 h-4 mr-2" /> Save Workout Plan
        </Button>
      </form>
    </Sheet>
  );
};

export default CustomPlanBuilderModal;

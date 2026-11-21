import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet } from "../ui/Sheet";
import { Button } from "../ui/Button";
import { workoutApi } from "../../api/endpoints";
import { ExercisePickerModal } from "./ExercisePickerModal";
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
  Copy,
  History,
  RotateCcw,
  Check,
  ChevronRight,
  Flame,
  ArrowLeft,
  Clock,
  Trophy,
} from "lucide-react";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

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
  // Navigation: "select_method" vs "customizer"
  const [creationStep, setCreationStep] = useState(
    existingPlan ? "customizer" : "select_method"
  );
  const [selectedMethod, setSelectedMethod] = useState("scratch"); // 'scratch' | 'existing_plan' | 'previous_workout' | 'reuse_days'

  // Form State
  const [name, setName] = useState(existingPlan?.name || "");
  const [description, setDescription] = useState(existingPlan?.description || "");
  const [fitnessLevel, setFitnessLevel] = useState(
    existingPlan?.fitnessLevel || "Intermediate"
  );
  const [goal, setGoal] = useState(existingPlan?.goal || "Hypertrophy");
  const [isActive, setIsActive] = useState(existingPlan?.isActive !== false);
  const [schedule, setSchedule] = useState(() => buildInitialSchedule(existingPlan));
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  // Exercise Picker Modal state for full 2,100+ catalog
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  // Reuse Days Selection State
  const [selectedDaysPool, setSelectedDaysPool] = useState([]);

  // Fetch completed workouts for Option 3 & 4
  const { data: completedWorkoutsData, isLoading: isLoadingCompleted } = useQuery({
    queryKey: ["completed-workouts-list"],
    queryFn: async () => {
      const res = await workoutApi.getCompletedSessions();
      return res.data?.data?.sessions || [];
    },
    enabled: Boolean(open && (selectedMethod === "previous_workout" || selectedMethod === "reuse_days")),
  });

  // Fetch existing plans & templates for Option 2 & 4
  const { data: myPlansData } = useQuery({
    queryKey: ["my-workout-plans-builder"],
    queryFn: async () => {
      const res = await workoutApi.getMyPlans();
      return res.data?.data?.plans || [];
    },
    enabled: Boolean(open && (selectedMethod === "existing_plan" || selectedMethod === "reuse_days")),
  });

  const { data: templatesData } = useQuery({
    queryKey: ["workout-templates-builder"],
    queryFn: async () => {
      const res = await workoutApi.getTemplates();
      return res.data?.data?.templates || [];
    },
    enabled: Boolean(open && (selectedMethod === "existing_plan" || selectedMethod === "reuse_days")),
  });

  // Synchronize state when existingPlan prop changes or modal opens
  useEffect(() => {
    if (open) {
      if (existingPlan) {
        setName(existingPlan.name || "");
        setDescription(existingPlan.description || "");
        setFitnessLevel(existingPlan.fitnessLevel || "Intermediate");
        setGoal(existingPlan.goal || "Hypertrophy");
        setIsActive(existingPlan.isActive !== false);
        setSchedule(buildInitialSchedule(existingPlan));
        setActiveDayIdx(0);
        setCreationStep("customizer");
      } else {
        setName("");
        setDescription("");
        setFitnessLevel("Intermediate");
        setGoal("Hypertrophy");
        setIsActive(true);
        setSchedule(buildInitialSchedule(null));
        setActiveDayIdx(0);
        setCreationStep("select_method");
        setSelectedMethod("scratch");
        setSelectedDaysPool([]);
      }
    }
  }, [existingPlan, open]);

  // Method 2: Load from existing plan / template
  const handleLoadFromPlan = (plan) => {
    haptics.selection();
    setName(`${plan.name} (Custom Copy)`);
    setDescription(plan.description || "");
    setFitnessLevel(plan.fitnessLevel || "Intermediate");
    setGoal(plan.goal || "Hypertrophy");
    setSchedule(buildInitialSchedule(plan));
    setCreationStep("customizer");
    toast.success(`Loaded "${plan.name}" into builder!`);
  };

  // Method 3: Load from previous completed workout
  const handleLoadFromPreviousSession = (session) => {
    haptics.selection();
    setName(`${session.workoutName || "Workout"} Plan`);
    setDescription(`Custom workout routine built from completed session on ${session.date}.`);
    setFitnessLevel("Intermediate");
    setGoal("Hypertrophy");

    // Map session exercises into Monday schedule day
    const sessionExercises = (session.exercises || []).map((ex) => ({
      exerciseId: ex.exerciseId || null,
      name: ex.name,
      primaryMuscle: ex.primaryMuscle || session.targetMuscles?.[0] || "Chest",
      targetSets: ex.setsCount || 3,
      targetReps: ex.sampleReps || 10,
      targetWeight: ex.bestWeight || 0,
      restSeconds: 60,
      notes: "",
    }));

    const newSchedule = buildInitialSchedule(null);
    newSchedule[0] = {
      dayOfWeek: 1,
      dayName: session.workoutName || "Monday Workout",
      workoutName: session.workoutName || "Workout",
      isRestDay: false,
      targetMuscles: session.targetMuscles || ["Full Body"],
      exercises: sessionExercises,
    };

    setSchedule(newSchedule);
    setCreationStep("customizer");
    toast.success(`Converted ${session.workoutName} into new plan!`);
  };

  // Method 4: Assemble selected historical days
  const handleTogglePoolDay = (dayItem) => {
    haptics.tick();
    setSelectedDaysPool((prev) => {
      const exists = prev.some((d) => d.uniqueKey === dayItem.uniqueKey);
      if (exists) {
        return prev.filter((d) => d.uniqueKey !== dayItem.uniqueKey);
      }
      return [...prev, dayItem];
    });
  };

  const handleApplySelectedDays = () => {
    if (selectedDaysPool.length === 0) {
      toast.error("Please select at least 1 workout day to assemble your plan.");
      return;
    }

    haptics.goal();
    setName("My Hybrid Custom Split");
    setDescription(`Assembled from ${selectedDaysPool.length} customized training days.`);

    const newSchedule = buildInitialSchedule(null);
    selectedDaysPool.forEach((poolDay, idx) => {
      if (idx < 7) {
        newSchedule[idx] = {
          dayOfWeek: DAYS_OF_WEEK[idx].dayOfWeek,
          dayName: poolDay.dayName || `${DAYS_OF_WEEK[idx].name} Split`,
          workoutName: poolDay.workoutName || "Workout",
          isRestDay: false,
          targetMuscles: poolDay.targetMuscles || [],
          exercises: poolDay.exercises || [],
        };
      }
    });

    setSchedule(newSchedule);
    setCreationStep("customizer");
    toast.success(`Assembled ${selectedDaysPool.length} workout days into your new schedule!`);
  };

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

  const addExerciseToCurrentDay = (ex) => {
    haptics.tick();
    setSchedule((prev) => {
      const copy = [...prev];
      const day = copy[activeDayIdx];
      day.exercises = [
        ...(day.exercises || []),
        {
          exerciseId: ex._id || null,
          name: ex.name || "Exercise",
          targetSets: 3,
          targetReps: 10,
          targetWeight: 0,
          restSeconds: 60,
          primaryMuscle: ex.primaryMuscle || day.targetMuscles?.[0] || "Chest",
          notes: "",
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
      title={
        existingPlan
          ? `Edit "${existingPlan.name}"`
          : creationStep === "select_method"
          ? "Create Workout Plan"
          : "Customize Workout Plan"
      }
      description={
        creationStep === "select_method"
          ? "Choose how you would like to build your new workout routine."
          : "Configure your weekly schedule, exercises, target sets, and rest intervals."
      }
    >
      {creationStep === "select_method" ? (
        /* STEP 1: CHOOSE CREATION METHOD */
        <div className="space-y-4 pb-8">
          {/* Method Selection Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "scratch", label: "From Scratch", icon: Plus, desc: "Empty schedule" },
              { id: "existing_plan", label: "Existing Plan", icon: Copy, desc: "Duplicate & customize" },
              { id: "previous_workout", label: "Past Workout", icon: Trophy, desc: "Convert session" },
              { id: "reuse_days", label: "Mix Days", icon: Layers, desc: "Combine past days" },
            ].map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => {
                    haptics.tick();
                    setSelectedMethod(method.id);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-purple-50 border-purple-400 text-purple-900 shadow-xs ring-2 ring-purple-400/20"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? "text-purple-600" : "text-slate-500"}`} />
                  <span className="font-extrabold text-xs block leading-tight">{method.label}</span>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{method.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Method 1: Start From Scratch */}
          {selectedMethod === "scratch" && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base">Build From Scratch</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Design a fully customized 7-day schedule with your own days, muscle splits, and exercise selections.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  haptics.selection();
                  setCreationStep("customizer");
                }}
                className="w-full justify-center font-bold"
              >
                Continue to Plan Builder →
              </Button>
            </div>
          )}

          {/* Method 2: From Existing Plans & Templates */}
          {selectedMethod === "existing_plan" && (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Select an Existing Plan or Built-in Template to Duplicate
              </h4>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {/* User Saved Plans */}
                {(myPlansData || []).map((plan) => (
                  <div
                    key={plan._id}
                    onClick={() => handleLoadFromPlan(plan)}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 group-hover:text-purple-700">
                          {plan.name}
                        </span>
                        {plan.isActive && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {plan.daysPerWeek || plan.schedule?.length || 4} days/week • {plan.fitnessLevel || "Intermediate"} • {plan.goal || "Hypertrophy"}
                      </span>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs font-bold shrink-0">
                      Use This <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                ))}

                {/* Built-in Templates */}
                {(templatesData || []).map((tmpl) => (
                  <div
                    key={tmpl.key}
                    onClick={() => handleLoadFromPlan(tmpl)}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 group-hover:text-purple-700">
                          {tmpl.name}
                        </span>
                        <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700">
                          Template
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {tmpl.daysPerWeek} days/week • {tmpl.fitnessLevel} • {tmpl.goal}
                      </span>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs font-bold shrink-0">
                      Use This <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Method 3: From Previous Workouts */}
          {selectedMethod === "previous_workout" && (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Select a Completed Workout Session to Turn Into a Plan
              </h4>
              {isLoadingCompleted ? (
                <div className="space-y-2 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : (completedWorkoutsData || []).length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <Trophy className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-extrabold text-slate-700 text-sm">No completed workouts found</p>
                  <p className="text-xs text-slate-500">
                    Finish your first workout session to create plans from your history!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {completedWorkoutsData.map((session) => (
                    <div
                      key={session._id}
                      onClick={() => handleLoadFromPreviousSession(session)}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900 group-hover:text-purple-700">
                            {session.workoutName}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {session.date}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span>{session.exerciseCount} exercises</span>
                          <span>•</span>
                          <span>{session.durationMinutes} mins</span>
                          <span>•</span>
                          <span className="text-purple-700 font-bold">{session.totalVolumeKg} kg vol</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs font-bold shrink-0">
                        Convert <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Method 4: Reuse Previous Workout Days */}
          {selectedMethod === "reuse_days" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Pick Individual Training Days to Assemble Your Plan
                  </h4>
                  <span className="text-xs text-slate-500">
                    Selected {selectedDaysPool.length} of 7 days
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={selectedDaysPool.length === 0}
                  onClick={handleApplySelectedDays}
                >
                  Assemble Plan ({selectedDaysPool.length}) →
                </Button>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {/* Completed Session Days */}
                {(completedWorkoutsData || []).map((session) => {
                  const dayItem = {
                    uniqueKey: `session_${session._id}`,
                    dayName: session.workoutName,
                    workoutName: session.workoutName,
                    targetMuscles: session.targetMuscles || [],
                    exercises: (session.exercises || []).map((e) => ({
                      exerciseId: e.exerciseId || null,
                      name: e.name,
                      primaryMuscle: e.primaryMuscle || "",
                      targetSets: e.setsCount || 3,
                      targetReps: e.sampleReps || 10,
                      targetWeight: e.bestWeight || 0,
                      restSeconds: 60,
                    })),
                  };
                  const isChecked = selectedDaysPool.some((d) => d.uniqueKey === dayItem.uniqueKey);

                  return (
                    <div
                      key={dayItem.uniqueKey}
                      onClick={() => handleTogglePoolDay(dayItem)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? "bg-purple-50 border-purple-400 shadow-xs"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isChecked ? "bg-purple-600 text-white" : "border-2 border-slate-300"
                          }`}
                        >
                          {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-900 block">
                            {session.workoutName} ({session.date})
                          </span>
                          <span className="text-xs text-slate-500">
                            {session.exerciseCount} exercises • {session.targetMuscles?.join(", ") || "Full Body"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* STEP 2: PLAN CUSTOMIZER & SCHEDULE BUILDER */
        <form onSubmit={handleSubmit} className="space-y-5 pb-8">
          {/* Back to method selection if new plan */}
          {!existingPlan && (
            <button
              type="button"
              onClick={() => {
                haptics.tick();
                setCreationStep("select_method");
              }}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Creation Options
            </button>
          )}

          {/* Basic Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Plan Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Push Pull Legs Hypertrophy, Upper Lower Power..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:border-purple-400 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="Brief routine overview, focus areas, and goals..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs focus:outline-none focus:border-purple-400 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Fitness Level
                </label>
                <select
                  value={fitnessLevel}
                  onChange={(e) => setFitnessLevel(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs focus:outline-none focus:border-purple-400"
                >
                  {STANDARD_FITNESS_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Primary Goal
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs focus:outline-none focus:border-purple-400"
                >
                  {STANDARD_GOALS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/60 border border-purple-200/80">
              <div>
                <span className="font-extrabold text-xs text-purple-900 block">
                  Set as Active Plan
                </span>
                <span className="text-[11px] text-purple-700 font-medium">
                  Automatically drives your workout dashboard and daily schedule.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* 7-Day Weekly Schedule Selector */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
              7-Day Weekly Schedule
            </label>

            {/* Day Selector Pills */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {DAYS_OF_WEEK.map((d, idx) => {
                const dayPlan = schedule[idx] || {};
                const isSelected = activeDayIdx === idx;
                return (
                  <button
                    key={d.dayOfWeek}
                    type="button"
                    onClick={() => {
                      haptics.tick();
                      setActiveDayIdx(idx);
                    }}
                    className={`py-1.5 sm:py-2 px-0.5 sm:px-1 rounded-xl text-center border font-mono transition-all cursor-pointer min-h-[44px] flex flex-col items-center justify-center ${
                      isSelected
                        ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20"
                        : dayPlan.isRestDay
                        ? "bg-slate-100 border-slate-200 text-slate-400"
                        : "bg-white border-slate-200 text-slate-800 hover:border-purple-300"
                    }`}
                  >
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold block truncate max-w-full">
                      {d.name.slice(0, 3)}
                    </span>
                    <span className="text-[9px] sm:text-[11px] font-black block mt-0.5 truncate max-w-full">
                      {dayPlan.isRestDay ? "Rest" : `${(dayPlan.exercises || []).length} ex`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Day Configuration Card */}
            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div className="flex-1 min-w-[200px]">
                  <span className="text-[10px] font-black uppercase text-purple-600 block">
                    {DAYS_OF_WEEK[activeDayIdx].name} Configuration
                  </span>
                  <input
                    type="text"
                    value={currentDay.dayName}
                    onChange={(e) => updateDayField(activeDayIdx, "dayName", e.target.value)}
                    placeholder="e.g. Push Day (Chest & Triceps)"
                    className="font-extrabold text-sm text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-purple-600 w-full"
                  />
                </div>

                {/* Rest Day Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      haptics.tick();
                      updateDayField(activeDayIdx, "isRestDay", !currentDay.isRestDay);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                      currentDay.isRestDay
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    {currentDay.isRestDay ? "💤 Rest Day" : "💪 Workout Day"}
                  </button>
                </div>
              </div>

              {!currentDay.isRestDay && (
                <>
                  {/* Target Muscle Selector */}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">
                      Target Muscles
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {MUSCLE_LIST.map((muscle) => {
                        const isSelected = currentDay.targetMuscles?.includes(muscle);
                        return (
                          <button
                            key={muscle}
                            type="button"
                            onClick={() => toggleTargetMuscle(muscle)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-purple-600 text-white shadow-xs"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {muscle}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Exercises List for Active Day */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-slate-400">
                        Exercises ({(currentDay.exercises || []).length})
                      </label>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowExercisePicker(true)}
                        className="text-xs font-bold min-h-[38px] px-3"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1 stroke-[3]" /> Add From Library
                      </Button>
                    </div>

                    {(currentDay.exercises || []).length === 0 ? (
                      <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-2">
                        <Dumbbell className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">No exercises added yet</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowExercisePicker(true)}
                          className="min-h-[38px]"
                        >
                          Browse Exercise Library
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(currentDay.exercises || []).map((ex, exIdx) => (
                          <div
                            key={exIdx}
                            className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-xs font-black text-purple-700 bg-purple-50 w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
                                  {exIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={ex.name}
                                  onChange={(e) =>
                                    updateExerciseField(exIdx, "name", e.target.value)
                                  }
                                  className="font-extrabold text-xs text-slate-900 bg-transparent focus:outline-none focus:border-b focus:border-purple-600 truncate min-h-[36px]"
                                />
                              </div>

                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  disabled={exIdx === 0}
                                  onClick={() => moveExercise(exIdx, -1)}
                                  className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 active:bg-slate-100 disabled:opacity-20 cursor-pointer"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={exIdx === (currentDay.exercises || []).length - 1}
                                  onClick={() => moveExercise(exIdx, 1)}
                                  className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 active:bg-slate-100 disabled:opacity-20 cursor-pointer"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeExerciseFromCurrentDay(exIdx)}
                                  className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 active:bg-rose-50 cursor-pointer"
                                  title="Remove Exercise"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Sets / Reps / Rest inputs */}
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Sets</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={ex.targetSets}
                                  onChange={(e) =>
                                    updateExerciseField(exIdx, "targetSets", e.target.value)
                                  }
                                  className="w-full text-center font-black text-slate-900 bg-transparent focus:outline-none min-h-[28px] text-xs sm:text-sm"
                                />
                              </div>
                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Reps</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={ex.targetReps}
                                  onChange={(e) =>
                                    updateExerciseField(exIdx, "targetReps", e.target.value)
                                  }
                                  className="w-full text-center font-black text-slate-900 bg-transparent focus:outline-none min-h-[28px] text-xs sm:text-sm"
                                />
                              </div>
                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Rest (s)</span>
                                <input
                                  type="number"
                                  step="15"
                                  min="0"
                                  max="300"
                                  value={ex.restSeconds}
                                  onChange={(e) =>
                                    updateExerciseField(exIdx, "restSeconds", e.target.value)
                                  }
                                  className="w-full text-center font-black text-slate-900 bg-transparent focus:outline-none min-h-[28px] text-xs sm:text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Form Submit CTA */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              className="w-full min-h-[48px] justify-center font-black shadow-lg shadow-purple-600/20 text-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {existingPlan ? "Update Workout Plan" : "Save & Activate Workout Plan"}
            </Button>
          </div>
        </form>
      )}

      {/* Complete Exercise Picker Modal */}
      <ExercisePickerModal
        open={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelectExercise={(selectedEx) => addExerciseToCurrentDay(selectedEx)}
      />
    </Sheet>
  );
};

export default CustomPlanBuilderModal;

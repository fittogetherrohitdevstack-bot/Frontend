import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dietApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import {
  getLocalDateString,
  addDaysToDateString,
  getSignedDaysDiff,
} from "../utils/date";
import { formatDietPlanText, copyTextToClipboard } from "../utils/dietFormat";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { DaySelector } from "../components/ui/DaySelector";
import { Sheet } from "../components/ui/Sheet";
import { Skeleton } from "../components/ui/Skeleton";
import {
  Plus,
  Copy,
  Clock,
  Trash2,
  Edit2,
  Check,
  Utensils,
  ArrowRight,
  ArrowLeftRight,
  Repeat,
  CalendarDays,
  Sparkles,
  ClipboardCheck,
} from "lucide-react";
import { haptics } from "../motion/Haptics";
import { toast } from "sonner";

const QUICK_FOOD_ITEMS = [
  { name: "Rolled Oats", quantity: 60, unit: "g", calories: 230, protein: 8, carbs: 40, fats: 4 },
  { name: "Whole Eggs (2)", quantity: 2, unit: "eggs", calories: 140, protein: 12, carbs: 1, fats: 10 },
  { name: "Egg Whites (150g)", quantity: 150, unit: "g", calories: 78, protein: 16.5, carbs: 1, fats: 0.3 },
  { name: "Chicken Breast", quantity: 150, unit: "g", calories: 247, protein: 46, carbs: 0, fats: 5 },
  { name: "Whey Protein (1 scoop)", quantity: 33, unit: "g", calories: 120, protein: 24, carbs: 3, fats: 1.5 },
  { name: "White Rice (Cooked)", quantity: 150, unit: "g", calories: 195, protein: 4, carbs: 42, fats: 0.5 },
  { name: "Brown Rice (Cooked)", quantity: 150, unit: "g", calories: 165, protein: 3.5, carbs: 35, fats: 1.5 },
  { name: "Paneer (Cottage Cheese)", quantity: 100, unit: "g", calories: 265, protein: 18, carbs: 4, fats: 20 },
  { name: "Greek Yogurt", quantity: 150, unit: "g", calories: 130, protein: 15, carbs: 6, fats: 4 },
  { name: "Banana", quantity: 1, unit: "medium", calories: 105, protein: 1.3, carbs: 27, fats: 0.3 },
  { name: "Peanut Butter", quantity: 25, unit: "g", calories: 155, protein: 6.5, carbs: 5, fats: 13 },
  { name: "Sweet Potato", quantity: 150, unit: "g", calories: 130, protein: 2.3, carbs: 30, fats: 0.2 },
  { name: "Mixed Green Salad", quantity: 120, unit: "g", calories: 35, protein: 1.5, carbs: 6, fats: 0.4 },
];

export const DietPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState(new Date().getDay()); // 0-6 (0=Sun, 1=Mon, ...)
  const [draftMode, setDraftMode] = useState("simple"); // Used before first plan is created
  const [altSlot, setAltSlot] = useState("A"); // "A" | "B" for Alternating 2 Diets
  const [altNameDraft, setAltNameDraft] = useState({});
  const [showRenameAlt, setShowRenameAlt] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showCopyFormatModal, setShowCopyFormatModal] = useState(false);
  const [copyScope, setCopyScope] = useState("current"); // "current" | "all"
  const [copyStyle, setCopyStyle] = useState("share"); // "share" | "compact" | "markdown"
  const [copiedRecently, setCopiedRecently] = useState(false);
  const [targetDuplicateDay, setTargetDuplicateDay] = useState(1);
  const [duplicateToAll, setDuplicateToAll] = useState(false);
  const [editingMealIndex, setEditingMealIndex] = useState(-1);
  const timeInputRef = useRef(null);

  const MEAL_TIME_PRESETS = [
    { label: "07:30 Early", time: "07:30" },
    { label: "08:30 Breakfast", time: "08:30" },
    { label: "11:00 Snack", time: "11:00" },
    { label: "13:30 Lunch", time: "13:30" },
    { label: "17:00 Pre-Gym", time: "17:00" },
    { label: "19:00 Post-Gym", time: "19:00" },
    { label: "20:30 Dinner", time: "20:30" },
    { label: "22:00 Bedtime", time: "22:00" },
  ];

  const adjustScheduledTime = (deltaMinutes) => {
    const raw = mealForm.scheduledTime || "08:30";
    const parts = raw.split(":");
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    let total = h * 60 + m + deltaMinutes;
    if (total < 0) total += 24 * 60;
    total = total % (24 * 60);
    const newH = String(Math.floor(total / 60)).padStart(2, "0");
    const newM = String(total % 60).padStart(2, "0");
    setMealForm((prev) => ({ ...prev, scheduledTime: `${newH}:${newM}` }));
    haptics.tick();
  };

  // Form State for Adding / Editing a Meal
  const [mealForm, setMealForm] = useState({
    name: "",
    scheduledTime: "08:30",
    notes: "",
    totalNutrients: { calories: 350, protein: 25, carbs: 40, fats: 10 },
    foodItems: [{ name: "", quantity: 100, unit: "g" }],
  });

  // Fetch active diet plan
  const { data: plansData, isLoading } = useQuery({
    queryKey: ["my-diet-plans"],
    queryFn: async () => {
      const res = await dietApi.getMyPlans();
      return res.data?.data?.plans || [];
    },
  });

  const activePlan = plansData?.find((p) => p.isActive) || plansData?.[0];

  const todayStr = getLocalDateString(new Date(), user?.timezone);
  const tomorrowStr = addDaysToDateString(todayStr, 1);

  const cloneMealsClean = (meals = []) =>
    (meals || []).map((m) => ({
      name: m.name,
      scheduledTime: m.scheduledTime || "08:00",
      notes: m.notes || "",
      foodItems: (m.foodItems || []).map((f) => ({
        name: f.name,
        quantity: Number(f.quantity) || 1,
        unit: f.unit || "g",
        calories: Number(f.calories) || 0,
        protein: Number(f.protein) || 0,
        carbs: Number(f.carbs) || 0,
        fats: Number(f.fats) || 0,
      })),
    }));

  // Mutation to create a fresh ongoing plan (repeats for months/years)
  const createPlanMutation = useMutation({
    mutationFn: (initialData) =>
      dietApi.createPlan({
        name: initialData?.name || "Ongoing Meal Plan",
        startDate: todayStr,
        endDate: "2035-12-31", // Continuous multi-year duration
        scheduleMode: initialData?.scheduleMode || draftMode || "simple",
        simpleMeals: initialData?.simpleMeals || [],
        alternatingConfig: initialData?.alternatingConfig || {
          anchorDate: todayStr,
          dietAName: altNameDraft.A?.trim() || "Diet A",
          dietBName: altNameDraft.B?.trim() || "Diet B",
          dietAMeals: [],
          dietBMeals: [],
        },
        days: initialData?.days || [],
        isActive: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-diet-plans"] });
      queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["today-meal-log"] });
      queryClient.invalidateQueries({ queryKey: ["meal-day-chart"] });
      queryClient.invalidateQueries({ queryKey: ["group-dashboard"] });
      haptics.goal();
      toast.success("Continuous meal plan created! 🥗");
      setShowMealModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create meal plan");
    },
  });

  // Mutation to update any fields of the active plan while preserving earlier data
  const updatePlanMutation = useMutation({
    mutationFn: (payload) => {
      const body = Array.isArray(payload) ? { days: payload } : payload;
      return dietApi.updatePlan(activePlan._id, body);
    },
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["my-diet-plans"] });
      queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["today-meal-log"] });
      queryClient.invalidateQueries({ queryKey: ["meal-day-chart"] });
      queryClient.invalidateQueries({ queryKey: ["group-dashboard"] });
      haptics.goal();
      const customToast = !Array.isArray(variables) && variables?._toastMessage;
      const preserved = res?.data?.data?.preserved;
      toast.success(
        customToast ||
          (preserved
            ? "Plan saved! Today's logged meals were preserved; new plan starts tomorrow."
            : "Diet plan updated! Your schedule is saved.")
      );
      setShowMealModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update diet plan");
    },
  });

  // Mutation to duplicate day
  const duplicateDayMutation = useMutation({
    mutationFn: ({ fromDay, toDay, toAllDays }) =>
      dietApi.duplicateDay(activePlan._id, { fromDay, toDay, toAllDays }),
    onSuccess: (res, { toAllDays }) => {
      queryClient.invalidateQueries({ queryKey: ["my-diet-plans"] });
      haptics.tick();
      toast.success(
        toAllDays
          ? "Applied meals to all 7 days of the week! ✨"
          : "Day duplicated successfully!"
      );
      setShowDuplicateModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to duplicate day");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const currentMode = activePlan ? activePlan.scheduleMode || "weekly" : draftMode;
  const altConfig = activePlan?.alternatingConfig || {
    anchorDate: todayStr,
    dietAName: altNameDraft.A || "Diet A",
    dietBName: altNameDraft.B || "Diet B",
    dietAMeals: [],
    dietBMeals: [],
  };
  const dietAName = altConfig.dietAName || "Diet A";
  const dietBName = altConfig.dietBName || "Diet B";
  const effectiveAnchor = altConfig.anchorDate || activePlan?.startDate || todayStr;
  const isTodayDietA = Math.abs(getSignedDaysDiff(effectiveAnchor, todayStr)) % 2 === 0;
  const todayVariantName = isTodayDietA ? dietAName : dietBName;
  const tomorrowVariantName = isTodayDietA ? dietBName : dietAName;

  const currentDaySchedule = activePlan?.days?.find((d) => d.dayOfWeek === selectedDay);
  const mealsForDay =
    currentMode === "simple"
      ? activePlan?.simpleMeals || []
      : currentMode === "alternating"
      ? altSlot === "A"
        ? altConfig.dietAMeals || []
        : altConfig.dietBMeals || []
      : currentDaySchedule?.meals || [];

  const getFirstPopulatedWeeklyMeals = () =>
    (activePlan?.days || []).find((d) => (d.meals || []).length > 0)?.meals || [];

  // Calculate day totals
  const computeMealsTotals = (mealsList = []) =>
    mealsList.reduce(
      (acc, meal) => {
        (meal.foodItems || []).forEach((item) => {
          acc.calories += Number(item.calories) || 0;
          acc.protein += Number(item.protein) || 0;
          acc.carbs += Number(item.carbs) || 0;
          acc.fats += Number(item.fats) || 0;
        });
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

  const dayTotals = computeMealsTotals(mealsForDay);
  const dietATotals = computeMealsTotals(altConfig.dietAMeals || []);
  const dietBTotals = computeMealsTotals(altConfig.dietBMeals || []);

  const daysWithMeals = (activePlan?.days || [])
    .filter((d) => (d.meals || []).length > 0)
    .map((d) => d.dayOfWeek);

  const handleSwitchMode = (nextMode) => {
    haptics.tick();
    if (!activePlan) {
      setDraftMode(nextMode);
      return;
    }
    if (nextMode === currentMode) return;

    const existingSampleMeals =
      (activePlan.simpleMeals?.length ? activePlan.simpleMeals : null) ||
      (altConfig.dietAMeals?.length ? altConfig.dietAMeals : null) ||
      (currentDaySchedule?.meals?.length ? currentDaySchedule.meals : null) ||
      getFirstPopulatedWeeklyMeals();

    if (nextMode === "simple") {
      const nextSimple =
        activePlan.simpleMeals?.length > 0
          ? activePlan.simpleMeals
          : cloneMealsClean(existingSampleMeals);
      updatePlanMutation.mutate({
        scheduleMode: "simple",
        simpleMeals: nextSimple,
        _toastMessage:
          "Switched to Simple Daily Plan! Earlier weekly & alternating plans remain saved.",
      });
    } else if (nextMode === "alternating") {
      const nextDietA =
        altConfig.dietAMeals?.length > 0
          ? altConfig.dietAMeals
          : cloneMealsClean(existingSampleMeals);
      updatePlanMutation.mutate({
        scheduleMode: "alternating",
        alternatingConfig: {
          anchorDate: altConfig.anchorDate || todayStr,
          dietAName,
          dietBName,
          dietAMeals: nextDietA,
          dietBMeals: altConfig.dietBMeals || [],
        },
        _toastMessage:
          "Switched to Alternating 2-Diet Days! Earlier meals & weekly data preserved.",
      });
    } else {
      updatePlanMutation.mutate({
        scheduleMode: "weekly",
        _toastMessage: "Switched to 7-Day Weekly Planner!",
      });
    }
  };

  const handleSwapTodayDiet = () => {
    if (!activePlan) return;
    haptics.tick();
    const yesterdayStr = addDaysToDateString(todayStr, -1);
    const nextAnchor = isTodayDietA ? yesterdayStr : todayStr;
    updatePlanMutation.mutate({
      alternatingConfig: {
        ...altConfig,
        anchorDate: nextAnchor,
      },
      _toastMessage: isTodayDietA
        ? `Today is now ${dietBName} · Tomorrow is ${dietAName}`
        : `Today is now ${dietAName} · Tomorrow is ${dietBName}`,
    });
  };

  const handleSaveAltNames = () => {
    if (!activePlan) return;
    const nextA = (altNameDraft.A ?? dietAName).trim() || "Diet A";
    const nextB = (altNameDraft.B ?? dietBName).trim() || "Diet B";
    setShowRenameAlt(false);
    updatePlanMutation.mutate({
      alternatingConfig: {
        ...altConfig,
        anchorDate: effectiveAnchor,
        dietAName: nextA,
        dietBName: nextB,
      },
      _toastMessage: "Saved Diet A & Diet B names!",
    });
  };

  const handleCopyMealsIntoAltSlot = (targetSlot, sourceMeals) => {
    if (!activePlan || !sourceMeals?.length) return;
    haptics.tick();
    const cloned = cloneMealsClean(sourceMeals);
    updatePlanMutation.mutate({
      alternatingConfig: {
        ...altConfig,
        anchorDate: effectiveAnchor,
        [targetSlot === "A" ? "dietAMeals" : "dietBMeals"]: cloned,
      },
      _toastMessage: `Copied meals into ${targetSlot === "A" ? dietAName : dietBName}!`,
    });
  };

  const handleOpenAddMeal = () => {
    setEditingMealIndex(-1);
    setMealForm({
      name: "",
      scheduledTime: "08:30",
      notes: "",
      totalNutrients: { calories: 350, protein: 25, carbs: 40, fats: 10 },
      foodItems: [{ name: "", quantity: 100, unit: "g" }],
    });
    setShowMealModal(true);
  };

  const handleOpenEditMeal = (meal, idx) => {
    setEditingMealIndex(idx);
    const totalCal = (meal.foodItems || []).reduce((s, f) => s + (Number(f.calories) || 0), 0);
    const totalPro = (meal.foodItems || []).reduce((s, f) => s + (Number(f.protein) || 0), 0);
    const totalCarb = (meal.foodItems || []).reduce((s, f) => s + (Number(f.carbs) || 0), 0);
    const totalFat = (meal.foodItems || []).reduce((s, f) => s + (Number(f.fats) || 0), 0);

    setMealForm({
      name: meal.name,
      scheduledTime: meal.scheduledTime || "08:30",
      notes: meal.notes || "",
      totalNutrients: {
        calories: totalCal || 350,
        protein: totalPro || 25,
        carbs: totalCarb || 40,
        fats: totalFat || 10,
      },
      foodItems: meal.foodItems?.length
        ? meal.foodItems.map((f) => ({ name: f.name, quantity: f.quantity, unit: f.unit }))
        : [{ name: "", quantity: 100, unit: "g" }],
    });
    setShowMealModal(true);
  };

  const handleDeleteMeal = (idx) => {
    if (!activePlan) return;
    if (currentMode === "simple") {
      const updatedSimple = (activePlan.simpleMeals || []).filter((_, i) => i !== idx);
      updatePlanMutation.mutate({ simpleMeals: updatedSimple });
      return;
    }

    if (currentMode === "alternating") {
      const key = altSlot === "A" ? "dietAMeals" : "dietBMeals";
      const updatedSlotMeals = (altConfig[key] || []).filter((_, i) => i !== idx);
      updatePlanMutation.mutate({
        alternatingConfig: {
          ...altConfig,
          anchorDate: effectiveAnchor,
          [key]: updatedSlotMeals,
        },
      });
      return;
    }

    const updatedDays = (activePlan.days || []).map((d) => {
      if (d.dayOfWeek === selectedDay) {
        return {
          ...d,
          meals: d.meals.filter((_, i) => i !== idx),
        };
      }
      return d;
    });
    updatePlanMutation.mutate(updatedDays);
  };

  const handleTotalNutrientChange = (field, val) => {
    setMealForm((prev) => ({
      ...prev,
      totalNutrients: {
        ...prev.totalNutrients,
        [field]: Math.max(0, Number(val) || 0),
      },
    }));
  };

  const handleSaveMeal = (e) => {
    e.preventDefault();

    const totCal = Number(mealForm.totalNutrients?.calories) || 0;
    const totPro = Number(mealForm.totalNutrients?.protein) || 0;
    const totCarb = Number(mealForm.totalNutrients?.carbs) || 0;
    const totFat = Number(mealForm.totalNutrients?.fats) || 0;

    let validItems = (mealForm.foodItems || []).filter((it) => it.name && it.name.trim());
    if (validItems.length === 0) {
      validItems = [{
        name: mealForm.name.trim() || "Meal Portion",
        quantity: 1,
        unit: "serving",
      }];
    }

    const count = validItems.length;
    const formattedFoodItems = validItems.map((item, idx) => {
      if (idx === count - 1) {
        const prevCal = Math.floor(totCal / count) * (count - 1);
        const prevPro = Math.floor(totPro / count) * (count - 1);
        const prevCarb = Math.floor(totCarb / count) * (count - 1);
        const prevFat = Math.floor(totFat / count) * (count - 1);
        return {
          name: item.name.trim(),
          quantity: Number(item.quantity) || 1,
          unit: item.unit || "g",
          calories: totCal - prevCal,
          protein: totPro - prevPro,
          carbs: totCarb - prevCarb,
          fats: totFat - prevFat,
        };
      }
      return {
        name: item.name.trim(),
        quantity: Number(item.quantity) || 1,
        unit: item.unit || "g",
        calories: Math.floor(totCal / count),
        protein: Math.floor(totPro / count),
        carbs: Math.floor(totCarb / count),
        fats: Math.floor(totFat / count),
      };
    });

    const mealPayload = {
      name: mealForm.name.trim() || "Meal",
      scheduledTime: mealForm.scheduledTime || "08:30",
      notes: mealForm.notes || "",
      foodItems: formattedFoodItems,
    };

    if (!activePlan) {
      if (currentMode === "simple") {
        createPlanMutation.mutate({
          name: "Simple Ongoing Meal Plan",
          scheduleMode: "simple",
          simpleMeals: [mealPayload],
        });
      } else if (currentMode === "alternating") {
        createPlanMutation.mutate({
          name: "Alternating 2-Diet Plan",
          scheduleMode: "alternating",
          alternatingConfig: {
            anchorDate: todayStr,
            dietAName: altNameDraft.A?.trim() || "Diet A",
            dietBName: altNameDraft.B?.trim() || "Diet B",
            dietAMeals: altSlot === "A" ? [mealPayload] : [],
            dietBMeals: altSlot === "B" ? [mealPayload] : [],
          },
        });
      } else {
        createPlanMutation.mutate({
          name: "Ongoing Meal Plan",
          scheduleMode: "weekly",
          days: [{ dayOfWeek: selectedDay, meals: [mealPayload] }],
        });
      }
      return;
    }

    if (currentMode === "simple") {
      const updatedSimple = [...(activePlan.simpleMeals || [])];
      if (editingMealIndex >= 0) {
        updatedSimple[editingMealIndex] = {
          ...updatedSimple[editingMealIndex],
          ...mealPayload,
        };
      } else {
        updatedSimple.push(mealPayload);
      }
      updatePlanMutation.mutate({ scheduleMode: "simple", simpleMeals: updatedSimple });
      return;
    }

    if (currentMode === "alternating") {
      const key = altSlot === "A" ? "dietAMeals" : "dietBMeals";
      const updatedSlotMeals = [...(altConfig[key] || [])];
      if (editingMealIndex >= 0) {
        updatedSlotMeals[editingMealIndex] = {
          ...updatedSlotMeals[editingMealIndex],
          ...mealPayload,
        };
      } else {
        updatedSlotMeals.push(mealPayload);
      }
      updatePlanMutation.mutate({
        scheduleMode: "alternating",
        alternatingConfig: {
          ...altConfig,
          anchorDate: effectiveAnchor,
          [key]: updatedSlotMeals,
        },
      });
      return;
    }

    let updatedDays = [...(activePlan.days || [])];
    let dayIndex = updatedDays.findIndex((d) => d.dayOfWeek === selectedDay);

    if (dayIndex === -1) {
      updatedDays.push({
        dayOfWeek: selectedDay,
        meals: [mealPayload],
      });
    } else {
      let dayMeals = [...(updatedDays[dayIndex].meals || [])];
      if (editingMealIndex >= 0) {
        dayMeals[editingMealIndex] = {
          ...dayMeals[editingMealIndex],
          ...mealPayload,
        };
      } else {
        dayMeals.push(mealPayload);
      }
      updatedDays[dayIndex] = {
        ...updatedDays[dayIndex],
        meals: dayMeals,
      };
    }

    updatePlanMutation.mutate(updatedDays);
  };

  const handleAddFoodItem = () => {
    setMealForm((prev) => ({
      ...prev,
      foodItems: [
        ...prev.foodItems,
        { name: "", quantity: 100, unit: "g" },
      ],
    }));
    haptics.tick();
  };

  const handleFoodItemChange = (idx, field, val) => {
    setMealForm((prev) => {
      const items = [...prev.foodItems];
      items[idx] = {
        ...items[idx],
        [field]: field === "quantity" ? Number(val) : val,
      };
      return { ...prev, foodItems: items };
    });
  };

  const handleSelectQuickFood = (food) => {
    setMealForm((prev) => {
      const items = [...prev.foodItems];
      const lastIdx = items.length - 1;
      if (lastIdx >= 0 && !items[lastIdx].name) {
        items[lastIdx] = { name: food.name, quantity: food.quantity, unit: food.unit };
      } else {
        items.push({ name: food.name, quantity: food.quantity, unit: food.unit });
      }

      return {
        ...prev,
        foodItems: items,
        totalNutrients: {
          calories: (Number(prev.totalNutrients?.calories) || 0) + (Number(food.calories) || 0),
          protein: (Number(prev.totalNutrients?.protein) || 0) + (Number(food.protein) || 0),
          carbs: (Number(prev.totalNutrients?.carbs) || 0) + (Number(food.carbs) || 0),
          fats: (Number(prev.totalNutrients?.fats) || 0) + (Number(food.fats) || 0),
        },
      };
    });
    haptics.tick();
  };

  const handleRemoveFoodItem = (idx) => {
    setMealForm((prev) => ({
      ...prev,
      foodItems: prev.foodItems.filter((_, i) => i !== idx),
    }));
    haptics.tick();
  };

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const currentScheduleTitle =
    currentMode === "simple"
      ? "Daily Meals"
      : currentMode === "alternating"
      ? altSlot === "A"
        ? dietAName
        : dietBName
      : dayNames[selectedDay];

  const scheduleModeOptions = [
    {
      id: "simple",
      label: "Simple Daily",
      sub: "Same meals every day",
      icon: Sparkles,
    },
    {
      id: "alternating",
      label: "2-Diet Alternate",
      sub: "Today Diet A · Tomorrow Diet B",
      icon: ArrowLeftRight,
    },
    {
      id: "weekly",
      label: "7-Day Weekly",
      sub: "Custom schedule Mon–Sun",
      icon: CalendarDays,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto text-slate-900 overflow-x-hidden pb-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-block text-[11px] font-black text-lime-700 uppercase tracking-widest bg-lime-100/70 px-2.5 py-0.5 rounded-full border border-lime-200">
            Ongoing Recurring Meal Plan
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 break-words">
            {activePlan?.name || "My Ongoing Meal Plan"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
            Switch between Simple, Alternating (2 Diets), or 7-Day Weekly anytime — earlier plans and past logs are always preserved.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <Link
            to="/tracker"
            className={activePlan ? "w-full sm:w-auto" : "col-span-2 sm:col-span-1 w-full sm:w-auto"}
          >
            <Button
              size="sm"
              className="w-full sm:w-auto min-h-[44px] text-xs font-bold bg-lime-500 hover:bg-lime-600 text-black"
            >
              Today's Checklist <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>

          {activePlan && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCopiedRecently(false);
                setCopyScope("current");
                setShowCopyFormatModal(true);
              }}
              className="w-full sm:w-auto min-h-[44px] text-xs font-bold"
            >
              <ClipboardCheck className="w-3.5 h-3.5 mr-1 text-lime-700" /> Copy Diet
            </Button>
          )}

          {currentMode === "weekly" && activePlan && mealsForDay.length > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setDuplicateToAll(false);
                setShowDuplicateModal(true);
              }}
              className="col-span-2 sm:col-span-1 w-full sm:w-auto min-h-[44px] text-xs"
            >
              <Copy className="w-3.5 h-3.5 mr-1" /> Duplicate Day
            </Button>
          )}
        </div>
      </div>

      {/* Plan Mode Switcher (Mobile-First Stacked Radio Cards -> 3-Col Desktop) */}
      <GlassCard className="!p-3 sm:!p-4 bg-white/95 border border-slate-200/90 rounded-2xl shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-1.5 px-0.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Diet Rotation Mode
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
            Earlier data preserved
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {scheduleModeOptions.map((opt) => {
            const Icon = opt.icon;
            const isActiveMode = currentMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isActiveMode}
                disabled={updatePlanMutation.isPending}
                onClick={() => handleSwitchMode(opt.id)}
                className={`w-full min-h-[54px] sm:min-h-[68px] px-3.5 py-2.5 rounded-xl border text-left transition-all flex sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-3 sm:gap-1 cursor-pointer ${
                  isActiveMode
                    ? "bg-lime-50 border-lime-400 shadow-xs ring-1 ring-lime-300/60"
                    : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/80"
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-1.5 min-w-0">
                  <div
                    className={`w-8 h-8 sm:w-auto sm:h-auto rounded-lg sm:rounded-none flex items-center justify-center shrink-0 ${
                      isActiveMode
                        ? "bg-lime-500/20 text-lime-800 sm:bg-transparent sm:text-lime-700"
                        : "bg-slate-200/60 text-slate-500 sm:bg-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`text-sm font-extrabold block leading-tight ${
                        isActiveMode ? "text-slate-900" : "text-slate-700"
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium block leading-tight mt-0.5">
                      {opt.sub}
                    </span>
                  </div>
                </div>

                <span
                  className={`sm:hidden shrink-0 w-5 h-5 rounded-full flex items-center justify-center border ${
                    isActiveMode
                      ? "bg-lime-500 border-lime-600 text-black"
                      : "bg-white border-slate-300"
                  }`}
                >
                  {isActiveMode && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Mode-Specific Schedule Selector */}
      {currentMode === "simple" && (
        <GlassCard className="p-3.5 sm:p-4 bg-gradient-to-r from-lime-50/70 via-emerald-50/50 to-teal-50/70 border border-lime-200/80 rounded-2xl shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-lime-500 text-black flex items-center justify-center shrink-0 font-bold shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                Simple Daily Diet — Same Plan Every Day
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Build your core daily meal list once. Every day on your{" "}
                <Link to="/tracker" className="text-lime-800 font-bold underline">
                  Daily Tracker
                </Link>{" "}
                automatically uses these meals.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {currentMode === "alternating" && (
        <GlassCard className="p-3 sm:p-4 bg-white/95 border border-slate-200/90 rounded-2xl shadow-xs space-y-3">
          {/* Today vs Tomorrow Rotation Preview + Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-lime-50/80 via-emerald-50/60 to-violet-50/60 border border-lime-200/80 rounded-xl p-3">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold text-slate-900">
                <span className="px-2 py-0.5 rounded-full bg-lime-500 text-black text-[11px]">
                  Today: {todayVariantName}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200 text-[11px]">
                  Tomorrow: {tomorrowVariantName}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                Alternates every day between your 2 diets while keeping past logs intact.
              </p>
            </div>

            {activePlan && (
              <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleSwapTodayDiet}
                  isLoading={updatePlanMutation.isPending}
                  className="w-full sm:w-auto min-h-[44px] text-xs font-bold"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 mr-1" />
                  Swap Today
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRenameAlt((v) => !v)}
                  className="w-full sm:w-auto min-h-[44px] text-xs font-bold"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  {showRenameAlt ? "Close" : "Rename A/B"}
                </Button>
              </div>
            )}
          </div>

          {/* Diet A & Diet B Selector Cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {[
              {
                slot: "A",
                name: dietAName,
                mealsCount: (altConfig.dietAMeals || []).length,
                kcal: dietATotals.calories,
                runsToday: isTodayDietA,
              },
              {
                slot: "B",
                name: dietBName,
                mealsCount: (altConfig.dietBMeals || []).length,
                kcal: dietBTotals.calories,
                runsToday: !isTodayDietA,
              },
            ].map((item) => {
              const isSelectedSlot = altSlot === item.slot;
              return (
                <button
                  key={item.slot}
                  type="button"
                  onClick={() => {
                    haptics.tick();
                    setAltSlot(item.slot);
                  }}
                  className={`min-h-[86px] p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelectedSlot
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-slate-50/80 text-slate-900 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 w-full min-w-0">
                    <span
                      className={`self-start sm:order-2 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                        item.runsToday
                          ? isSelectedSlot
                            ? "bg-lime-400 text-black"
                            : "bg-lime-100 text-lime-800"
                          : isSelectedSlot
                          ? "bg-white/15 text-slate-200"
                          : "bg-slate-200/80 text-slate-600"
                      }`}
                    >
                      {item.runsToday ? "TODAY" : "TOMORROW"}
                    </span>
                    <span className="text-sm font-black break-words leading-tight sm:order-1">
                      {item.name}
                    </span>
                  </div>
                  <div
                    className={`text-[11px] font-semibold tabular-nums ${
                      isSelectedSlot ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {item.mealsCount} meals · {item.kcal} kcal
                  </div>
                </button>
              );
            })}
          </div>

          {/* Collapsible Custom Names for Diet A / Diet B */}
          {showRenameAlt && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2.5 border-t border-slate-100 items-end">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Diet A Label
                </label>
                <input
                  type="text"
                  value={altNameDraft.A ?? dietAName}
                  onChange={(e) =>
                    setAltNameDraft((prev) => ({ ...prev, A: e.target.value }))
                  }
                  placeholder="e.g. High-Carb / Veg Day"
                  className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 border border-slate-200 text-base sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-lime-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Diet B Label
                </label>
                <input
                  type="text"
                  value={altNameDraft.B ?? dietBName}
                  onChange={(e) =>
                    setAltNameDraft((prev) => ({ ...prev, B: e.target.value }))
                  }
                  placeholder="e.g. Low-Carb / Eggs Day"
                  className="w-full min-h-[44px] px-3 rounded-xl bg-slate-50 border border-slate-200 text-base sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-lime-500"
                />
              </div>
              {activePlan && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleSaveAltNames}
                  isLoading={updatePlanMutation.isPending}
                  className="w-full min-h-[44px] text-xs font-bold"
                >
                  Save Diet Names
                </Button>
              )}
            </div>
          )}
        </GlassCard>
      )}

      {currentMode === "weekly" && (
        <GlassCard className="p-2 sm:p-3 bg-white/95">
          <DaySelector
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            activeDaysWithMeals={daysWithMeals}
          />
        </GlassCard>
      )}

      {/* Day Totals Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 bg-white/95 border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 text-center shadow-xs">
        <div className="rounded-xl bg-lime-50/60 sm:bg-transparent py-2 sm:py-0 px-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Calories</span>
          <p className="text-base font-extrabold text-lime-700 tabular-nums">{dayTotals.calories} kcal</p>
        </div>
        <div className="rounded-xl bg-purple-50/60 sm:bg-transparent py-2 sm:py-0 px-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Protein</span>
          <p className="text-base font-extrabold text-purple-700 tabular-nums">{dayTotals.protein} g</p>
        </div>
        <div className="rounded-xl bg-amber-50/60 sm:bg-transparent py-2 sm:py-0 px-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Carbs</span>
          <p className="text-base font-extrabold text-amber-600 tabular-nums">{dayTotals.carbs} g</p>
        </div>
        <div className="rounded-xl bg-rose-50/60 sm:bg-transparent py-2 sm:py-0 px-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Fats</span>
          <p className="text-base font-extrabold text-rose-600 tabular-nums">{dayTotals.fats} g</p>
        </div>
      </div>

      {/* Meals List for Selected Schedule */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
              {currentScheduleTitle} ({mealsForDay.length} Meals)
            </h3>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            {currentMode === "weekly" && mealsForDay.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Apply ${dayNames[selectedDay]}'s meals to ALL 7 days of the week?`)) {
                    duplicateDayMutation.mutate({
                      fromDay: selectedDay,
                      toAllDays: true,
                    });
                  }
                }}
                className="flex-1 sm:flex-initial min-h-[44px] text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-2 rounded-xl border border-violet-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Repeat className="w-3.5 h-3.5 shrink-0" />
                <span>Apply to All 7 Days</span>
              </button>
            )}

            {currentMode === "alternating" &&
              activePlan &&
              (altSlot === "B" ? (altConfig.dietAMeals || []).length > 0 : (altConfig.dietBMeals || []).length > 0) && (
                <button
                  type="button"
                  onClick={() =>
                    handleCopyMealsIntoAltSlot(
                      altSlot,
                      altSlot === "B" ? altConfig.dietAMeals : altConfig.dietBMeals
                    )
                  }
                  className="flex-1 sm:flex-initial min-h-[44px] text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-2 rounded-xl border border-violet-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  <span>Copy {altSlot === "B" ? dietAName : dietBName}</span>
                </button>
              )}

            <Button
              size="sm"
              onClick={handleOpenAddMeal}
              className="flex-1 sm:flex-initial min-h-[44px] px-4 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Meal
            </Button>
          </div>
        </div>

        {mealsForDay.length === 0 ? (
          <GlassCard className="text-center py-8 sm:py-10 px-4 border-dashed border-slate-200 bg-white/70 space-y-3">
            <Utensils className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-sm">
                No meals planned for {currentScheduleTitle}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                {currentMode === "simple"
                  ? "Add your daily Breakfast, Lunch, Snacks, or Dinner below to repeat effortlessly every day."
                  : currentMode === "alternating"
                  ? `Add meals for ${currentScheduleTitle}, or copy your other diet and tweak a couple items.`
                  : `Add your Breakfast, Lunch, Snacks, or Dinner below. Once added, it will repeat every ${dayNames[selectedDay]} continuously!`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-2.5 pt-1">
              <Button size="sm" onClick={handleOpenAddMeal} className="w-full sm:w-auto min-h-[44px]">
                <Plus className="w-4 h-4 mr-1" /> Add Meal to {currentScheduleTitle}
              </Button>

              {currentMode === "weekly" && daysWithMeals.length > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full sm:w-auto min-h-[44px]"
                  onClick={() => {
                    setTargetDuplicateDay(selectedDay);
                    setDuplicateToAll(false);
                    setShowDuplicateModal(true);
                  }}
                >
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy From Another Day
                </Button>
              )}

              {currentMode === "alternating" &&
                activePlan &&
                (altSlot === "B"
                  ? (altConfig.dietAMeals || []).length > 0
                  : (altConfig.dietBMeals || []).length > 0) && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full sm:w-auto min-h-[44px]"
                    onClick={() =>
                      handleCopyMealsIntoAltSlot(
                        altSlot,
                        altSlot === "B" ? altConfig.dietAMeals : altConfig.dietBMeals
                      )
                    }
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy{" "}
                    {altSlot === "B" ? dietAName : dietBName} Meals
                  </Button>
                )}
            </div>
          </GlassCard>
        ) : (
          mealsForDay.map((meal, idx) => {
            const mealCals = (meal.foodItems || []).reduce(
              (s, f) => s + (Number(f.calories) || 0),
              0
            );
            const mealProtein = (meal.foodItems || []).reduce(
              (s, f) => s + (Number(f.protein) || 0),
              0
            );
            const mealCarbs = (meal.foodItems || []).reduce(
              (s, f) => s + (Number(f.carbs) || 0),
              0
            );
            const mealFats = (meal.foodItems || []).reduce(
              (s, f) => s + (Number(f.fats) || 0),
              0
            );

            return (
              <GlassCard
                key={meal.mealId || idx}
                className="hover:border-slate-300 transition-all p-3.5 sm:p-4 bg-white/95"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{meal.name}</h4>
                      <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium shrink-0">
                        <Clock className="w-3 h-3 text-lime-600" />
                        {meal.scheduledTime}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
                      {meal.foodItems?.map((f) => `${f.name}${f.quantity ? ` (${f.quantity}${f.unit || "g"})` : ""}`).join(" • ")}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                    <div className="text-left sm:text-right sm:mr-2">
                      <span className="text-xs font-black text-lime-700 block tabular-nums">{mealCals} kcal</span>
                      <p className="text-[11px] sm:text-[10px] text-slate-500 font-bold tabular-nums">
                        <span className="text-purple-700">{mealProtein}g P</span> ·{" "}
                        <span className="text-amber-600">{mealCarbs}g C</span> ·{" "}
                        <span className="text-rose-600">{mealFats}g F</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Edit ${meal.name}`}
                        onClick={() => handleOpenEditMeal(meal, idx)}
                        className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${meal.name}`}
                        onClick={() => handleDeleteMeal(idx)}
                        className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      {/* Add / Edit Meal Drawer */}
      <Sheet
        open={showMealModal}
        onOpenChange={setShowMealModal}
        title={editingMealIndex >= 0 ? "Edit Meal" : `Add Meal to ${currentScheduleTitle}`}
        description="Configure meal name, time, and food items"
      >
        <form onSubmit={handleSaveMeal} className="space-y-4 pt-1 pb-3">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Meal Name</label>
              <input
                type="text"
                required
                value={mealForm.name}
                onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                placeholder="e.g. Breakfast, Pre-Workout, Lunch, Dinner"
                className="w-full min-h-[46px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-base focus:outline-none focus:border-lime-500 focus:bg-white shadow-xs font-medium"
              />
            </div>

            {/* Scheduled Time Section (Interactive Steppers + Quick Presets + Native Picker) */}
            <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-lime-600" />
                  Scheduled Time
                </label>
                <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-xs tabular-nums">
                  {mealForm.scheduledTime || "08:30"}
                </span>
              </div>

              {/* Time Input with 1-Tap Trigger and Micro-Steppers */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div
                  onClick={() => {
                    try {
                      timeInputRef.current?.showPicker?.();
                    } catch (e) {
                      timeInputRef.current?.focus?.();
                    }
                  }}
                  className="relative flex-1 cursor-pointer"
                >
                  <input
                    ref={timeInputRef}
                    type="time"
                    data-vaul-no-drag
                    value={mealForm.scheduledTime}
                    onChange={(e) => {
                      if (e.target.value) {
                        setMealForm({ ...mealForm, scheduledTime: e.target.value });
                      }
                    }}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-base font-bold focus:outline-none focus:border-lime-500 shadow-xs cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-3 sm:flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => adjustScheduledTime(-15)}
                    className="min-h-[44px] px-3 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer select-none"
                    title="15 min earlier"
                  >
                    -15m
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustScheduledTime(15)}
                    className="min-h-[44px] px-3 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer select-none"
                    title="15 min later"
                  >
                    +15m
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustScheduledTime(30)}
                    className="min-h-[44px] px-3 rounded-xl bg-lime-100 hover:bg-lime-200 active:scale-95 text-lime-800 border border-lime-300 text-xs font-black transition-all shadow-xs cursor-pointer select-none"
                    title="30 min later"
                  >
                    +30m
                  </button>
                </div>
              </div>

              {/* One-Tap Meal Time Presets */}
              <div className="pt-1.5 border-t border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  1-Tap Time Presets
                </span>
                <div className="flex sm:flex-wrap gap-1.5 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 scrollbar-none">
                  {MEAL_TIME_PRESETS.map((preset) => {
                    const isSelected = mealForm.scheduledTime === preset.time;
                    return (
                      <button
                        key={preset.time}
                        type="button"
                        onClick={() => {
                          setMealForm({ ...mealForm, scheduledTime: preset.time });
                          haptics.tick();
                        }}
                        className={`shrink-0 min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-lime-500 text-slate-950 shadow-xs ring-1 ring-lime-600"
                            : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 1. Total Nutrients in this Meal (Highlight Bento Card) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-lime-50/90 via-white to-slate-50 border border-lime-300/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-lime-500 animate-pulse" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Total Nutrients in this Meal
                </h4>
              </div>
              <span className="text-[10px] font-extrabold text-lime-800 bg-lime-100 px-2 py-0.5 rounded-md border border-lime-200">
                Meal-level totals
              </span>
            </div>

            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Enter the overall macros for this meal. You can list items below without calculating individual nutrients!
            </p>

            {/* 4 Nutrient Inputs Bento Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {/* Calories */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Calories (kcal)
                </span>
                <input
                  type="number"
                  min="0"
                  required
                  value={mealForm.totalNutrients?.calories ?? 0}
                  onChange={(e) => handleTotalNutrientChange("calories", e.target.value)}
                  className="w-full text-base sm:text-lg font-black text-lime-700 bg-transparent focus:outline-none"
                  placeholder="0"
                />
              </div>

              {/* Protein */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 block mb-1">
                  Protein (g)
                </span>
                <input
                  type="number"
                  min="0"
                  value={mealForm.totalNutrients?.protein ?? 0}
                  onChange={(e) => handleTotalNutrientChange("protein", e.target.value)}
                  className="w-full text-base sm:text-lg font-black text-purple-700 bg-transparent focus:outline-none"
                  placeholder="0"
                />
              </div>

              {/* Carbs */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block mb-1">
                  Carbs (g)
                </span>
                <input
                  type="number"
                  min="0"
                  value={mealForm.totalNutrients?.carbs ?? 0}
                  onChange={(e) => handleTotalNutrientChange("carbs", e.target.value)}
                  className="w-full text-base sm:text-lg font-black text-amber-600 bg-transparent focus:outline-none"
                  placeholder="0"
                />
              </div>

              {/* Fats */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block mb-1">
                  Fats (g)
                </span>
                <input
                  type="number"
                  min="0"
                  value={mealForm.totalNutrients?.fats ?? 0}
                  onChange={(e) => handleTotalNutrientChange("fats", e.target.value)}
                  className="w-full text-base sm:text-lg font-black text-rose-600 bg-transparent focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* 2. Instant Autocomplete Food Library Chips */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Quick-Add Food Suggestions
              </label>
              <span className="text-[10px] text-slate-400 font-medium shrink-0">Tap to add</span>
            </div>
            <div className="flex sm:flex-wrap gap-1.5 overflow-x-auto sm:overflow-visible pb-1.5 sm:pb-0 scrollbar-none">
              {QUICK_FOOD_ITEMS.map((food, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectQuickFood(food)}
                  className="shrink-0 min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-lime-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
                >
                  + {food.name} <span className="text-slate-400 font-normal">({food.calories} cal)</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Food items rows (Names and quantities only - no per-item macro clutter!) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                  Food Items in this Meal
                </span>
                <p className="text-[10px] text-slate-500 font-medium">
                  List items you eat (nutrients are tracked as meal total above)
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddFoodItem}
                className="min-h-[44px] px-3 rounded-xl bg-lime-50 hover:bg-lime-100 text-xs text-lime-800 font-bold border border-lime-200 inline-flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-2">
              {mealForm.foodItems.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 sm:p-3 rounded-xl bg-slate-50/90 border border-slate-200">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rolled Oats, 2 Eggs, Banana"
                    value={item.name}
                    onChange={(e) => handleFoodItemChange(idx, "name", e.target.value)}
                    className="w-full sm:flex-1 min-h-[44px] px-3 rounded-xl bg-white border border-slate-200 text-base font-semibold text-slate-900 focus:outline-none focus:border-lime-500 shadow-2xs"
                  />
                  <div className="flex items-center gap-2 sm:contents">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity || ""}
                      onChange={(e) => handleFoodItemChange(idx, "quantity", e.target.value)}
                      className="flex-1 sm:w-20 min-h-[44px] px-2.5 rounded-xl bg-white border border-slate-200 text-base font-black text-slate-900 text-center shadow-2xs focus:outline-none focus:border-lime-500"
                    />
                    <input
                      type="text"
                      placeholder="unit"
                      value={item.unit}
                      onChange={(e) => handleFoodItemChange(idx, "unit", e.target.value)}
                      className="w-20 sm:w-16 min-h-[44px] px-2 text-center rounded-xl bg-white border border-slate-200 text-base font-bold text-slate-900 shadow-2xs focus:outline-none focus:border-lime-500"
                    />
                    {mealForm.foodItems.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Remove food item ${idx + 1}`}
                        onClick={() => handleRemoveFoodItem(idx)}
                        className="min-w-[44px] min-h-[44px] rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            isLoading={updatePlanMutation.isPending || createPlanMutation.isPending}
            className="w-full min-h-[48px] mt-3 bg-lime-500 hover:bg-lime-600 text-black font-extrabold text-base shadow-md cursor-pointer"
          >
            <Check className="w-4 h-4 mr-1.5 stroke-[3]" /> Save Meal
          </Button>
        </form>
      </Sheet>

      {/* Duplicate Day Drawer */}
      <Sheet
        open={showDuplicateModal}
        onOpenChange={setShowDuplicateModal}
        title="Duplicate Day Schedule"
        description="Copy meals from one day to another or to all 7 days"
      >
        <div className="space-y-4 pt-2 pb-2">
          <p className="text-xs text-slate-600 font-medium">
            Copy all meals planned for <strong>{dayNames[selectedDay]}</strong> to other days of the week.
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                duplicateDayMutation.mutate({
                  fromDay: selectedDay,
                  toAllDays: true,
                });
              }}
              disabled={duplicateDayMutation.isPending}
              className="w-full min-h-[52px] p-3.5 rounded-2xl bg-lime-50 border border-lime-300 hover:bg-lime-100 text-left transition-all flex items-center justify-between gap-2 cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-lime-900 block">
                  ⚡ Apply to ALL 7 Days of the Week
                </span>
                <span className="text-[11px] text-lime-700">
                  Best if you eat a similar schedule every day
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-lime-800 shrink-0" />
            </button>

            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Or Select Single Target Day
              </label>
              <select
                value={targetDuplicateDay}
                onChange={(e) => setTargetDuplicateDay(Number(e.target.value))}
                className="w-full min-h-[46px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-base focus:outline-none focus:border-lime-500"
              >
                {dayNames.map((dayName, i) => (
                  <option key={i} value={i} disabled={i === selectedDay}>
                    {dayName} {i === selectedDay ? "(Current)" : ""}
                  </option>
                ))}
              </select>

              <Button
                className="w-full min-h-[48px] mt-3 text-sm font-bold"
                isLoading={duplicateDayMutation.isPending}
                onClick={() =>
                  duplicateDayMutation.mutate({
                    fromDay: selectedDay,
                    toDay: targetDuplicateDay,
                    toAllDays: false,
                  })
                }
              >
                Duplicate to {dayNames[targetDuplicateDay]}
              </Button>
            </div>
          </div>
        </div>
      </Sheet>

      {/* Copy Diet in Best Format Drawer */}
      <Sheet
        open={showCopyFormatModal}
        onOpenChange={setShowCopyFormatModal}
        title="Copy Diet Plan"
        description="Choose a clean format to paste into WhatsApp, Notes, or Docs"
      >
        {(() => {
          const formattedText = formatDietPlanText({
            planName: activePlan?.name || "My Ongoing Meal Plan",
            mode: currentMode,
            scope: copyScope,
            style: copyStyle,
            simpleMeals: activePlan?.simpleMeals || [],
            alternating: altConfig,
            altSlot,
            isTodayDietA,
            days: activePlan?.days || [],
            selectedDay,
          });

          const handleCopyFormatted = async () => {
            try {
              await copyTextToClipboard(formattedText);
              setCopiedRecently(true);
              haptics.goal();
              toast.success("Formatted diet copied to clipboard! 📋");
              setTimeout(() => setCopiedRecently(false), 2500);
            } catch (_) {
              toast.error("Could not access clipboard automatically");
            }
          };

          return (
            <div className="space-y-4 pt-1 pb-3">
              {currentMode !== "simple" && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
                    What to Copy
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCopyScope("current")}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        copyScope === "current"
                          ? "bg-lime-50 border-lime-400 text-slate-900"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      {currentMode === "alternating"
                        ? `Only ${altSlot === "A" ? dietAName : dietBName}`
                        : `Only ${dayNames[selectedDay]}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCopyScope("all")}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        copyScope === "all"
                          ? "bg-lime-50 border-lime-400 text-slate-900"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      {currentMode === "alternating"
                        ? "Both Diets (A & B)"
                        : "Full Weekly Plan"}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Format Style
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "share", label: "WhatsApp / Notes" },
                    { id: "compact", label: "Compact" },
                    { id: "markdown", label: "Markdown" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setCopyStyle(s.id)}
                      className={`min-h-[44px] px-2 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        copyStyle === s.id
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Preview
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">
                    Sorted by meal time
                  </span>
                </div>
                <pre className="w-full max-h-64 overflow-y-auto p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed select-all">
                  {formattedText}
                </pre>
              </div>

              <Button
                type="button"
                onClick={handleCopyFormatted}
                className="w-full min-h-[48px] bg-lime-500 hover:bg-lime-600 text-black font-extrabold text-sm shadow-md"
              >
                {copiedRecently ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5 stroke-[3]" /> Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5" /> Copy Formatted Diet
                  </>
                )}
              </Button>
            </div>
          );
        })()}
      </Sheet>
    </div>
  );
};

export default DietPage;

import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dietApi } from "../api/endpoints";
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
  Sparkles,
  Layers,
  Repeat,
  CheckCircle2,
  Info,
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
  const [selectedDay, setSelectedDay] = useState(new Date().getDay()); // 0-6 (0=Sun, 1=Mon, ...)
  const [showMealModal, setShowMealModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
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

  // Mutation to create a fresh ongoing plan (repeats for months/years)
  const createPlanMutation = useMutation({
    mutationFn: (initialData) =>
      dietApi.createPlan({
        name: initialData?.name || "Ongoing Meal Plan",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "2035-12-31", // Continuous multi-year duration
        days: initialData?.days || [],
        isActive: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-diet-plans"] });
      queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] });
      haptics.goal();
      toast.success("Continuous meal plan created! 🥗");
      setShowMealModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create meal plan");
    },
  });

  // Mutation to update plan with new/modified meal
  const updatePlanMutation = useMutation({
    mutationFn: (updatedDays) => dietApi.updatePlan(activePlan._id, { days: updatedDays }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-diet-plans"] });
      queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] });
      haptics.goal();
      toast.success("Diet plan updated! Future days will use this schedule.");
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

  const currentDaySchedule = activePlan?.days?.find((d) => d.dayOfWeek === selectedDay);
  const mealsForDay = currentDaySchedule?.meals || [];

  // Calculate day totals
  const dayTotals = mealsForDay.reduce(
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

  const daysWithMeals = (activePlan?.days || [])
    .filter((d) => (d.meals || []).length > 0)
    .map((d) => d.dayOfWeek);

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
      createPlanMutation.mutate({
        name: "Ongoing Meal Plan",
        days: [{ dayOfWeek: selectedDay, meals: [mealPayload] }],
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

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto text-slate-900">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-black text-lime-700 uppercase tracking-widest bg-lime-100/70 px-2.5 py-0.5 rounded-full border border-lime-200">
            Ongoing Recurring Meal Plan
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5">
            {activePlan?.name || "My Ongoing Meal Plan"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Repeats continuously for all months ahead. Edit anytime to update future days.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Link
            to="/tracker"
            className={activePlan && mealsForDay.length > 0 ? "w-full sm:w-auto" : "col-span-2 sm:col-span-1 w-full sm:w-auto"}
          >
            <Button
              size="sm"
              className="w-full sm:w-auto min-h-[44px] text-xs font-bold bg-lime-500 hover:bg-lime-600 text-black"
            >
              Today's Checklist <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>

          {activePlan && mealsForDay.length > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setDuplicateToAll(false);
                setShowDuplicateModal(true);
              }}
              className="w-full sm:w-auto min-h-[44px] text-xs"
            >
              <Copy className="w-3.5 h-3.5 mr-1" /> Duplicate Day
            </Button>
          )}
        </div>
      </div>

      {/* Info Card Explaining Continuous / Ongoing Mode */}
      <GlassCard className="p-3.5 sm:p-4 bg-gradient-to-r from-lime-50/70 via-emerald-50/50 to-teal-50/70 border border-lime-200/80 rounded-2xl shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-lime-500 text-black flex items-center justify-center shrink-0 font-bold shadow-xs">
            <Repeat className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              One Plan · Auto-repeats for months · Change whenever you want
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              You don't need to rebuild diet plans every week. Set up your weekly meals once; they will automatically generate on your{" "}
              <Link to="/tracker" className="text-lime-800 font-bold underline">
                Daily Tracker
              </Link>{" "}
              for today, tomorrow, and every month ahead. Whenever you want to switch foods or change portion sizes, edit the meal here and your future days update instantly!
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Day Selector */}
      <GlassCard className="p-2 sm:p-3 bg-white/95">
        <DaySelector
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          activeDaysWithMeals={daysWithMeals}
        />
      </GlassCard>

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

      {/* Meals List for Selected Day */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
              {dayNames[selectedDay]} Schedule ({mealsForDay.length} Meals)
            </h3>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            {mealsForDay.length > 0 && (
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
                No meals planned for {dayNames[selectedDay]}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                Add your Breakfast, Lunch, Snacks, or Dinner below. Once added, it will repeat every {dayNames[selectedDay]} continuously!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-2.5 pt-1">
              <Button size="sm" onClick={handleOpenAddMeal} className="w-full sm:w-auto min-h-[44px]">
                <Plus className="w-4 h-4 mr-1" /> Add Meal to {dayNames[selectedDay]}
              </Button>

              {daysWithMeals.length > 0 && (
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
        title={editingMealIndex >= 0 ? "Edit Meal" : `Add Meal to ${dayNames[selectedDay]}`}
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
                <div className="flex flex-wrap gap-1.5">
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
                        className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
    </div>
  );
};

export default DietPage;

import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mealChartApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { getLocalDateString } from "../utils/date";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Sheet } from "../components/ui/Sheet";
import { Skeleton } from "../components/ui/Skeleton";
import { haptics } from "../motion/Haptics";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  UtensilsCrossed,
  Check,
  Plus,
  Clock,
  ChevronLeft,
  ChevronRight,
  Copy,
  Layers,
  BarChart3,
  Flame,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Edit2,
  CheckCheck,
  Ban,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

const QUICK_FOOD_LIBRARY = [
  { name: "Oats", quantity: 60, unit: "g", calories: 230, protein: 8, carbs: 40, fats: 4 },
  { name: "Whole Eggs (2)", quantity: 2, unit: "eggs", calories: 140, protein: 12, carbs: 1, fats: 10 },
  { name: "Egg Whites (150g)", quantity: 150, unit: "g", calories: 78, protein: 16.5, carbs: 1, fats: 0.3 },
  { name: "Chicken Breast", quantity: 150, unit: "g", calories: 247, protein: 46, carbs: 0, fats: 5 },
  { name: "Whey Protein (1 Scoop)", quantity: 33, unit: "g", calories: 120, protein: 24, carbs: 3, fats: 1.5 },
  { name: "White Rice (Cooked)", quantity: 150, unit: "g", calories: 195, protein: 4, carbs: 42, fats: 0.5 },
  { name: "Brown Rice (Cooked)", quantity: 150, unit: "g", calories: 165, protein: 3.5, carbs: 35, fats: 1.5 },
  { name: "Paneer (Cottage Cheese)", quantity: 100, unit: "g", calories: 265, protein: 18, carbs: 4, fats: 20 },
  { name: "Greek Yogurt", quantity: 150, unit: "g", calories: 130, protein: 15, carbs: 6, fats: 4 },
  { name: "Banana", quantity: 1, unit: "medium", calories: 105, protein: 1.3, carbs: 27, fats: 0.3 },
  { name: "Peanut Butter", quantity: 30, unit: "g", calories: 188, protein: 8, carbs: 6, fats: 16 },
  { name: "Almonds", quantity: 25, unit: "g", calories: 145, protein: 5, carbs: 5, fats: 12.5 },
  { name: "Sweet Potato", quantity: 150, unit: "g", calories: 130, protein: 2.3, carbs: 30, fats: 0.2 },
  { name: "Mixed Green Salad", quantity: 120, unit: "g", calories: 35, protein: 1.5, carbs: 6, fats: 0.4 },
];

const INITIAL_UNPLANNED_ITEM = {
  name: "",
  quantity: 100,
  unit: "g",
  calories: 150,
  protein: 10,
  carbs: 15,
  fats: 5,
};

const MACRO_CONFIG = [
  { key: "protein", label: "Protein", fallback: 140, textClass: "text-violet-700", barClass: "bg-violet-600" },
  { key: "carbs", label: "Carbs", fallback: 250, textClass: "text-amber-700", barClass: "bg-amber-500" },
  { key: "fats", label: "Fats", fallback: 60, textClass: "text-pink-700", barClass: "bg-pink-500" },
];

const DEFAULT_MEAL_TEMPLATES = {
  standard: [
    {
      mealName: "Breakfast",
      scheduledTime: "08:30",
      plannedFoodItems: [
        { name: "Oats", quantity: 60, unit: "g", calories: 230, protein: 8, carbs: 40, fats: 4 },
        { name: "Whole Eggs (2)", quantity: 2, unit: "eggs", calories: 140, protein: 12, carbs: 1, fats: 10 },
      ],
    },
    {
      mealName: "Lunch",
      scheduledTime: "13:30",
      plannedFoodItems: [
        { name: "Chicken Breast", quantity: 150, unit: "g", calories: 247, protein: 46, carbs: 0, fats: 5 },
        { name: "White Rice (Cooked)", quantity: 150, unit: "g", calories: 195, protein: 4, carbs: 42, fats: 0.5 },
      ],
    },
    {
      mealName: "Dinner",
      scheduledTime: "20:30",
      plannedFoodItems: [
        { name: "Paneer (Cottage Cheese)", quantity: 100, unit: "g", calories: 265, protein: 18, carbs: 4, fats: 20 },
        { name: "Mixed Green Salad", quantity: 120, unit: "g", calories: 35, protein: 1.5, carbs: 6, fats: 0.4 },
      ],
    },
  ],
  highProtein: [
    {
      mealName: "Breakfast",
      scheduledTime: "08:00",
      plannedFoodItems: [
        { name: "Oats", quantity: 70, unit: "g", calories: 270, protein: 9, carbs: 46, fats: 5 },
        { name: "Whey Protein (1 Scoop)", quantity: 33, unit: "g", calories: 120, protein: 24, carbs: 3, fats: 1.5 },
      ],
    },
    {
      mealName: "Lunch",
      scheduledTime: "13:00",
      plannedFoodItems: [
        { name: "Chicken Breast", quantity: 180, unit: "g", calories: 295, protein: 55, carbs: 0, fats: 6 },
        { name: "Brown Rice (Cooked)", quantity: 150, unit: "g", calories: 165, protein: 3.5, carbs: 35, fats: 1.5 },
      ],
    },
    {
      mealName: "Pre-Workout Snack",
      scheduledTime: "17:00",
      plannedFoodItems: [
        { name: "Banana", quantity: 1, unit: "medium", calories: 105, protein: 1.3, carbs: 27, fats: 0.3 },
        { name: "Peanut Butter", quantity: 20, unit: "g", calories: 125, protein: 5, carbs: 4, fats: 11 },
      ],
    },
    {
      mealName: "Dinner",
      scheduledTime: "21:00",
      plannedFoodItems: [
        { name: "Egg Whites (150g)", quantity: 150, unit: "g", calories: 78, protein: 16.5, carbs: 1, fats: 0.3 },
        { name: "Sweet Potato", quantity: 150, unit: "g", calories: 130, protein: 2.3, carbs: 30, fats: 0.2 },
      ],
    },
  ],
};

/** Add integer days cleanly on a YYYY-MM-DD calendar key without local DST drift. */
const shiftIsoDate = (isoDate, deltaDays) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
};

const formatDisplayDate = (isoDate) => {
  try {
    const [y, m, d] = isoDate.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch (_) {
    return isoDate;
  }
};

export const DailyTrackerPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const timezone = user?.timezone || "Asia/Kolkata";

  const todayStr = useMemo(() => getLocalDateString(new Date(), timezone), [timezone]);
  const [activeTab, setActiveTab] = useState("tracker");
  const [selectedDate, setSelectedDate] = useState(() =>
    getLocalDateString(new Date(), user?.timezone || "Asia/Kolkata")
  );

  const isToday = selectedDate === todayStr;
  const isFuture = selectedDate > todayStr;

  // Sheets & modals
  const [isChartEditorOpen, setIsChartEditorOpen] = useState(false);
  const [isUnplannedOpen, setIsUnplannedOpen] = useState(false);
  const [unplannedMealId, setUnplannedMealId] = useState("");
  const [unplannedItem, setUnplannedItem] = useState(INITIAL_UNPLANNED_ITEM);
  const [editItemModal, setEditItemModal] = useState(null);
  const [editActualQty, setEditActualQty] = useState("");
  const [skipMealModal, setSkipMealModal] = useState(null);
  const [skipReason, setSkipReason] = useState("");
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copySourceDate, setCopySourceDate] = useState("");
  const [copySourceTemplateId, setCopySourceTemplateId] = useState("");
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [insightsRange, setInsightsRange] = useState("7d");

  // Queries
  const {
    data: chartDataRes,
    isLoading: isChartLoading,
    isError: isChartError,
    refetch: refetchChart,
  } = useQuery({
    queryKey: ["meal-day-chart", selectedDate],
    queryFn: async () => {
      const res = await mealChartApi.getDayChart(selectedDate);
      return res.data?.data;
    },
  });

  const { data: summaryRes, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["meal-summary", insightsRange],
    queryFn: async () => {
      const res = await mealChartApi.getSummary(insightsRange);
      return res.data?.data;
    },
    enabled: activeTab === "insights",
  });

  const { data: templatesRes } = useQuery({
    queryKey: ["diet-templates"],
    queryFn: async () => {
      const res = await mealChartApi.getTemplates();
      return res.data?.data?.templates || [];
    },
  });

  const templates = templatesRes || [];
  const chartData = chartDataRes || {};
  const mealLog = chartData.mealLog;
  const meals = mealLog?.meals || [];
  const plannedTotals = chartData.plannedTotals || { calories: 0, protein: 0, carbs: 0, fats: 0 };
  const consumedTotals = chartData.consumedTotals || { calories: 0, protein: 0, carbs: 0, fats: 0 };
  const itemsCompleted = chartData.itemsCompleted || 0;
  const totalItems = chartData.totalItems || 0;
  const completionPercentage = chartData.completionPercentage || 0;

  useEffect(() => {
    if (totalItems > 0 && itemsCompleted === totalItems && isToday) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#C6FF3D", "#7C5CFF", "#2DE2E6", "#FF5C7A"],
        });
      } catch (_) {}
    }
  }, [itemsCompleted, totalItems, isToday]);

  // Mutations
  const invalidateMealQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["meal-day-chart", selectedDate] });
    queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] });
    queryClient.invalidateQueries({ queryKey: ["today-meal-log"] });
    queryClient.invalidateQueries({ queryKey: ["meal-summary"] });
    queryClient.invalidateQueries({ queryKey: ["group-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["group-leaderboard"] });
    queryClient.invalidateQueries({ queryKey: ["group-challenges"] });
  };

  const tickItemMutation = useMutation({
    mutationFn: async ({ mealId, itemId, eaten, actualQuantity }) =>
      await mealChartApi.updateItem({
        date: selectedDate,
        mealId,
        itemId,
        eaten,
        actualQuantity,
      }),
    onMutate: async ({ mealId, itemId, eaten }) => {
      await queryClient.cancelQueries({ queryKey: ["meal-day-chart", selectedDate] });
      const prevData = queryClient.getQueryData(["meal-day-chart", selectedDate]);

      if (prevData?.mealLog) {
        const updatedMeals = prevData.mealLog.meals.map((m) => {
          if (m.mealId === mealId || m._id === mealId) {
            const updatedItems = (m.plannedFoodItems || []).map((it) =>
              it.itemId === itemId || it._id === itemId
                ? { ...it, eaten, eatenAt: eaten ? new Date().toISOString() : null }
                : it
            );
            return { ...m, plannedFoodItems: updatedItems };
          }
          return m;
        });

        queryClient.setQueryData(["meal-day-chart", selectedDate], {
          ...prevData,
          mealLog: { ...prevData.mealLog, meals: updatedMeals },
        });
      }
      return { prevData };
    },
    onError: (_, __, context) => {
      if (context?.prevData) {
        queryClient.setQueryData(["meal-day-chart", selectedDate], context.prevData);
      }
      toast.error("Failed to update item tick");
    },
    onSuccess: (_, { eaten, mealId, itemId }) => {
      invalidateMealQueries();

      if (eaten) {
        haptics.eaten();
        toast.success("Eaten! Small win logged", {
          action: {
            label: "Undo",
            onClick: () => tickItemMutation.mutate({ mealId, itemId, eaten: false }),
          },
        });
      } else {
        haptics.tick();
      }
    },
  });

  const tickMealMutation = useMutation({
    mutationFn: async ({ mealId, status, skipReason: reason }) =>
      await mealChartApi.updateMeal({
        date: selectedDate,
        mealId,
        status,
        skipReason: reason,
      }),
    onSuccess: (_, { status }) => {
      invalidateMealQueries();
      setSkipMealModal(null);
      setSkipReason("");

      if (status === "eaten") {
        haptics.eaten();
        toast.success("Meal completed!");
      } else if (status === "skipped") {
        haptics.tick();
        toast("Meal marked as skipped");
      } else {
        toast("Meal reset to pending");
      }
    },
    onError: () => toast.error("Could not update meal status"),
  });

  const addUnplannedMutation = useMutation({
    mutationFn: async ({ mealId, item }) =>
      await mealChartApi.addUnplannedItem({ date: selectedDate, mealId, item }),
    onSuccess: () => {
      invalidateMealQueries();
      toast.success("Extra food item added and logged!");
      setIsUnplannedOpen(false);
      setUnplannedItem(INITIAL_UNPLANNED_ITEM);
    },
    onError: () => toast.error("Failed to log extra food item"),
  });

  const copyChartMutation = useMutation({
    mutationFn: async (payload) => await mealChartApi.copyChart(payload),
    onSuccess: () => {
      invalidateMealQueries();
      toast.success("Diet chart copied successfully!");
      setIsCopyModalOpen(false);
    },
    onError: () => toast.error("Could not copy diet chart"),
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (payload) => await mealChartApi.saveTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet-templates"] });
      toast.success("Saved as reusable template!");
      setIsSaveTemplateOpen(false);
      setTemplateName("");
    },
    onError: () => toast.error("Could not save template"),
  });

  const saveChartMutation = useMutation({
    mutationFn: async (payload) => await mealChartApi.saveDayChart(selectedDate, payload),
    onSuccess: () => {
      invalidateMealQueries();
      toast.success("Diet chart saved for this day!");
      setIsChartEditorOpen(false);
    },
    onError: () => toast.error("Could not save day chart"),
  });

  const weekStrip = useMemo(() => {
    const list = [];
    for (let i = -3; i <= 3; i++) {
      const str = shiftIsoDate(selectedDate, i);
      const [y, m, d] = str.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      list.push({
        date: str,
        dayName: dt.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
        dayNum: d,
        isToday: str === todayStr,
      });
    }
    return list;
  }, [selectedDate, todayStr]);

  const handleStepDay = (delta) => {
    haptics.tick();
    setSelectedDate(shiftIsoDate(selectedDate, delta));
  };

  const openEditQuantitySheet = (mealId, item) => {
    haptics.tick();
    setEditItemModal({ mealId, item });
    setEditActualQty(
      item.actualQuantity !== undefined && item.actualQuantity !== null
        ? item.actualQuantity
        : item.quantity
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
      {/* Header & Mobile-First Segmented Tab Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-lime-100 border border-lime-300/80 flex items-center justify-center text-lime-700 shrink-0 shadow-xs">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              Daily Diet Tracker
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Tap items as you eat · Plan vs Actual nutrition
            </p>
          </div>
        </div>

        {/* Full-Width 2-Tab Switcher on Mobile */}
        <div className="grid grid-cols-2 sm:inline-flex bg-white border border-slate-200/90 rounded-2xl p-1 shadow-xs w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setActiveTab("tracker");
            }}
            className={`min-h-[42px] px-3.5 text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "tracker"
                ? "bg-lime-500 text-slate-950 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900 font-semibold"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Daily Tracker</span>
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setActiveTab("insights");
            }}
            className={`min-h-[42px] px-3.5 text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "insights"
                ? "bg-violet-600 text-white shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900 font-semibold"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>Diet Insights</span>
          </button>
        </div>
      </div>

      {activeTab === "tracker" ? (
        <>
          {/* Mobile-First Date Navigator & 7-Day Quick Strip */}
          <GlassCard className="p-3.5 sm:p-4 bg-white/95 border-slate-200/90 rounded-3xl shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                aria-label="Previous day"
                onClick={() => handleStepDay(-1)}
                className="min-h-[44px] min-w-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="min-w-0 flex flex-col items-center text-center gap-0.5">
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <Calendar className="w-4 h-4 text-lime-600 shrink-0" />
                  <span className="text-sm sm:text-base font-black text-slate-900">
                    {formatDisplayDate(selectedDate)}
                  </span>
                  {isToday && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-lime-100 text-lime-800 border border-lime-300">
                      TODAY
                    </span>
                  )}
                  {isFuture && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
                      FUTURE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                    {selectedDate}
                  </span>
                  {!isToday && (
                    <button
                      type="button"
                      onClick={() => {
                        haptics.tick();
                        setSelectedDate(todayStr);
                      }}
                      className="text-[11px] font-extrabold text-lime-700 hover:text-lime-800 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-lime-50 border border-lime-200 cursor-pointer"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      Today
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={copyChartMutation.isPending}
                    onClick={() => {
                      haptics.tick();
                      const yesterday = shiftIsoDate(selectedDate, -1);
                      copyChartMutation.mutate({
                        sourceDate: yesterday,
                        targetDates: [selectedDate],
                      });
                    }}
                    className="text-[11px] font-extrabold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 cursor-pointer"
                  >
                    <Copy className="w-2.5 h-2.5 text-lime-600" />
                    Same as yesterday
                  </button>
                </div>
              </div>

              <button
                type="button"
                aria-label="Next day"
                onClick={() => handleStepDay(1)}
                className="min-h-[44px] min-w-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {weekStrip.map((item) => {
                const isSelected = item.date === selectedDate;
                return (
                  <button
                    key={item.date}
                    type="button"
                    onClick={() => {
                      haptics.tick();
                      setSelectedDate(item.date);
                    }}
                    className={`min-h-[54px] py-1.5 px-0.5 rounded-2xl text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isSelected
                        ? "bg-lime-500 text-slate-950 shadow-sm font-black"
                        : item.isToday
                        ? "bg-lime-50 text-lime-900 border border-lime-300 font-bold"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 font-semibold"
                    }`}
                  >
                    <span className="text-[10px] uppercase leading-tight">{item.dayName}</span>
                    <span className="text-sm font-black tabular-nums leading-tight mt-0.5">
                      {item.dayNum}
                    </span>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Nutrition Totals & Completion Summary (Non-sticky on small mobile so meal rows aren't covered) */}
          <GlassCard className="p-4 sm:p-5 bg-white/95 border-slate-200/90 rounded-3xl shadow-xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Calories Consumed
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                    {consumedTotals.calories}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 tabular-nums">
                    / {plannedTotals.calories || 2200} kcal planned
                  </span>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lime-50 border border-lime-200 text-lime-800 text-xs font-extrabold shrink-0 tabular-nums">
                <CheckCheck className="w-3.5 h-3.5 text-lime-600 shrink-0" />
                <span>
                  {itemsCompleted}/{totalItems} eaten · {completionPercentage}%
                </span>
              </div>
            </div>

            {/* Stacked Mobile-Safe 3-Column Macro Cards */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
              {MACRO_CONFIG.map((macro) => {
                const consumed = Math.round(consumedTotals[macro.key] || 0);
                const plannedRaw = plannedTotals[macro.key] || 0;
                const target = Math.round(plannedRaw || macro.fallback);
                const pct =
                  plannedRaw > 0 ? Math.min(100, (consumedTotals[macro.key] / plannedRaw) * 100) : 0;

                return (
                  <div
                    key={macro.key}
                    className="p-2.5 rounded-2xl bg-slate-50/90 border border-slate-100 space-y-1.5 min-w-0"
                  >
                    <div className="text-[11px] font-extrabold leading-none">
                      <span className={macro.textClass}>{macro.label}</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-700 tabular-nums truncate">
                      {consumed}
                      <span className="text-slate-400 font-semibold">/{target}g</span>
                    </div>
                    <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`${macro.barClass} h-full rounded-full transition-all duration-300`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Quick Action Controls: Full-Width Primary + Clean Secondary Row on Mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <Button
              onClick={() => setIsChartEditorOpen(true)}
              size="sm"
              className="w-full sm:w-auto sm:order-2 min-h-[44px] text-xs font-extrabold rounded-2xl"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{meals.length > 0 ? "Edit Today's Chart" : "Create Today's Chart"}</span>
            </Button>

            <div
              className={`grid gap-2 w-full sm:w-auto sm:flex sm:order-1 ${
                meals.length > 0 ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCopyModalOpen(true)}
                className="min-h-[44px] w-full sm:w-auto text-xs font-bold rounded-2xl"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy From...</span>
              </Button>

              {meals.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsSaveTemplateOpen(true)}
                  className="min-h-[44px] w-full sm:w-auto text-xs font-bold rounded-2xl"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>Save Template</span>
                </Button>
              )}
            </div>
          </div>

          {/* Meals List / Skeleton / Error / Empty State */}
          {isChartLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-44 w-full rounded-3xl" />
              <Skeleton className="h-44 w-full rounded-3xl" />
            </div>
          ) : isChartError ? (
            <GlassCard className="p-6 text-center bg-white border border-rose-200 rounded-3xl space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-sm font-bold text-slate-900">Could not load this day's chart</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchChart()}
                className="min-h-[44px] mx-auto"
              >
                Retry
              </Button>
            </GlassCard>
          ) : meals.length === 0 ? (
            <GlassCard className="p-6 sm:p-8 text-center bg-white/95 border-slate-200/90 rounded-3xl shadow-xs space-y-4">
              <UtensilsCrossed className="w-11 h-11 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">No Meals Planned for this Date</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Start quickly from a preset chart, copy another day, or customize your weekly plan.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:flex sm:flex-wrap justify-center gap-2 pt-1">
                <Button
                  onClick={() => setIsChartEditorOpen(true)}
                  className="w-full sm:w-auto min-h-[44px] text-xs font-extrabold rounded-2xl"
                >
                  Create Today's Chart
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsCopyModalOpen(true)}
                  className="w-full sm:w-auto min-h-[44px] text-xs font-bold rounded-2xl"
                >
                  Copy Past Diet / Template
                </Button>
              </div>

              <div className="pt-1">
                <Link
                  to="/diet"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 min-h-[36px]"
                >
                  Open Weekly Meal Planner <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {chartData?.planVariant?.variantLabel &&
                chartData?.planVariant?.mode !== "weekly" && (
                  <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-lime-50/80 border border-lime-200/90 text-xs">
                    <span className="font-bold text-slate-700">
                      Active Plan:{" "}
                      <span className="text-lime-800 font-black">
                        {chartData.planVariant.variantLabel}
                      </span>
                    </span>
                    <Link
                      to="/diet"
                      className="text-[11px] font-bold text-violet-700 hover:underline shrink-0"
                    >
                      Edit Rotation
                    </Link>
                  </div>
                )}
              {meals.map((meal) => {
                const mealId = meal.mealId || meal._id;
                const items = meal.plannedFoodItems || [];
                const eatenCount = items.filter((it) => it.eaten).length;
                const isAllEaten = items.length > 0 && eatenCount === items.length;
                const isPartial = eatenCount > 0 && !isAllEaten;
                const isSkipped = meal.status === "skipped";
                const totalMealKcal = Math.round(
                  items.reduce((s, it) => s + (it.calories || 0), 0)
                );

                return (
                  <GlassCard
                    key={mealId}
                    className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                      isAllEaten
                        ? "bg-lime-50/60 border-lime-300 shadow-xs"
                        : isSkipped
                        ? "bg-slate-50/90 border-slate-200 opacity-75"
                        : isPartial
                        ? "bg-white border-violet-300 shadow-xs"
                        : "bg-white/95 border-slate-200/90 shadow-xs"
                    }`}
                  >
                    {/* Meal Card Header (Stacks cleanly below 640px) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-slate-900 leading-tight">
                            {meal.mealName}
                          </h3>
                          <span className="text-[11px] font-semibold text-slate-500 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {meal.scheduledTime || "08:00"}
                          </span>

                          {isAllEaten && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-lime-500 text-slate-950">
                              ALL EATEN ✓
                            </span>
                          )}
                          {isSkipped && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              SKIPPED
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-medium text-slate-500 tabular-nums">
                          {eatenCount}/{items.length} items logged · {totalMealKcal} kcal
                        </div>
                      </div>

                      {/* Touch-Sized Meal Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {!isSkipped && !isAllEaten && (
                          <button
                            type="button"
                            disabled={isFuture || tickMealMutation.isPending}
                            onClick={() =>
                              tickMealMutation.mutate({ mealId, status: "eaten" })
                            }
                            className="min-h-[40px] px-3.5 text-xs font-extrabold rounded-xl bg-lime-100 hover:bg-lime-200 text-lime-900 border border-lime-300/70 transition-colors disabled:opacity-40 cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Tick All
                          </button>
                        )}

                        {!isSkipped && (
                          <button
                            type="button"
                            onClick={() => {
                              haptics.tick();
                              setSkipMealModal({ mealId, mealName: meal.mealName });
                            }}
                            className="min-h-[40px] px-3 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Ban className="w-3.5 h-3.5 text-slate-500" />
                            Skip
                          </button>
                        )}

                        {isSkipped && (
                          <button
                            type="button"
                            disabled={tickMealMutation.isPending}
                            onClick={() =>
                              tickMealMutation.mutate({ mealId, status: "pending" })
                            }
                            className="min-h-[40px] px-3.5 text-xs font-extrabold rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 cursor-pointer"
                          >
                            Undo Skip
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Food Items Checkable Rows (>= 44px touch hits) */}
                    <div className="divide-y divide-slate-100 pt-1">
                      {items.map((item) => {
                        const itemId = item.itemId || item._id;
                        const isChecked = Boolean(item.eaten);
                        const qtyChanged =
                          item.actualQuantity !== undefined &&
                          item.actualQuantity !== null &&
                          item.actualQuantity !== item.quantity;

                        return (
                          <div
                            key={itemId}
                            className="py-2 flex items-center justify-between gap-2"
                          >
                            {/* 44x44px Thumb Hit Target for Checkmark */}
                            <button
                              type="button"
                              aria-label={`Mark ${item.name} as ${isChecked ? "not eaten" : "eaten"}`}
                              disabled={isFuture || isSkipped}
                              onClick={() =>
                                tickItemMutation.mutate({
                                  mealId,
                                  itemId,
                                  eaten: !isChecked,
                                })
                              }
                              className="w-11 h-11 -ml-1.5 flex items-center justify-center shrink-0 rounded-2xl hover:bg-slate-100/70 transition-colors disabled:opacity-40 cursor-pointer"
                            >
                              <span
                                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                                  isChecked
                                    ? "bg-lime-500 text-slate-950 shadow-xs ring-2 ring-lime-500/20"
                                    : "bg-slate-100 border-2 border-slate-300 text-transparent"
                                }`}
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                              </span>
                            </button>

                            {/* Food Info (tappable to edit actual portion) */}
                            <button
                              type="button"
                              onClick={() => openEditQuantitySheet(mealId, item)}
                              className="flex-1 min-w-0 text-left py-1.5 cursor-pointer"
                            >
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-sm leading-snug ${
                                    isChecked
                                      ? "text-slate-900 font-extrabold"
                                      : "text-slate-800 font-bold"
                                  }`}
                                >
                                  {item.name}
                                </span>
                                {item.isUnplanned && (
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                    EXTRA
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                                {qtyChanged ? (
                                  <span className="text-slate-700 font-semibold">
                                    Ate {item.actualQuantity} {item.unit}{" "}
                                    <span className="text-slate-400 font-normal">
                                      (planned {item.quantity} {item.unit})
                                    </span>
                                  </span>
                                ) : (
                                  <span>
                                    {item.quantity} {item.unit}
                                  </span>
                                )}
                                <span className="mx-1.5 text-slate-300">·</span>
                                <span>{Math.round(item.calories || 0)} kcal</span>
                                <span className="mx-1.5 text-slate-300">·</span>
                                <span className="text-violet-700 font-bold">
                                  {item.protein}g P
                                </span>
                              </div>
                            </button>

                            {/* Timestamp + Always-Visible 44px Edit Button */}
                            <div className="shrink-0 flex items-center gap-1">
                              {isChecked && item.eatenAt && (
                                <span className="hidden sm:inline text-[11px] text-slate-400 font-mono tabular-nums">
                                  {new Date(item.eatenAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                              <button
                                type="button"
                                aria-label={`Edit portion for ${item.name}`}
                                onClick={() => openEditQuantitySheet(mealId, item)}
                                className="min-h-[44px] min-w-[44px] rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Extra Food Trigger (Full Mobile Tap Row) */}
                    <div className="pt-2.5 mt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          haptics.tick();
                          setUnplannedMealId(mealId);
                          setIsUnplannedOpen(true);
                        }}
                        className="w-full min-h-[44px] px-3 rounded-2xl bg-violet-50/70 hover:bg-violet-100/70 border border-dashed border-violet-200 text-xs font-extrabold text-violet-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Extra Food Eaten</span>
                      </button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Diet Insights View */
        <div className="space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Diet Analytics &amp; Averages
              </h2>
              <p className="text-xs text-slate-500">
                Track consistency, weekly averages, and adherence streaks
              </p>
            </div>

            <div className="grid grid-cols-3 sm:inline-flex bg-white border border-slate-200/90 rounded-2xl p-1 shadow-xs w-full sm:w-auto">
              {["7d", "30d", "90d"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    haptics.tick();
                    setInsightsRange(r);
                  }}
                  className={`min-h-[40px] px-3.5 text-xs font-extrabold rounded-xl uppercase transition-all cursor-pointer ${
                    insightsRange === r
                      ? "bg-violet-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {isSummaryLoading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Skeleton className="h-24 rounded-3xl" />
                <Skeleton className="h-24 rounded-3xl" />
                <Skeleton className="h-24 rounded-3xl" />
                <Skeleton className="h-24 rounded-3xl" />
              </div>
              <Skeleton className="h-64 w-full rounded-3xl" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <GlassCard className="p-3.5 sm:p-4 bg-white/95 border-slate-200/90 rounded-3xl shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">Avg Calories</span>
                  <div className="text-2xl font-black text-slate-900 tabular-nums">
                    {summaryRes?.summary?.averageCalories || 0}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium tabular-nums">
                    Target: {summaryRes?.profileTargets?.calories || 2200} kcal
                  </div>
                </GlassCard>

                <GlassCard className="p-3.5 sm:p-4 bg-white/95 border-slate-200/90 rounded-3xl shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">Avg Protein</span>
                  <div className="text-2xl font-black text-violet-600 tabular-nums">
                    {summaryRes?.summary?.averageProtein || 0}g
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium tabular-nums">
                    Target: {summaryRes?.profileTargets?.protein || 140}g
                  </div>
                </GlassCard>

                <GlassCard className="p-3.5 sm:p-4 bg-white/95 border-slate-200/90 rounded-3xl shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">Adherence Streak</span>
                  <div className="text-2xl font-black text-lime-600 flex items-center gap-1 tabular-nums">
                    <Flame className="w-5 h-5 text-amber-500 shrink-0" />
                    <span>{summaryRes?.summary?.currentStreak || 0}d</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium tabular-nums">
                    Best: {summaryRes?.summary?.bestStreak || 0}d (≥80%)
                  </div>
                </GlassCard>

                <GlassCard className="p-3.5 sm:p-4 bg-white/95 border-slate-200/90 rounded-3xl shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">Avg Completion</span>
                  <div className="text-2xl font-black text-slate-900 tabular-nums">
                    {summaryRes?.summary?.averageCompletion || 0}%
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium tabular-nums">
                    {summaryRes?.summary?.totalLoggedDays || 0} days logged
                  </div>
                </GlassCard>
              </div>

              <GlassCard className="p-4 sm:p-5 bg-white/95 border-slate-200/90 rounded-3xl shadow-xs space-y-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Calories: Consumed vs Target</h3>
                  <p className="text-xs text-slate-500">
                    Unlogged days appear blank (never plotted as zero)
                  </p>
                </div>

                <div className="h-60 w-full pt-1">
                  {summaryRes?.dailyDetails && summaryRes.dailyDetails.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={summaryRes.dailyDetails.map((d) => ({
                          date: d.date.slice(5),
                          consumed: d.logged ? d.consumedTotals?.calories : null,
                          target: summaryRes.profileTargets?.calories || 2200,
                          logged: d.logged,
                        }))}
                        margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "#64748B" }}
                          tickLine={false}
                          minTickGap={18}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#64748B" }}
                          tickLine={false}
                          domain={[0, "auto"]}
                          width={46}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const row = payload[0].payload;
                              return (
                                <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-md text-xs space-y-1">
                                  <div className="font-bold text-slate-900">{label}</div>
                                  {row.logged ? (
                                    <div className="text-lime-700 font-bold">
                                      Consumed: {row.consumed} kcal
                                    </div>
                                  ) : (
                                    <div className="text-slate-400 italic">Not logged</div>
                                  )}
                                  <div className="text-slate-500">Target: {row.target} kcal</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine
                          y={summaryRes.profileTargets?.calories || 2200}
                          stroke="#94A3B8"
                          strokeDasharray="4 4"
                        />
                        <Bar dataKey="consumed" fill="#84CC16" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No diet logs in this period
                    </div>
                  )}
                </div>
              </GlassCard>

              <GlassCard className="p-4 sm:p-5 bg-white/95 border-slate-200/90 rounded-3xl shadow-xs space-y-3">
                <h3 className="text-sm font-black text-slate-900">Daily Adherence Breakdown</h3>

                <div className="divide-y divide-slate-100">
                  {(summaryRes?.dailyDetails || []).map((day) => (
                    <div
                      key={day.date}
                      className="py-3 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-extrabold text-slate-900 tabular-nums">{day.date}</div>
                        {day.logged ? (
                          <div className="text-[11px] text-slate-500 tabular-nums">
                            {day.consumedTotals?.calories} kcal · {day.consumedTotals?.protein}g P ·{" "}
                            {day.itemsCompleted} eaten
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Not logged</span>
                        )}
                      </div>

                      <div className="shrink-0">
                        {day.logged ? (
                          <span
                            className={`font-bold px-2.5 py-1 rounded-full text-[11px] tabular-nums ${
                              day.completionPercentage >= 80
                                ? "bg-lime-100 text-lime-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {day.completionPercentage}% Done
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">--</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </>
          )}
        </div>
      )}

      {/* Edit Actual Quantity Sheet */}
      <Sheet
        open={Boolean(editItemModal)}
        onOpenChange={(openState) => {
          if (!openState) setEditItemModal(null);
        }}
        title="Edit Actual Quantity"
        description="Log the exact portion you ate to scale calories and macros."
      >
        <div className="space-y-4 pb-2">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-sm font-extrabold text-slate-900">
              {editItemModal?.item?.name}
            </span>
            <div className="text-xs text-slate-500">
              Planned: {editItemModal?.item?.quantity} {editItemModal?.item?.unit} (
              {editItemModal?.item?.calories} kcal)
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Actual Portion Eaten
            </label>
            <div className="flex items-center gap-2.5">
              <input
                type="number"
                inputMode="decimal"
                value={editActualQty}
                onChange={(e) => setEditActualQty(e.target.value)}
                className="w-full min-h-[48px] text-base font-bold bg-slate-50 border border-slate-300 rounded-2xl px-3.5 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              />
              <span className="text-sm font-bold text-slate-600 shrink-0 px-2">
                {editItemModal?.item?.unit}
              </span>
            </div>
          </div>

          <Button
            isLoading={tickItemMutation.isPending}
            onClick={() => {
              tickItemMutation.mutate({
                mealId: editItemModal.mealId,
                itemId: editItemModal.item.itemId || editItemModal.item._id,
                eaten: true,
                actualQuantity: Number(editActualQty),
              });
              setEditItemModal(null);
            }}
            className="w-full min-h-[48px] text-sm font-extrabold"
          >
            Save Actual Portion &amp; Mark Eaten
          </Button>
        </div>
      </Sheet>

      {/* Skip Meal Sheet */}
      <Sheet
        open={Boolean(skipMealModal)}
        onOpenChange={(openState) => {
          if (!openState) setSkipMealModal(null);
        }}
        title={`Skip ${skipMealModal?.mealName || "Meal"}`}
        description="Marking a meal as skipped keeps your tracking honest."
      >
        <div className="space-y-4 pb-2">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Reason (Optional)
            </label>
            <input
              type="text"
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder="e.g. Busy with meetings / Fasting"
              className="w-full min-h-[46px] text-base bg-slate-50 border border-slate-300 rounded-2xl px-3.5 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Button
              variant="secondary"
              onClick={() => setSkipMealModal(null)}
              className="w-full min-h-[48px] text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={tickMealMutation.isPending}
              onClick={() =>
                tickMealMutation.mutate({
                  mealId: skipMealModal.mealId,
                  status: "skipped",
                  skipReason,
                })
              }
              className="w-full min-h-[48px] text-xs font-extrabold"
            >
              Confirm Skip
            </Button>
          </div>
        </div>
      </Sheet>

      {/* Add Extra Food Sheet */}
      <Sheet
        open={isUnplannedOpen}
        onOpenChange={setIsUnplannedOpen}
        title="Add Extra Food Eaten"
        description="Tap an instant preset or enter your own food details."
      >
        <div className="space-y-4 pb-2">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Quick Suggestions (Swipe)
            </label>
            <div className="flex overflow-x-auto gap-2 pb-1.5 -mx-1 px-1">
              {QUICK_FOOD_LIBRARY.map((f, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    haptics.tick();
                    setUnplannedItem({ ...f });
                  }}
                  className="shrink-0 min-h-[40px] px-3 py-1.5 rounded-2xl bg-slate-100 hover:bg-lime-100 border border-slate-200/80 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  {f.name} · {f.calories} cal
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Food Name</label>
              <input
                type="text"
                value={unplannedItem.name}
                onChange={(e) => setUnplannedItem({ ...unplannedItem, name: e.target.value })}
                placeholder="e.g. Protein Bar / Almonds"
                className="w-full min-h-[46px] text-base bg-slate-50 border border-slate-300 rounded-2xl px-3.5 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Quantity</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={unplannedItem.quantity}
                  onChange={(e) =>
                    setUnplannedItem({ ...unplannedItem, quantity: Number(e.target.value) })
                  }
                  className="w-full min-h-[46px] text-base bg-slate-50 border border-slate-300 rounded-2xl px-3.5 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Unit</label>
                <input
                  type="text"
                  value={unplannedItem.unit}
                  onChange={(e) => setUnplannedItem({ ...unplannedItem, unit: e.target.value })}
                  className="w-full min-h-[46px] text-base bg-slate-50 border border-slate-300 rounded-2xl px-3.5 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { key: "calories", label: "Calories", color: "text-slate-600" },
                { key: "protein", label: "Protein (g)", color: "text-violet-700" },
                { key: "carbs", label: "Carbs (g)", color: "text-amber-700" },
                { key: "fats", label: "Fats (g)", color: "text-pink-700" },
              ].map((field) => (
                <div key={field.key}>
                  <label className={`text-[11px] font-bold block mb-1 ${field.color}`}>
                    {field.label}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={unplannedItem[field.key]}
                    onChange={(e) =>
                      setUnplannedItem({ ...unplannedItem, [field.key]: Number(e.target.value) })
                    }
                    className="w-full min-h-[46px] text-base bg-slate-50 border border-slate-300 rounded-2xl px-3 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="violet"
            isLoading={addUnplannedMutation.isPending}
            onClick={() =>
              addUnplannedMutation.mutate({
                mealId: unplannedMealId,
                item: unplannedItem,
              })
            }
            disabled={!unplannedItem.name.trim()}
            className="w-full min-h-[48px] text-sm font-extrabold"
          >
            Add &amp; Log Extra Food
          </Button>
        </div>
      </Sheet>

      {/* Copy Chart Sheet */}
      <Sheet
        open={isCopyModalOpen}
        onOpenChange={setIsCopyModalOpen}
        title="Copy Diet Chart"
        description={`Copy a past day or saved template into ${selectedDate}.`}
      >
        <div className="space-y-4 pb-2">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Option 1: From a Past Date
            </label>
            <input
              type="date"
              value={copySourceDate}
              onChange={(e) => {
                setCopySourceDate(e.target.value);
                setCopySourceTemplateId("");
              }}
              className="w-full min-h-[46px] text-base bg-slate-50 border border-slate-300 rounded-2xl px-3.5 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
            />
          </div>

          <div className="text-center text-xs font-extrabold text-slate-400">OR</div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Option 2: From a Saved Template
            </label>
            <select
              value={copySourceTemplateId}
              onChange={(e) => {
                setCopySourceTemplateId(e.target.value);
                setCopySourceDate("");
              }}
              className="w-full min-h-[46px] text-base bg-slate-50 border border-slate-300 rounded-2xl px-3.5 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
            >
              <option value="">Select a template...</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.meals?.length || 0} meals)
                </option>
              ))}
            </select>
          </div>

          <Button
            isLoading={copyChartMutation.isPending}
            onClick={() =>
              copyChartMutation.mutate({
                sourceDate: copySourceDate || undefined,
                sourceTemplateId: copySourceTemplateId || undefined,
                targetDates: [selectedDate],
              })
            }
            disabled={!copySourceDate && !copySourceTemplateId}
            className="w-full min-h-[48px] text-sm font-extrabold"
          >
            Apply to {selectedDate}
          </Button>
        </div>
      </Sheet>

      {/* Save Template Sheet */}
      <Sheet
        open={isSaveTemplateOpen}
        onOpenChange={setIsSaveTemplateOpen}
        title="Save Day as Template"
        description="Reuse today's meal plan anytime (e.g. Training Day, Rest Day)."
      >
        <div className="space-y-4 pb-2">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Template Name</label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. High Carb Training Day"
              className="w-full min-h-[46px] text-base bg-slate-50 border border-slate-300 rounded-2xl px-3.5 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white"
            />
          </div>

          <Button
            variant="violet"
            isLoading={saveTemplateMutation.isPending}
            onClick={() =>
              saveTemplateMutation.mutate({
                name: templateName,
                meals: meals.map((m) => ({
                  mealId: m.mealId,
                  mealName: m.mealName,
                  scheduledTime: m.scheduledTime,
                  plannedFoodItems: (m.plannedFoodItems || []).map((it) => ({
                    name: it.name,
                    quantity: it.quantity,
                    unit: it.unit,
                    calories: it.calories,
                    protein: it.protein,
                    carbs: it.carbs,
                    fats: it.fats,
                  })),
                })),
              })
            }
            disabled={!templateName.trim()}
            className="w-full min-h-[48px] text-sm font-extrabold"
          >
            Save Template
          </Button>
        </div>
      </Sheet>

      {/* Quick Chart Preset Sheet */}
      <Sheet
        open={isChartEditorOpen}
        onOpenChange={setIsChartEditorOpen}
        title={`Diet Chart · ${selectedDate}`}
        description="Load a balanced starter chart for this day (ticked items stay preserved)."
      >
        <div className="space-y-4 pb-2">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Starter Meal Presets</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                isLoading={saveChartMutation.isPending}
                onClick={() => saveChartMutation.mutate({ meals: DEFAULT_MEAL_TEMPLATES.standard })}
                className="w-full min-h-[48px] text-xs font-bold"
              >
                Standard 3-Meal Day
              </Button>

              <Button
                variant="outline"
                isLoading={saveChartMutation.isPending}
                onClick={() =>
                  saveChartMutation.mutate({ meals: DEFAULT_MEAL_TEMPLATES.highProtein })
                }
                className="w-full min-h-[48px] text-xs font-bold"
              >
                High Protein 4-Meal Plan
              </Button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">
              Want custom foods &amp; recurring weekday plans?
            </span>
            <Link
              to="/diet"
              onClick={() => setIsChartEditorOpen(false)}
              className="shrink-0 min-h-[40px] px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-extrabold text-slate-800 inline-flex items-center gap-1"
            >
              Diet Planner <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </Sheet>
    </div>
  );
};

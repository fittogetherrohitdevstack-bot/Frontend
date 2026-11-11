import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mealChartApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Sheet } from "../components/ui/Sheet";
import { Skeleton } from "../components/ui/Skeleton";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../motion/Haptics";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  UtensilsCrossed,
  Check,
  Plus,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Copy,
  Layers,
  BarChart3,
  Flame,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Edit2,
  Trash2,
  CheckCheck,
  Ban,
  ArrowRight,
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

// Common fitness foods for instant autocomplete
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

export const DailyTrackerPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Active view: "tracker" or "insights"
  const [activeTab, setActiveTab] = useState("tracker");

  // Selected date (defaults to today)
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const isToday = selectedDate === todayStr;
  const isFuture = selectedDate > todayStr;

  // Modals & Sheets
  const [isChartEditorOpen, setIsChartEditorOpen] = useState(false);
  const [isUnplannedOpen, setIsUnplannedOpen] = useState(false);
  const [unplannedMealId, setUnplannedMealId] = useState("");
  const [unplannedItem, setUnplannedItem] = useState({
    name: "",
    quantity: 100,
    unit: "g",
    calories: 150,
    protein: 10,
    carbs: 15,
    fats: 5,
  });

  // Edit Actual Quantity Bottom Sheet
  const [editItemModal, setEditItemModal] = useState(null); // { mealId, item }
  const [editActualQty, setEditActualQty] = useState("");

  // Skip Meal Sheet
  const [skipMealModal, setSkipMealModal] = useState(null); // { mealId, mealName }
  const [skipReason, setSkipReason] = useState("");

  // Copy Chart Sheet
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copySourceDate, setCopySourceDate] = useState("");
  const [copySourceTemplateId, setCopySourceTemplateId] = useState("");

  // Save as Template Sheet
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");

  // Insights range
  const [insightsRange, setInsightsRange] = useState("7d");

  // Queries
  const { data: chartDataRes, isLoading: isChartLoading } = useQuery({
    queryKey: ["meal-day-chart", selectedDate],
    queryFn: async () => {
      const res = await mealChartApi.getDayChart(selectedDate);
      return res.data?.data;
    },
  });

  const { data: summaryRes } = useQuery({
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

  // Trigger celebration confetti when 100% completed
  useEffect(() => {
    if (totalItems > 0 && itemsCompleted === totalItems && isToday) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#C6FF3D", "#7C5CFF", "#2DE2E6", "#FF5C7A"],
        });
      } catch (err) {}
    }
  }, [itemsCompleted, totalItems, isToday]);

  // Mutations
  const tickItemMutation = useMutation({
    mutationFn: async ({ mealId, itemId, eaten, actualQuantity }) => {
      return await mealChartApi.updateItem({
        date: selectedDate,
        mealId,
        itemId,
        eaten,
        actualQuantity,
      });
    },
    onMutate: async ({ mealId, itemId, eaten }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["meal-day-chart", selectedDate] });
      const prevData = queryClient.getQueryData(["meal-day-chart", selectedDate]);

      if (prevData?.mealLog) {
        const updatedMeals = prevData.mealLog.meals.map((m) => {
          if (m.mealId === mealId || m._id === mealId) {
            const updatedItems = (m.plannedFoodItems || []).map((it) => {
              if (it.itemId === itemId || it._id === itemId) {
                return { ...it, eaten, eatenAt: eaten ? new Date().toISOString() : null };
              }
              return it;
            });
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
    onError: (err, variables, context) => {
      if (context?.prevData) {
        queryClient.setQueryData(["meal-day-chart", selectedDate], context.prevData);
      }
      toast.error("Failed to update item tick");
    },
    onSuccess: (res, { eaten, mealId, itemId }) => {
      queryClient.invalidateQueries({ queryKey: ["meal-day-chart", selectedDate] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["meal-summary"] });

      if (eaten) {
        haptics.eaten();
        toast.success("Eaten! Small win logged ✓", {
          action: {
            label: "Undo",
            onClick: () => {
              tickItemMutation.mutate({ mealId, itemId, eaten: false });
            },
          },
        });
      } else {
        haptics.tick();
      }
    },
  });

  const tickMealMutation = useMutation({
    mutationFn: async ({ mealId, status, skipReason }) => {
      return await mealChartApi.updateMeal({
        date: selectedDate,
        mealId,
        status,
        skipReason,
      });
    },
    onSuccess: (res, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["meal-day-chart", selectedDate] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["meal-summary"] });
      setSkipMealModal(null);
      setSkipReason("");

      if (status === "eaten") {
        haptics.eaten();
        toast.success("Meal completed! 🔥");
      } else if (status === "skipped") {
        haptics.tick();
        toast("Meal marked as skipped");
      } else {
        toast("Meal reset to pending");
      }
    },
  });

  const addUnplannedMutation = useMutation({
    mutationFn: async ({ mealId, item }) => {
      return await mealChartApi.addUnplannedItem({
        date: selectedDate,
        mealId,
        item,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-day-chart", selectedDate] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Extra food item added and logged!");
      setIsUnplannedOpen(false);
      setUnplannedItem({
        name: "",
        quantity: 100,
        unit: "g",
        calories: 150,
        protein: 10,
        carbs: 15,
        fats: 5,
      });
    },
  });

  const copyChartMutation = useMutation({
    mutationFn: async (payload) => {
      return await mealChartApi.copyChart(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-day-chart", selectedDate] });
      toast.success("Diet chart copied successfully!");
      setIsCopyModalOpen(false);
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (payload) => {
      return await mealChartApi.saveTemplate(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet-templates"] });
      toast.success("Saved as reusable template!");
      setIsSaveTemplateOpen(false);
      setTemplateName("");
    },
  });

  const saveChartMutation = useMutation({
    mutationFn: async (payload) => {
      return await mealChartApi.saveDayChart(selectedDate, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-day-chart", selectedDate] });
      toast.success("Diet chart saved for this day!");
      setIsChartEditorOpen(false);
    },
  });

  // Date strip generation: 3 days back, today, 3 days ahead
  const weekStrip = useMemo(() => {
    const list = [];
    const base = new Date(selectedDate);
    for (let i = -3; i <= 3; i++) {
      const d = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
      const str = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = d.getDate();
      list.push({ date: str, dayName, dayNum, isToday: str === todayStr });
    }
    return list;
  }, [selectedDate, todayStr]);

  const handleStepDay = (delta) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + delta);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] pb-28 pt-4 px-3 sm:px-6 max-w-4xl mx-auto space-y-5">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-lime-500/10 flex items-center justify-center text-lime-600">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Daily Diet Chart
              </h1>
              <p className="text-xs text-gray-500">
                Tick off each item as you eat it · Plan vs Actual honest nutrition
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher: Daily Tracker vs Diet Insights */}
        <div className="flex items-center bg-white border border-gray-200/80 rounded-xl p-1 shadow-sm self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("tracker")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "tracker"
                ? "bg-lime-500 text-black shadow-sm font-bold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Daily Tracker</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("insights")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "insights"
                ? "bg-violet-600 text-white shadow-sm font-bold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Diet Insights</span>
          </button>
        </div>
      </div>

      {activeTab === "tracker" ? (
        <>
          {/* Date Navigator & Week Strip */}
          <GlassCard className="p-3 sm:p-4 bg-white border border-gray-200/80 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleStepDay(-1)}
                className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-lime-600" />
                <span className="text-sm font-bold text-gray-900">{selectedDate}</span>
                {isToday && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-100 text-lime-800">
                    TODAY
                  </span>
                )}
                {isFuture && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                    PLANNING (FUTURE)
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleStepDay(1)}
                className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Horizontal 7-Day Quick Strip */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {weekStrip.map((item) => {
                const isSelected = item.date === selectedDate;
                return (
                  <button
                    key={item.date}
                    type="button"
                    onClick={() => setSelectedDate(item.date)}
                    className={`py-2 rounded-xl text-center transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? "bg-lime-500 text-black shadow-md font-bold"
                        : item.isToday
                        ? "bg-lime-100/70 text-lime-900 border border-lime-300 font-semibold"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-[10px] uppercase">{item.dayName}</span>
                    <span className="text-xs sm:text-sm font-extrabold">{item.dayNum}</span>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Sticky Nutrients & Progress Panel */}
          <GlassCard className="p-4 sm:p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm space-y-4 sticky top-16 z-20 backdrop-blur-md bg-white/95">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Calories Consumed
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-gray-900">
                    {consumedTotals.calories}
                  </span>
                  <span className="text-xs font-semibold text-gray-400">
                    / {plannedTotals.calories || 2200} kcal planned
                  </span>
                </div>
              </div>

              {/* Completion Progress Pill */}
              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-50 border border-lime-200 text-lime-800 text-xs font-bold shadow-xs">
                  <CheckCheck className="w-3.5 h-3.5 text-lime-600" />
                  <span>
                    {itemsCompleted} of {totalItems} eaten ({completionPercentage}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Macro Mini-Bars */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100">
              {/* Protein */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-gray-600">
                  <span className="text-violet-600">Protein</span>
                  <span>
                    {consumedTotals.protein} / {plannedTotals.protein || 140}g
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-violet-600 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        plannedTotals.protein > 0
                          ? (consumedTotals.protein / plannedTotals.protein) * 100
                          : 0
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-gray-600">
                  <span className="text-amber-600">Carbs</span>
                  <span>
                    {consumedTotals.carbs} / {plannedTotals.carbs || 250}g
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        plannedTotals.carbs > 0
                          ? (consumedTotals.carbs / plannedTotals.carbs) * 100
                          : 0
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Fats */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-gray-600">
                  <span className="text-pink-600">Fats</span>
                  <span>
                    {consumedTotals.fats} / {plannedTotals.fats || 60}g
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-pink-500 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        plannedTotals.fats > 0
                          ? (consumedTotals.fats / plannedTotals.fats) * 100
                          : 0
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Quick Action Tools Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCopyModalOpen(true)}
                className="text-xs font-semibold py-1.5 px-3 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-gray-500" />
                <span>Copy From...</span>
              </Button>

              {meals.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setIsSaveTemplateOpen(true)}
                  className="text-xs font-semibold py-1.5 px-3 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-gray-500" />
                  <span>Save Template</span>
                </Button>
              )}
            </div>

            <Button
              onClick={() => setIsChartEditorOpen(true)}
              className="bg-lime-500 hover:bg-lime-600 text-black font-bold text-xs py-1.5 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{meals.length > 0 ? "Edit Today's Chart" : "Create Today's Chart"}</span>
            </Button>
          </div>

          {/* Meals List */}
          {meals.length === 0 ? (
            <GlassCard className="p-8 text-center bg-white border border-gray-200/80 rounded-2xl shadow-sm space-y-4">
              <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">No Meals Planned for this Date</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Build today's diet chart with 1-tap autocomplete items, or copy meals from yesterday with ease.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Button
                  onClick={() => setIsChartEditorOpen(true)}
                  className="bg-lime-500 hover:bg-lime-600 text-black font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Create Today's Chart
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCopyModalOpen(true)}
                  className="text-xs font-semibold px-4 py-2 rounded-xl"
                >
                  Copy Yesterday's Diet
                </Button>
              </div>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {meals.map((meal) => {
                const items = meal.plannedFoodItems || [];
                const eatenCount = items.filter((it) => it.eaten).length;
                const isAllEaten = items.length > 0 && eatenCount === items.length;
                const isPartial = eatenCount > 0 && !isAllEaten;
                const isSkipped = meal.status === "skipped";

                return (
                  <GlassCard
                    key={meal.mealId || meal._id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isAllEaten
                        ? "bg-lime-50/50 border-lime-300 shadow-xs"
                        : isSkipped
                        ? "bg-gray-50/70 border-gray-200 opacity-70"
                        : isPartial
                        ? "bg-white border-violet-200 shadow-xs"
                        : "bg-white border-gray-200/80 shadow-sm"
                    }`}
                  >
                    {/* Meal Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-gray-900">
                            {meal.mealName}
                          </h3>
                          <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {meal.scheduledTime || "08:00"}
                          </span>

                          {isAllEaten && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-500 text-black">
                              ALL EATEN ✓
                            </span>
                          )}
                          {isSkipped && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                              SKIPPED
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-gray-500">
                          {eatenCount} of {items.length} items logged ·{" "}
                          {items.reduce((s, it) => s + (it.calories || 0), 0)} kcal
                        </div>
                      </div>

                      {/* Meal Level Quick Controls */}
                      <div className="flex items-center gap-1.5">
                        {!isSkipped && !isAllEaten && (
                          <button
                            type="button"
                            disabled={isFuture}
                            onClick={() =>
                              tickMealMutation.mutate({
                                mealId: meal.mealId || meal._id,
                                status: "eaten",
                              })
                            }
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-lime-100 hover:bg-lime-200 text-lime-900 transition-colors disabled:opacity-50"
                          >
                            Tick All
                          </button>
                        )}

                        {!isSkipped && (
                          <button
                            type="button"
                            onClick={() =>
                              setSkipMealModal({
                                mealId: meal.mealId || meal._id,
                                mealName: meal.mealName,
                              })
                            }
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Skip Meal"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isSkipped && (
                          <button
                            type="button"
                            onClick={() =>
                              tickMealMutation.mutate({
                                mealId: meal.mealId || meal._id,
                                status: "pending",
                              })
                            }
                            className="text-xs font-semibold text-violet-600 hover:underline"
                          >
                            Undo Skip
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Food Items Checkable Rows */}
                    <div className="divide-y divide-gray-50 pt-2">
                      {items.map((item) => {
                        const isChecked = Boolean(item.eaten);

                        return (
                          <div
                            key={item.itemId || item._id}
                            className="py-2.5 flex items-center justify-between gap-3 group"
                          >
                            {/* Checkbox & Name */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <button
                                type="button"
                                disabled={isFuture || isSkipped}
                                onClick={() =>
                                  tickItemMutation.mutate({
                                    mealId: meal.mealId || meal._id,
                                    itemId: item.itemId || item._id,
                                    eaten: !isChecked,
                                  })
                                }
                                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                                  isChecked
                                    ? "bg-lime-500 text-black shadow-xs ring-2 ring-lime-500/20"
                                    : "bg-gray-100 border border-gray-300 hover:border-lime-500 text-transparent"
                                } disabled:opacity-40`}
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                              </button>

                              <div
                                onClick={() => {
                                  setEditItemModal({
                                    mealId: meal.mealId || meal._id,
                                    item,
                                  });
                                  setEditActualQty(item.actualQuantity || item.quantity);
                                }}
                                className="cursor-pointer flex-1 min-w-0"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-xs sm:text-sm font-semibold truncate ${
                                      isChecked
                                        ? "text-gray-900 font-bold"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {item.name}
                                  </span>
                                  {item.isUnplanned && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                      EXTRA
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-500">
                                  {item.actualQuantity !== undefined &&
                                  item.actualQuantity !== item.quantity ? (
                                    <span>
                                      Ate {item.actualQuantity} {item.unit} (planned {item.quantity}{" "}
                                      {item.unit})
                                    </span>
                                  ) : (
                                    <span>
                                      {item.quantity} {item.unit}
                                    </span>
                                  )}
                                  <span className="mx-1">·</span>
                                  <span>{item.calories} kcal</span>
                                  <span className="mx-1">·</span>
                                  <span className="text-violet-600 font-medium">
                                    {item.protein}g P
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Timestamp or Edit button */}
                            <div className="shrink-0 flex items-center gap-1">
                              {isChecked && item.eatenAt && (
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {new Date(item.eatenAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditItemModal({
                                    mealId: meal.mealId || meal._id,
                                    item,
                                  });
                                  setEditActualQty(item.actualQuantity || item.quantity);
                                }}
                                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-60 group-hover:opacity-100"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Unplanned / Extra Food to this Meal */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setUnplannedMealId(meal.mealId || meal._id);
                          setIsUnplannedOpen(true);
                        }}
                        className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
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
        /* Diet Insights & Averages View */
        <div className="space-y-5">
          {/* Range Pills */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Diet Analytics & Averages</h2>
              <p className="text-xs text-gray-500">
                Track consistency, weekly averages, and adherence streaks
              </p>
            </div>

            <div className="flex items-center bg-white border border-gray-200/80 rounded-xl p-1 shadow-sm">
              {["7d", "30d", "90d"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setInsightsRange(r)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg uppercase transition-all ${
                    insightsRange === r
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Bento Stat Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <GlassCard className="p-4 bg-white border border-gray-200/80 rounded-2xl shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-gray-500">Average Calories</span>
              <div className="text-2xl font-bold text-gray-900">
                {summaryRes?.summary?.averageCalories || 0}
              </div>
              <div className="text-[10px] text-gray-400">
                Target: {summaryRes?.profileTargets?.calories || 2200} kcal
              </div>
            </GlassCard>

            <GlassCard className="p-4 bg-white border border-gray-200/80 rounded-2xl shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-gray-500">Average Protein</span>
              <div className="text-2xl font-bold text-violet-600">
                {summaryRes?.summary?.averageProtein || 0}g
              </div>
              <div className="text-[10px] text-gray-400">
                Target: {summaryRes?.profileTargets?.protein || 140}g
              </div>
            </GlassCard>

            <GlassCard className="p-4 bg-white border border-gray-200/80 rounded-2xl shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-gray-500">Adherence Streak</span>
              <div className="text-2xl font-bold text-lime-600 flex items-center gap-1">
                <Flame className="w-5 h-5 text-amber-500" />
                <span>{summaryRes?.summary?.currentStreak || 0}d</span>
              </div>
              <div className="text-[10px] text-gray-400">
                Best: {summaryRes?.summary?.bestStreak || 0} days (≥80%)
              </div>
            </GlassCard>

            <GlassCard className="p-4 bg-white border border-gray-200/80 rounded-2xl shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-gray-500">Average Completion</span>
              <div className="text-2xl font-bold text-gray-900">
                {summaryRes?.summary?.averageCompletion || 0}%
              </div>
              <div className="text-[10px] text-gray-400">
                {summaryRes?.summary?.totalLoggedDays || 0} days logged
              </div>
            </GlassCard>
          </div>

          {/* Weekly Bar Chart (Consumed vs Target) */}
          <GlassCard className="p-4 sm:p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm space-y-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Calories: Consumed vs Target</h3>
              <p className="text-xs text-gray-500">
                Days with no tracking appear as Not Logged (never zero)
              </p>
            </div>

            <div className="h-60 w-full pt-2">
              {summaryRes?.dailyDetails && summaryRes.dailyDetails.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summaryRes.dailyDetails.map((d) => ({
                      date: d.date.slice(5),
                      consumed: d.logged ? d.consumedTotals?.calories : null,
                      target: summaryRes.profileTargets?.calories || 2200,
                      logged: d.logged,
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#64748B" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748B" }}
                      tickLine={false}
                      domain={[0, "auto"]}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-md text-xs space-y-1">
                              <div className="font-bold text-gray-900">{label}</div>
                              {data.logged ? (
                                <div className="text-lime-700 font-semibold">
                                  Consumed: {data.consumed} kcal
                                </div>
                              ) : (
                                <div className="text-gray-400 italic">Not logged</div>
                              )}
                              <div className="text-gray-500">Target: {data.target} kcal</div>
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
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  No diet logs in this period
                </div>
              )}
            </div>
          </GlassCard>

          {/* Daily Breakdown Details Table */}
          <GlassCard className="p-4 sm:p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Daily Adherence Breakdown</h3>

            <div className="divide-y divide-gray-100">
              {(summaryRes?.dailyDetails || []).map((day) => (
                <div key={day.date} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-gray-900">{day.date}</div>
                    {day.logged ? (
                      <div className="text-[11px] text-gray-500">
                        {day.consumedTotals?.calories} kcal · {day.consumedTotals?.protein}g P ·{" "}
                        {day.itemsCompleted} items eaten
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">Not logged</span>
                    )}
                  </div>

                  <div>
                    {day.logged ? (
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          day.completionPercentage >= 80
                            ? "bg-lime-100 text-lime-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {day.completionPercentage}% Completed
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-300">--</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Edit Actual Quantity Bottom Sheet */}
      <Sheet
        isOpen={Boolean(editItemModal)}
        onClose={() => setEditItemModal(null)}
        title="Edit Actual Quantity"
      >
        <div className="p-4 space-y-4 max-w-md mx-auto">
          <p className="text-xs text-gray-500">
            Keep planned vs consumed honest by logging the exact portion you had.
          </p>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
            <span className="text-xs font-bold text-gray-900">
              {editItemModal?.item?.name}
            </span>
            <div className="text-[11px] text-gray-500">
              Originally planned: {editItemModal?.item?.quantity} {editItemModal?.item?.unit} (
              {editItemModal?.item?.calories} kcal)
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Actual Portion Eaten</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={editActualQty}
                onChange={(e) => setEditActualQty(e.target.value)}
                className="w-full text-base font-bold bg-white border border-gray-300 rounded-xl p-2.5"
              />
              <span className="text-xs font-semibold text-gray-500">
                {editItemModal?.item?.unit}
              </span>
            </div>
          </div>

          <Button
            onClick={() => {
              tickItemMutation.mutate({
                mealId: editItemModal.mealId,
                itemId: editItemModal.item.itemId || editItemModal.item._id,
                eaten: true,
                actualQuantity: Number(editActualQty),
              });
              setEditItemModal(null);
            }}
            className="w-full bg-lime-500 hover:bg-lime-600 text-black font-bold text-xs py-3 rounded-xl"
          >
            Save Actual Portion & Mark Eaten
          </Button>
        </div>
      </Sheet>

      {/* Skip Meal Bottom Sheet */}
      <Sheet
        isOpen={Boolean(skipMealModal)}
        onClose={() => setSkipMealModal(null)}
        title={`Skip ${skipMealModal?.mealName}`}
      >
        <div className="p-4 space-y-4 max-w-md mx-auto">
          <p className="text-xs text-gray-500">
            Marking a meal as skipped keeps your adherence honesty without shaming.
          </p>

          <div>
            <label className="text-xs font-semibold text-gray-700">Reason (Optional)</label>
            <input
              type="text"
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder="e.g. Busy with meetings / Fasting"
              className="mt-1 w-full text-xs bg-gray-50 border border-gray-300 rounded-xl p-2.5"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSkipMealModal(null)}
              className="w-1/2 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                tickMealMutation.mutate({
                  mealId: skipMealModal.mealId,
                  status: "skipped",
                  skipReason,
                })
              }
              className="w-1/2 bg-gray-900 text-white text-xs font-bold"
            >
              Confirm Skip
            </Button>
          </div>
        </div>
      </Sheet>

      {/* Add Extra/Unplanned Food Item Sheet */}
      <Sheet
        isOpen={isUnplannedOpen}
        onClose={() => setIsUnplannedOpen(false)}
        title="Add Extra Food Eaten"
      >
        <div className="p-4 space-y-4 max-w-md mx-auto">
          <p className="text-xs text-gray-500">
            Ate something outside your plan? Tap an instant library item or type it in.
          </p>

          {/* Quick Library Suggestions */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
              Quick Suggestions
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {QUICK_FOOD_LIBRARY.map((f, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    setUnplannedItem({
                      name: f.name,
                      quantity: f.quantity,
                      unit: f.unit,
                      calories: f.calories,
                      protein: f.protein,
                      carbs: f.carbs,
                      fats: f.fats,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-lime-100 text-[11px] font-semibold text-gray-700 transition-colors"
                >
                  {f.name} ({f.calories} cal)
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div>
              <label className="text-xs font-semibold text-gray-700">Food Name</label>
              <input
                type="text"
                value={unplannedItem.name}
                onChange={(e) => setUnplannedItem({ ...unplannedItem, name: e.target.value })}
                placeholder="e.g. Protein Bar / Almonds"
                className="mt-1 w-full text-xs bg-gray-50 border border-gray-300 rounded-xl p-2.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-700">Quantity</label>
                <input
                  type="number"
                  value={unplannedItem.quantity}
                  onChange={(e) =>
                    setUnplannedItem({ ...unplannedItem, quantity: Number(e.target.value) })
                  }
                  className="mt-1 w-full text-xs bg-gray-50 border border-gray-300 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Unit</label>
                <input
                  type="text"
                  value={unplannedItem.unit}
                  onChange={(e) => setUnplannedItem({ ...unplannedItem, unit: e.target.value })}
                  className="mt-1 w-full text-xs bg-gray-50 border border-gray-300 rounded-xl p-2.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <div>
                <label className="text-[10px] font-semibold text-gray-500">Calories</label>
                <input
                  type="number"
                  value={unplannedItem.calories}
                  onChange={(e) =>
                    setUnplannedItem({ ...unplannedItem, calories: Number(e.target.value) })
                  }
                  className="mt-1 w-full text-xs bg-gray-50 border border-gray-300 rounded-xl p-2"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-violet-600">Protein (g)</label>
                <input
                  type="number"
                  value={unplannedItem.protein}
                  onChange={(e) =>
                    setUnplannedItem({ ...unplannedItem, protein: Number(e.target.value) })
                  }
                  className="mt-1 w-full text-xs bg-gray-50 border border-gray-300 rounded-xl p-2"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-amber-600">Carbs (g)</label>
                <input
                  type="number"
                  value={unplannedItem.carbs}
                  onChange={(e) =>
                    setUnplannedItem({ ...unplannedItem, carbs: Number(e.target.value) })
                  }
                  className="mt-1 w-full text-xs bg-gray-50 border border-gray-300 rounded-xl p-2"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-pink-600">Fats (g)</label>
                <input
                  type="number"
                  value={unplannedItem.fats}
                  onChange={(e) =>
                    setUnplannedItem({ ...unplannedItem, fats: Number(e.target.value) })
                  }
                  className="mt-1 w-full text-xs bg-gray-50 border border-gray-300 rounded-xl p-2"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={() =>
              addUnplannedMutation.mutate({
                mealId: unplannedMealId,
                item: unplannedItem,
              })
            }
            disabled={!unplannedItem.name.trim()}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-3 rounded-xl"
          >
            Add & Log Extra Food
          </Button>
        </div>
      </Sheet>

      {/* Copy Chart Bottom Sheet */}
      <Sheet
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        title="Copy Diet Chart"
      >
        <div className="p-4 space-y-4 max-w-md mx-auto">
          <p className="text-xs text-gray-500">
            Copy an entire day's meals or an established template into {selectedDate}.
          </p>

          <div>
            <label className="text-xs font-semibold text-gray-700">Option 1: From a Past Date</label>
            <input
              type="date"
              value={copySourceDate}
              onChange={(e) => {
                setCopySourceDate(e.target.value);
                setCopySourceTemplateId("");
              }}
              className="mt-1 w-full text-xs bg-gray-50 border border-gray-300 rounded-xl p-2.5"
            />
          </div>

          <div className="text-center text-xs font-bold text-gray-400">--- OR ---</div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Option 2: From a Saved Template</label>
            <select
              value={copySourceTemplateId}
              onChange={(e) => {
                setCopySourceTemplateId(e.target.value);
                setCopySourceDate("");
              }}
              className="mt-1 w-full text-xs bg-gray-50 border border-gray-300 rounded-xl p-2.5"
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
            onClick={() =>
              copyChartMutation.mutate({
                sourceDate: copySourceDate || undefined,
                sourceTemplateId: copySourceTemplateId || undefined,
                targetDates: [selectedDate],
              })
            }
            disabled={!copySourceDate && !copySourceTemplateId}
            className="w-full bg-lime-500 hover:bg-lime-600 text-black font-bold text-xs py-3 rounded-xl"
          >
            Apply to {selectedDate}
          </Button>
        </div>
      </Sheet>

      {/* Save As Template Bottom Sheet */}
      <Sheet
        isOpen={isSaveTemplateOpen}
        onClose={() => setIsSaveTemplateOpen(false)}
        title="Save Day as Template"
      >
        <div className="p-4 space-y-4 max-w-md mx-auto">
          <p className="text-xs text-gray-500">
            Save today's planned meals as a reusable template (e.g. "High Protein Bulking", "Rest Day").
          </p>

          <div>
            <label className="text-xs font-semibold text-gray-700">Template Name</label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. High Carb Training Day"
              className="mt-1 w-full text-xs bg-gray-50 border border-gray-300 rounded-xl p-2.5"
            />
          </div>

          <Button
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
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-3 rounded-xl"
          >
            Save Template
          </Button>
        </div>
      </Sheet>

      {/* Quick Chart Creator / Editor Sheet */}
      <Sheet
        isOpen={isChartEditorOpen}
        onClose={() => setIsChartEditorOpen(false)}
        title={`Edit Diet Chart for ${selectedDate}`}
      >
        <div className="p-4 space-y-4 max-w-lg mx-auto">
          <p className="text-xs text-gray-500">
            Quickly customize meals for this date. Ticking state is automatically preserved!
          </p>

          {/* Preset Meal Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700">Default Meal Setup</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const defaultMeals = [
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
                  ];
                  saveChartMutation.mutate({ meals: defaultMeals });
                }}
                className="text-xs py-2"
              >
                Standard 3-Meal Day
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const fitnessMeals = [
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
                  ];
                  saveChartMutation.mutate({ meals: fitnessMeals });
                }}
                className="text-xs py-2"
              >
                High Protein 4-Meal Plan
              </Button>
            </div>
          </div>
        </div>
      </Sheet>
    </div>
  );
};

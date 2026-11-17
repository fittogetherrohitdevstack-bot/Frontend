import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  Minus,
  Flame,
  ArrowRight,
  Database,
  Check,
  RotateCcw,
} from "lucide-react";
import { dietApi } from "../../api/endpoints";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const DEFAULT_SLOTS = [
  { id: "Breakfast", label: "Breakfast", time: "08:00", icon: "🌅" },
  { id: "Lunch", label: "Lunch", time: "13:00", icon: "☀️" },
  { id: "Snack", label: "Snack", time: "17:00", icon: "☕" },
  { id: "Dinner", label: "Dinner", time: "20:30", icon: "🌙" },
];

const QUICK_STARTERS = [
  { label: "Eggs & Toast", text: "2 boiled eggs, 2 slices brown bread with 1 tbsp peanut butter" },
  { label: "Whey Shake", text: "1 scoop whey protein with 250ml milk and 1 banana" },
  { label: "Chicken & Rice", text: "1 bowl grilled chicken with 1 bowl white rice and salad" },
  { label: "Roti, Dal & Paneer", text: "2 rotis, 1 bowl dal tadka and 100g paneer" },
  { label: "Oatmeal Bowl", text: "1 bowl oats with milk, 1 banana and 6 almonds" },
  { label: "Veg Sandwich", text: "1 veg sandwich with 1 slice cheese and black coffee" },
];

const getDefaultSlotId = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "Breakfast";
  if (hour >= 11 && hour < 16) return "Lunch";
  if (hour >= 16 && hour < 19) return "Snack";
  return "Dinner";
};

const getSlotIcon = (name = "") => {
  const lower = name.toLowerCase();
  if (lower.includes("breakfast") || lower.includes("morning")) return "🌅";
  if (lower.includes("lunch") || lower.includes("afternoon")) return "☀️";
  if (lower.includes("snack") || lower.includes("tea")) return "☕";
  if (lower.includes("dinner") || lower.includes("night")) return "🌙";
  if (lower.includes("pre") || lower.includes("post") || lower.includes("workout")) return "⚡";
  return "🍽️";
};

export const AiMealQuickLogModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [mealText, setMealText] = useState("");
  const [selectedSlotName, setSelectedSlotName] = useState(getDefaultSlotId);
  const [selectedMealId, setSelectedMealId] = useState(null);
  const [estimatedData, setEstimatedData] = useState(null);
  const [customItems, setCustomItems] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemUnit, setNewItemUnit] = useState("piece");

  // Fetch today's meal log to dynamically link to user's real diet slots
  const { data: mealLogData } = useQuery({
    queryKey: ["today-meal-log"],
    queryFn: async () => {
      const res = await dietApi.getOrCreateMealLog();
      return res.data?.data;
    },
    enabled: isOpen,
    staleTime: 30000,
  });

  // Dynamic slots derived from today's active plan
  const availableSlots = useMemo(() => {
    const plannedMeals = mealLogData?.mealLog?.meals;
    if (plannedMeals && Array.isArray(plannedMeals) && plannedMeals.length > 0) {
      return plannedMeals.map((m) => ({
        id: m.mealName,
        mealId: m.mealId,
        label: m.mealName,
        time: m.scheduledTime,
        status: m.status,
        icon: getSlotIcon(m.mealName),
      }));
    }
    return DEFAULT_SLOTS.map((s) => ({ ...s, mealId: null, status: "pending" }));
  }, [mealLogData]);

  // Sync initial slot selection
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const defaultId = getDefaultSlotId();
      const matched = availableSlots.find(
        (s) => s.id.toLowerCase() === defaultId.toLowerCase()
      ) || availableSlots[0];

      if (matched) {
        setSelectedSlotName(matched.label);
        setSelectedMealId(matched.mealId || null);
      }
      setEstimatedData(null);
      setCustomItems(null);
      setShowAddItem(false);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, availableSlots]);

  // Live estimate mutation
  const estimateMutation = useMutation({
    mutationFn: async (text) => {
      const res = await dietApi.aiEstimateMeal({
        text,
        mealName: selectedSlotName,
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      haptics.tick();
      setEstimatedData(data);
      // Clone items so user can edit quantities or remove freely
      setCustomItems(
        (data.items || []).map((it) => ({
          ...it,
          baseCalories: it.quantity ? it.calories / it.quantity : it.calories,
          baseProtein: it.quantity ? it.protein / it.quantity : it.protein,
          baseCarbs: it.quantity ? it.carbs / it.quantity : it.carbs,
          baseFats: it.quantity ? it.fats / it.quantity : it.fats,
        }))
      );
      if (data.mealSlot) {
        const found = availableSlots.find(
          (s) => s.id.toLowerCase() === data.mealSlot.toLowerCase()
        );
        if (found) {
          setSelectedSlotName(found.label);
          setSelectedMealId(found.mealId || null);
        }
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Could not analyze meal");
    },
  });

  // Direct quick-log mutation
  const logMutation = useMutation({
    mutationFn: async ({ text, mealName, mealId, items }) => {
      const res = await dietApi.aiQuickLogMeal({
        text,
        mealName,
        mealId,
        items,
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      haptics.goal();
      confetti({
        particleCount: 90,
        spread: 75,
        colors: ["#84CC16", "#10B981", "#06B6D4", "#F59E0B"],
        origin: { y: 0.6 },
      });
      toast.success(data?.message || `Logged to ${selectedSlotName}! +XP awarded 🥗`);
      queryClient.invalidateQueries({ queryKey: ["today-meal-log"] });
      queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["meal-day-chart"] });
      queryClient.invalidateQueries({ queryKey: ["group-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["group-leaderboard"] });
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Could not log meal");
    },
  });

  const handleTextChange = (e) => {
    setMealText(e.target.value);
    setEstimatedData(null);
    setCustomItems(null);
  };

  const handleStarterClick = (starterText) => {
    haptics.tick();
    setMealText(starterText);
    setEstimatedData(null);
    setCustomItems(null);
  };

  const handleEstimate = () => {
    if (!mealText.trim()) {
      toast.error("Please enter what you ate first");
      return;
    }
    estimateMutation.mutate(mealText.trim());
  };

  const handleLog = () => {
    if (!mealText.trim() && (!customItems || customItems.length === 0)) {
      toast.error("Please enter what you ate");
      return;
    }

    logMutation.mutate({
      text: mealText.trim(),
      mealName: selectedSlotName,
      mealId: selectedMealId || undefined,
      items: customItems || undefined,
    });
  };

  // Stepper quantity update (+ / -)
  const handleUpdateQuantity = (index, delta) => {
    haptics.tick();
    if (!customItems) return;
    setCustomItems((prev) => {
      const next = [...prev];
      const it = { ...next[index] };
      const currentQty = Number(it.quantity) || 1;
      const isWeight = it.unit === "g" || it.unit === "ml";
      const step = isWeight ? 25 : 0.5;
      const newQty = Math.max(step, Number((currentQty + delta * step).toFixed(2)));

      it.quantity = newQty;
      // Proportional macro calculation based on base rates
      const baseC = it.baseCalories !== undefined ? it.baseCalories : it.calories / currentQty;
      const baseP = it.baseProtein !== undefined ? it.baseProtein : it.protein / currentQty;
      const baseCb = it.baseCarbs !== undefined ? it.baseCarbs : it.carbs / currentQty;
      const baseF = it.baseFats !== undefined ? it.baseFats : it.fats / currentQty;

      it.calories = Math.round(baseC * newQty);
      it.protein = Number((baseP * newQty).toFixed(1));
      it.carbs = Number((baseCb * newQty).toFixed(1));
      it.fats = Number((baseF * newQty).toFixed(1));

      next[index] = it;
      return next;
    });
  };

  const handleRemoveItem = (idx) => {
    haptics.tick();
    if (!customItems) return;
    setCustomItems(customItems.filter((_, i) => i !== idx));
  };

  const handleAddNewItem = () => {
    if (!newItemName.trim()) {
      toast.error("Please enter food name");
      return;
    }
    haptics.tick();
    const qty = parseFloat(newItemQty) || 1;
    const cleanName = newItemName.trim();
    // Default reasonable macro
    const baseCals = 120;
    const baseProt = 5;
    const baseCarb = 15;
    const baseFat = 3;

    const itemObj = {
      name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      quantity: qty,
      unit: newItemUnit,
      calories: Math.round(baseCals * qty),
      protein: Number((baseProt * qty).toFixed(1)),
      carbs: Number((baseCarb * qty).toFixed(1)),
      fats: Number((baseFat * qty).toFixed(1)),
      baseCalories: baseCals,
      baseProtein: baseProt,
      baseCarbs: baseCarb,
      baseFats: baseFat,
      isEstimate: true,
    };

    setCustomItems((prev) => [...(prev || []), itemObj]);
    setNewItemName("");
    setNewItemQty("1");
    setShowAddItem(false);
  };

  // Recalculate totals dynamically from active items
  const activeTotals = useMemo(() => {
    const list = customItems || estimatedData?.items || [];
    return list.reduce(
      (acc, it) => {
        acc.calories += Number(it.calories) || 0;
        acc.protein = Number((acc.protein + (Number(it.protein) || 0)).toFixed(1));
        acc.carbs = Number((acc.carbs + (Number(it.carbs) || 0)).toFixed(1));
        acc.fats = Number((acc.fats + (Number(it.fats) || 0)).toFixed(1));
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [customItems, estimatedData]);

  // Source tag badge renderer
  const renderSourceBadge = () => {
    const src = estimatedData?.source;
    if (!src) return null;

    if (src === "cache") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-lime-100 text-lime-900 border border-lime-300">
          <Zap className="w-3 h-3 fill-lime-600 text-lime-600" />
          ⚡ Instant Cached (0ms)
        </span>
      );
    }
    if (src === "gemini-ai") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300">
          <Sparkles className="w-3 h-3 text-purple-600" />
          ✨ Gemini 2.0 AI
        </span>
      );
    }
    if (src === "verified-db") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
          <Database className="w-3 h-3 text-emerald-600" />
          🥗 USDA / IFCT Food DB
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
        <Sparkles className="w-3 h-3 text-slate-500" />
        🤖 Smart Estimator
      </span>
    );
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center sm:items-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal / Bottom Sheet Container */}
        <motion.div
          initial={{ y: "100%", opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0.8 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full sm:max-w-xl max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Mobile Handle */}
          <div className="pt-3 pb-1 flex justify-center sm:hidden">
            <div className="w-12 h-1.5 rounded-full bg-slate-300" />
          </div>

          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-lime-100 border border-lime-300 text-lime-800 flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5 text-lime-700" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  AI Meal Quick-Log
                  <span className="text-[10px] font-black uppercase tracking-wider text-lime-800 bg-lime-100 border border-lime-300 px-1.5 py-0.5 rounded-full">
                    Auto Macro
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium truncate">
                  Simply type what you ate — AI estimates the nutrients &amp; logs it!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                haptics.tick();
                onClose();
              }}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Meal Slot Picker (Dynamically from Today's Schedule) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Target Meal Slot
                </label>
                <span className="text-[11px] font-medium text-slate-400">
                  Today's Schedule
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableSlots.map((slot) => {
                  const active =
                    selectedSlotName.toLowerCase() === slot.label.toLowerCase() ||
                    (slot.mealId && selectedMealId === slot.mealId);
                  return (
                    <button
                      key={slot.label}
                      type="button"
                      onClick={() => {
                        haptics.tick();
                        setSelectedSlotName(slot.label);
                        setSelectedMealId(slot.mealId || null);
                      }}
                      className={`min-h-[46px] px-2.5 py-2 rounded-2xl text-xs font-extrabold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border ${
                        active
                          ? "bg-slate-900 text-lime-300 border-slate-900 shadow-md ring-2 ring-lime-400/30"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{slot.icon}</span>
                        <span className="truncate max-w-[90px]">{slot.label}</span>
                      </div>
                      {slot.time && (
                        <span
                          className={`text-[10px] font-bold ${
                            active ? "text-lime-400" : "text-slate-400"
                          }`}
                        >
                          {slot.time}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Natural Language Meal Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>What did you eat?</span>
                <span className="text-[11px] font-normal text-slate-400">Natural language</span>
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={mealText}
                  onChange={handleTextChange}
                  placeholder="e.g. 2 boiled eggs, 2 slices whole wheat bread with butter and a cup of black coffee"
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition-all resize-none shadow-xs"
                />
                {mealText && (
                  <button
                    type="button"
                    onClick={() => {
                      haptics.tick();
                      setMealText("");
                      setEstimatedData(null);
                      setCustomItems(null);
                    }}
                    className="absolute top-2.5 right-2.5 text-xs text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Quick Inspiration Starters */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Quick Starters
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_STARTERS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => handleStarterClick(s.text)}
                    className="px-2.5 py-1 rounded-full text-xs font-bold bg-lime-50 hover:bg-lime-100 text-lime-800 border border-lime-200 transition-colors cursor-pointer"
                  >
                    + {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Macro Estimation Review Section */}
            <AnimatePresence>
              {(estimatedData || (customItems && customItems.length > 0)) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="space-y-3 pt-3 border-t border-slate-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      Nutrient Breakdown Preview
                    </span>
                    <div className="flex items-center gap-1.5">
                      {renderSourceBadge()}
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {customItems?.length || 0} items
                      </span>
                    </div>
                  </div>

                  {/* Macro KPI Badges */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center">
                      <span className="text-[10px] font-black uppercase text-amber-800 block">
                        Calories
                      </span>
                      <span className="text-base font-black text-amber-900 tabular-nums">
                        {activeTotals.calories}
                      </span>
                      <span className="text-[9px] text-amber-700 block">kcal</span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-center">
                      <span className="text-[10px] font-black uppercase text-purple-800 block">
                        Protein
                      </span>
                      <span className="text-base font-black text-purple-900 tabular-nums">
                        {activeTotals.protein}
                      </span>
                      <span className="text-[9px] text-purple-700 block">g</span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-cyan-50/70 border border-cyan-200/80 text-center">
                      <span className="text-[10px] font-black uppercase text-cyan-800 block">
                        Carbs
                      </span>
                      <span className="text-base font-black text-cyan-900 tabular-nums">
                        {activeTotals.carbs}
                      </span>
                      <span className="text-[9px] text-cyan-700 block">g</span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-center">
                      <span className="text-[10px] font-black uppercase text-rose-800 block">
                        Fats
                      </span>
                      <span className="text-base font-black text-rose-900 tabular-nums">
                        {activeTotals.fats}
                      </span>
                      <span className="text-[9px] text-rose-700 block">g</span>
                    </div>
                  </div>

                  {/* Interactive Detected Items List with Steppers & Delete */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                        Review &amp; Adjust Items
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddItem((prev) => !prev)}
                        className="text-xs font-bold text-lime-700 hover:text-lime-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Extra Food
                      </button>
                    </div>

                    {/* Inline Add Item Form */}
                    <AnimatePresence>
                      {showAddItem && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-3 rounded-2xl bg-lime-50/80 border border-lime-200 space-y-2 overflow-hidden"
                        >
                          <span className="text-xs font-black text-slate-800 block">
                            Quick Add Item
                          </span>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newItemName}
                              onChange={(e) => setNewItemName(e.target.value)}
                              placeholder="e.g. 1 Apple, 1 tbsp honey"
                              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-lime-500"
                            />
                            <input
                              type="number"
                              min="0.1"
                              step="0.5"
                              value={newItemQty}
                              onChange={(e) => setNewItemQty(e.target.value)}
                              className="w-16 px-2 py-1.5 text-xs text-center rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-lime-500"
                            />
                            <select
                              value={newItemUnit}
                              onChange={(e) => setNewItemUnit(e.target.value)}
                              className="px-2 py-1.5 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-lime-500"
                            >
                              <option value="piece">piece</option>
                              <option value="slice">slice</option>
                              <option value="bowl">bowl</option>
                              <option value="cup">cup</option>
                              <option value="scoop">scoop</option>
                              <option value="tbsp">tbsp</option>
                              <option value="g">g</option>
                              <option value="ml">ml</option>
                              <option value="serving">serving</option>
                            </select>
                            <button
                              type="button"
                              onClick={handleAddNewItem}
                              className="px-3 py-1.5 rounded-xl bg-lime-600 text-white font-black text-xs hover:bg-lime-700 cursor-pointer"
                            >
                              Add
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Detected Items Pill Cards */}
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {(customItems || []).map((it, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2.5 text-xs shadow-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 truncate block">
                                {it.name}
                              </span>
                              {it.isEstimate && (
                                <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-100 border border-amber-300 px-1 py-0.2 rounded-md">
                                  Estimate
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium">
                              <span className="text-amber-800 font-bold">{it.calories} kcal</span>
                              <span>·</span>
                              <span className="text-purple-700 font-semibold">{it.protein}g P</span>
                              <span>·</span>
                              <span className="text-cyan-700 font-semibold">{it.carbs}g C</span>
                              <span>·</span>
                              <span className="text-rose-700 font-semibold">{it.fats}g F</span>
                            </div>
                          </div>

                          {/* Stepper Controls */}
                          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(idx, -1)}
                              className="w-6 h-6 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                              title="Decrease"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-black text-slate-800 px-1 min-w-[36px] text-center tabular-nums">
                              {it.quantity} <span className="text-[10px] font-medium text-slate-500">{it.unit}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(idx, 1)}
                              className="w-6 h-6 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                              title="Increase"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="w-8 h-8 rounded-xl hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
            {/* Analyze button (shown if not yet estimated) */}
            {!estimatedData && (
              <button
                type="button"
                disabled={!mealText.trim() || estimateMutation.isPending}
                onClick={handleEstimate}
                className="w-full sm:w-auto min-h-[46px] px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {estimateMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Meal...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-lime-600" />
                    <span>Preview Nutrients</span>
                  </>
                )}
              </button>
            )}

            {/* Direct Log Button */}
            <button
              type="button"
              disabled={
                (!mealText.trim() && (!customItems || customItems.length === 0)) ||
                logMutation.isPending
              }
              onClick={handleLog}
              className="w-full flex-1 min-h-[46px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-lime-600 via-emerald-600 to-teal-600 hover:from-lime-700 hover:via-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {logMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging with AI...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-lime-300 text-lime-300" />
                  <span>Log to {selectedSlotName} (+XP)</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

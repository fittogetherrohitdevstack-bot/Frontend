import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Sparkles,
  Zap,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  Flame,
  ArrowRight,
} from "lucide-react";
import { dietApi } from "../../api/endpoints";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const MEAL_SLOTS = [
  { id: "Breakfast", label: "Breakfast", icon: "🌅" },
  { id: "Lunch", label: "Lunch", icon: "☀️" },
  { id: "Snack", label: "Snack", icon: "☕" },
  { id: "Dinner", label: "Dinner", icon: "🌙" },
];

const QUICK_STARTERS = [
  { label: "Eggs & Toast", text: "2 boiled eggs, 2 slices brown bread with 1 tbsp peanut butter" },
  { label: "Whey Shake", text: "1 scoop whey protein with 250ml milk" },
  { label: "Chicken & Rice", text: "1 bowl chicken breast with 1 bowl white rice" },
  { label: "Roti & Dal", text: "2 rotis, 1 bowl dal tadka and 100g paneer" },
  { label: "Oatmeal Bowl", text: "1 bowl oats with milk, 1 banana and 6 almonds" },
];

const getDefaultSlot = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "Breakfast";
  if (hour >= 11 && hour < 16) return "Lunch";
  if (hour >= 16 && hour < 19) return "Snack";
  return "Dinner";
};

export const AiMealQuickLogModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [mealText, setMealText] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(getDefaultSlot);
  const [estimatedData, setEstimatedData] = useState(null);
  const [customItems, setCustomItems] = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setSelectedSlot(getDefaultSlot());
      setEstimatedData(null);
      setCustomItems(null);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Live estimate mutation
  const estimateMutation = useMutation({
    mutationFn: async (text) => {
      const res = await dietApi.aiEstimateMeal({ text, mealName: selectedSlot });
      return res.data?.data;
    },
    onSuccess: (data) => {
      haptics.tick();
      setEstimatedData(data);
      setCustomItems(data.items || []);
      if (data.mealSlot && !selectedSlot) {
        setSelectedSlot(data.mealSlot);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Could not analyze meal");
    },
  });

  // Direct quick-log mutation
  const logMutation = useMutation({
    mutationFn: async ({ text, mealName, items }) => {
      const res = await dietApi.aiQuickLogMeal({ text, mealName, items });
      return res.data?.data;
    },
    onSuccess: (data) => {
      haptics.goal();
      confetti({
        particleCount: 80,
        spread: 70,
        colors: ["#84CC16", "#10B981", "#06B6D4", "#F59E0B"],
        origin: { y: 0.6 },
      });
      toast.success(data?.message || `Logged to ${selectedSlot}! +XP awarded 🥗`);
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
      mealName: selectedSlot,
      items: customItems || undefined,
    });
  };

  const handleRemoveItem = (idx) => {
    haptics.tick();
    if (!customItems) return;
    const updated = customItems.filter((_, i) => i !== idx);
    setCustomItems(updated);
  };

  // Recalculate totals from active items
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

        {/* Modal / Sheet Container */}
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
              <div className="w-10 h-10 rounded-2xl bg-lime-100 border border-lime-300 text-lime-800 flex items-center justify-center shrink-0">
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
            {/* Meal Slot Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                Meal Slot
              </label>
              <div className="grid grid-cols-4 gap-2">
                {MEAL_SLOTS.map((slot) => {
                  const active = selectedSlot === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        haptics.tick();
                        setSelectedSlot(slot.id);
                      }}
                      className={`min-h-[42px] px-2 py-2 rounded-2xl text-xs font-extrabold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border ${
                        active
                          ? "bg-slate-900 text-lime-300 border-slate-900 shadow-xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-sm">{slot.icon}</span>
                      <span className="truncate">{slot.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Textarea */}
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
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition-all resize-none"
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

            {/* Live Macro Estimation Cards */}
            <AnimatePresence>
              {(estimatedData || (customItems && customItems.length > 0)) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="space-y-3 pt-2 border-t border-slate-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      Estimated Nutrients
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {customItems?.length || 0} item(s) detected
                    </span>
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

                  {/* Detected Items Pill List */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Identified Items
                    </span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {(customItems || []).map((it, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-500 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-900 truncate block">
                                {it.name}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {it.quantity} {it.unit} · {it.calories} kcal · {it.protein}g protein
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="w-7 h-7 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
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
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {estimateMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
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
              className="w-full flex-1 min-h-[44px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-lime-600 via-emerald-600 to-teal-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {logMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging with AI...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-lime-300 text-lime-300" />
                  <span>Log to {selectedSlot} with AI (+XP)</span>
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

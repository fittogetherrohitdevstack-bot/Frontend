import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Sheet } from "../ui/Sheet";
import { Button } from "../ui/Button";
import { haptics } from "../../motion/Haptics";
import { mealChartApi } from "../../api/endpoints";
import {
  Sparkles,
  Search,
  Plus,
  Trash2,
  Clock,
  Flame,
  Check,
  Zap,
  Bookmark,
  Edit3,
  Scale,
  X,
  History,
} from "lucide-react";

// Standard popular fitness food presets
const POPULAR_STAPLES = [
  { name: "Oats", quantity: 60, unit: "g", calories: 230, protein: 8, carbs: 40, fats: 4 },
  { name: "Whole Eggs (2)", quantity: 2, unit: "eggs", calories: 140, protein: 12, carbs: 1, fats: 10 },
  { name: "Egg Whites", quantity: 150, unit: "g", calories: 78, protein: 16.5, carbs: 1, fats: 0.3 },
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

const INITIAL_FORM = {
  name: "",
  quantity: 100,
  unit: "g",
  calories: 150,
  protein: 10,
  carbs: 15,
  fats: 5,
};

export const AddExtraFoodSheet = ({
  open,
  onOpenChange,
  mealId,
  mealName = "Meal",
  userId,
  onAddExtra,
  isAdding = false,
}) => {
  const storageKey = `ft_user_extras_${userId || "default"}`;

  // Form & view state
  const [activeTab, setActiveTab] = useState("saved"); // "saved" | "popular" | "custom"
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [rememberThis, setRememberThis] = useState(true);

  // Reference item for proportional scaling
  const [scaleReference, setScaleReference] = useState(null);

  // Local saved extras state
  const [localExtras, setLocalExtras] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  });

  // Query database-backed extras for this user
  const { data: remoteExtrasData } = useQuery({
    queryKey: ["user-extras", userId],
    queryFn: async () => {
      try {
        const res = await mealChartApi.getUserExtras();
        return res.data?.data?.extras || [];
      } catch (_) {
        return [];
      }
    },
    enabled: open && Boolean(userId),
    staleTime: 60 * 1000,
  });

  // Synchronize local storage when userId changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setLocalExtras(JSON.parse(raw));
    } catch (_) {}
  }, [storageKey]);

  // Combined, deduplicated list of user's past extras
  const userExtras = useMemo(() => {
    const map = new Map();

    // 1. First add local extras
    for (const item of localExtras) {
      if (item && item.name) {
        map.set(item.name.toLowerCase().trim(), item);
      }
    }

    // 2. Merge with remote extras (remote preserves server truth)
    if (remoteExtrasData && Array.isArray(remoteExtrasData)) {
      for (const item of remoteExtrasData) {
        if (item && item.name) {
          const key = item.name.toLowerCase().trim();
          if (!map.has(key)) {
            map.set(key, item);
          }
        }
      }
    }

    return Array.from(map.values());
  }, [localExtras, remoteExtrasData]);

  // Set default tab based on whether user has past extras
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      if (userExtras.length > 0) {
        setActiveTab("saved");
      } else {
        setActiveTab("popular");
      }
    }
  }, [open, userExtras.length]);

  // Save an item to user's personal extras memory
  const saveToMemory = (item) => {
    try {
      const trimmedName = item.name.trim();
      const updatedItem = {
        name: trimmedName,
        quantity: Number(item.quantity) || 100,
        unit: item.unit || "g",
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fats: Number(item.fats) || 0,
        lastUsedAt: new Date().toISOString(),
      };

      setLocalExtras((prev) => {
        const filtered = prev.filter(
          (ex) => ex.name.toLowerCase().trim() !== trimmedName.toLowerCase()
        );
        const nextList = [updatedItem, ...filtered].slice(0, 50); // Keep latest 50
        try {
          localStorage.setItem(storageKey, JSON.stringify(nextList));
        } catch (_) {}
        return nextList;
      });
    } catch (_) {}
  };

  // Remove an item from user's memory
  const removeFromMemory = (foodName, e) => {
    e.stopPropagation();
    haptics.warning();
    setLocalExtras((prev) => {
      const nextList = prev.filter(
        (ex) => ex.name.toLowerCase().trim() !== foodName.toLowerCase().trim()
      );
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextList));
      } catch (_) {}
      return nextList;
    });
  };

  // 1-Tap Instant Quick Log
  const handleQuickAdd = (food) => {
    haptics.eaten();
    saveToMemory(food);
    onAddExtra({
      mealId,
      item: {
        ...food,
        isUnplanned: true,
        eaten: true,
      },
    });
  };

  // Select item into the custom form for editing / portion adjustment
  const handleSelectForCustom = (food) => {
    haptics.tick();
    setFormData({
      name: food.name,
      quantity: food.quantity,
      unit: food.unit || "g",
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
    });
    setScaleReference({ ...food });
    setActiveTab("custom");
  };

  // Scale portion and macros proportionally
  const handleScaleQuantity = (multiplier) => {
    haptics.tick();
    setFormData((prev) => {
      const ref = scaleReference || prev;
      const baseQty = Number(ref.quantity) || 100;
      const newQty = Math.max(1, Math.round(Number(prev.quantity) * multiplier));
      const ratio = baseQty > 0 ? newQty / baseQty : 1;

      return {
        ...prev,
        quantity: newQty,
        calories: Math.round(Number(ref.calories || 0) * ratio),
        protein: Number((Number(ref.protein || 0) * ratio).toFixed(1)),
        carbs: Number((Number(ref.carbs || 0) * ratio).toFixed(1)),
        fats: Number((Number(ref.fats || 0) * ratio).toFixed(1)),
      };
    });
  };

  const handleStepQuantity = (delta) => {
    haptics.tick();
    setFormData((prev) => {
      const ref = scaleReference || prev;
      const baseQty = Number(ref.quantity) || 100;
      const newQty = Math.max(1, (Number(prev.quantity) || 0) + delta);
      const ratio = baseQty > 0 ? newQty / baseQty : 1;

      return {
        ...prev,
        quantity: newQty,
        calories: Math.round(Number(ref.calories || 0) * ratio),
        protein: Number((Number(ref.protein || 0) * ratio).toFixed(1)),
        carbs: Number((Number(ref.carbs || 0) * ratio).toFixed(1)),
        fats: Number((Number(ref.fats || 0) * ratio).toFixed(1)),
      };
    });
  };

  // Submit custom form
  const handleCustomSubmit = (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) return;

    haptics.eaten();
    if (rememberThis) {
      saveToMemory(formData);
    }

    onAddExtra({
      mealId,
      item: {
        ...formData,
        isUnplanned: true,
        eaten: true,
      },
    });
  };

  // Filtered lists based on search query
  const filteredSavedExtras = useMemo(() => {
    if (!searchQuery.trim()) return userExtras;
    const q = searchQuery.toLowerCase().trim();
    return userExtras.filter((item) => item.name.toLowerCase().includes(q));
  }, [userExtras, searchQuery]);

  const filteredPopular = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_STAPLES;
    const q = searchQuery.toLowerCase().trim();
    return POPULAR_STAPLES.filter((item) => item.name.toLowerCase().includes(q));
  }, [searchQuery]);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Add Extra Diet to ${mealName}`}
      description="Quickly pick from your past eaten foods, popular staples, or custom log."
    >
      <div className="space-y-4 pb-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your past extras or staples..."
            className="w-full min-h-[44px] pl-10 pr-9 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-400 dark:focus:ring-violet-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3-Tab Segmented Header */}
        <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs font-black">
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setActiveTab("saved");
            }}
            className={`min-h-[40px] px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "saved"
                ? "bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-400 shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">My Extras</span>
            {userExtras.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-violet-100 dark:bg-violet-950/70 text-violet-800 dark:text-violet-300">
                {userExtras.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setActiveTab("popular");
            }}
            className={`min-h-[40px] px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "popular"
                ? "bg-white dark:bg-slate-900 text-lime-700 dark:text-lime-400 shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Zap className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span className="truncate">Staples</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setActiveTab("custom");
            }}
            className={`min-h-[40px] px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "custom"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 shrink-0 text-slate-500" />
            <span className="truncate">Custom</span>
          </button>
        </div>

        {/* Tab 1: User's Saved Extras (Remembered Foods) */}
        {activeTab === "saved" && (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-0.5">
            {filteredSavedExtras.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                <Bookmark className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {searchQuery ? "No matching extras found" : "No saved extras yet"}
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Every extra food you log is automatically saved here so you can re-log it in 1 tap!
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("popular")}
                    className="px-3.5 py-1.5 text-xs font-black rounded-xl bg-lime-500 text-slate-950 hover:bg-lime-600 transition-colors"
                  >
                    Browse Staples
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("custom")}
                    className="px-3.5 py-1.5 text-xs font-black rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    Add Custom Food
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  <span>Your Previous Extras ({filteredSavedExtras.length})</span>
                  <span>1-Tap Log or Customize</span>
                </div>

                {filteredSavedExtras.map((extra, idx) => (
                  <motion.div
                    key={extra.name + idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 transition-all flex items-center justify-between gap-3 shadow-xs"
                  >
                    {/* Food Info */}
                    <div
                      onClick={() => handleSelectForCustom(extra)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {extra.name}
                        </span>
                        <span className="text-[11px] font-extrabold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200/60">
                          {extra.calories} kcal
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 tabular-nums">
                        <span className="font-semibold">
                          {extra.quantity} {extra.unit}
                        </span>
                        <span>·</span>
                        <span className="text-violet-600 font-bold">{extra.protein}g P</span>
                        <span>·</span>
                        <span className="text-amber-600 font-bold">{extra.carbs}g C</span>
                        <span>·</span>
                        <span className="text-rose-600 font-bold">{extra.fats}g F</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        title="Quick Log to Meal"
                        disabled={isAdding}
                        onClick={() => handleQuickAdd(extra)}
                        className="min-h-[38px] px-3 rounded-xl bg-lime-500 hover:bg-lime-600 text-slate-950 text-xs font-black flex items-center gap-1 shadow-xs transition-transform active:scale-95 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Log</span>
                      </button>

                      <button
                        type="button"
                        title="Edit Portion"
                        onClick={() => handleSelectForCustom(extra)}
                        className="min-h-[38px] min-w-[38px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        title="Remove from saved"
                        onClick={(e) => removeFromMemory(extra.name, e)}
                        className="min-h-[38px] min-w-[38px] rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Popular Staples */}
        {activeTab === "popular" && (
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Popular Fitness Foods (Tap to pick or log)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
              {filteredPopular.map((staple, idx) => (
                <div
                  key={staple.name + idx}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-xs hover:border-lime-400 transition-colors"
                >
                  <div
                    onClick={() => handleSelectForCustom(staple)}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {staple.name}
                    </div>
                    <div className="text-[11px] text-slate-500 tabular-nums">
                      {staple.quantity} {staple.unit} · {staple.calories} kcal · {staple.protein}g P
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={isAdding}
                      onClick={() => handleQuickAdd(staple)}
                      className="min-h-[34px] px-2.5 rounded-xl bg-lime-100 hover:bg-lime-200 dark:bg-lime-900/40 text-lime-900 dark:text-lime-300 text-[11px] font-extrabold flex items-center gap-1 transition-transform active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Log</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectForCustom(staple)}
                      className="min-h-[34px] px-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 text-[11px] font-bold"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Custom Form with Proportional Scaling */}
        {activeTab === "custom" && (
          <form onSubmit={handleCustomSubmit} className="space-y-3 pt-1">
            {/* Food Name */}
            <div>
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1">
                Food Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Protein Shake / Sourdough Bread / Almonds"
                className="w-full min-h-[46px] text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3.5 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            {/* Quantity, Unit & Quick Step Multipliers */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1">
                    Portion Quantity
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full min-h-[46px] text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3.5 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="g / ml / scoops / pcs"
                    className="w-full min-h-[46px] text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3.5 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
              </div>

              {/* Quick Stepper Buttons for Mobile-First Ease */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                  Adjust:
                </span>
                {[-50, -10, 10, 50].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => handleStepQuantity(step)}
                    className="min-h-[32px] px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 shrink-0"
                  >
                    {step > 0 ? `+${step}` : step}
                  </button>
                ))}
                {[0.5, 1.5, 2].map((mult) => (
                  <button
                    key={mult}
                    type="button"
                    onClick={() => handleScaleQuantity(mult)}
                    className="min-h-[32px] px-2 rounded-xl bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 text-[11px] font-extrabold text-violet-700 dark:text-violet-300 shrink-0 border border-violet-200/50"
                  >
                    {mult}x
                  </button>
                ))}
              </div>
            </div>

            {/* Nutrients: Calories, Protein, Carbs, Fats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {[
                { key: "calories", label: "Calories", color: "text-slate-700 dark:text-slate-300", unit: "kcal" },
                { key: "protein", label: "Protein", color: "text-violet-700 dark:text-violet-400", unit: "g" },
                { key: "carbs", label: "Carbs", color: "text-amber-700 dark:text-amber-400", unit: "g" },
                { key: "fats", label: "Fats", color: "text-rose-700 dark:text-rose-400", unit: "g" },
              ].map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className={`text-[11px] font-black block leading-none ${field.color}`}>
                    {field.label} ({field.unit})
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={formData[field.key]}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.key]: Number(e.target.value) })
                    }
                    className="w-full min-h-[44px] text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
              ))}
            </div>

            {/* Remember Checkbox */}
            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberThis}
                onChange={(e) => setRememberThis(e.target.checked)}
                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-400 rounded-md"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Remember this extra in "My Extras" for 1-tap future logging
              </span>
            </label>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="violet"
              isLoading={isAdding}
              disabled={!formData.name.trim()}
              className="w-full min-h-[48px] text-sm font-black rounded-2xl shadow-sm mt-2"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add &amp; Log Extra Food
            </Button>
          </form>
        )}
      </div>
    </Sheet>
  );
};

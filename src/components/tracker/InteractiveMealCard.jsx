import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Check,
  CheckCheck,
  Ban,
  Edit2,
  Plus,
  Sparkles,
  Flame,
  Award,
} from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { haptics } from "../../motion/Haptics";
import confetti from "canvas-confetti";

export const InteractiveMealCard = ({
  meal,
  mealIndex = 0,
  isFuture = false,
  onTickItem,
  onTickMeal,
  onOpenEditQuantity,
  onOpenSkipModal,
  onOpenAddExtra,
  isTickingItem = false,
  isTickingMeal = false,
}) => {
  const mealId = meal.mealId || meal._id;
  const items = meal.plannedFoodItems || [];
  const eatenCount = items.filter((it) => it.eaten).length;
  const isAllEaten = items.length > 0 && eatenCount === items.length;
  const isPartial = eatenCount > 0 && !isAllEaten;
  const isSkipped = meal.status === "skipped";
  const totalMealKcal = Math.round(items.reduce((s, it) => s + (it.calories || 0), 0));
  const totalMealProtein = Math.round(items.reduce((s, it) => s + (it.protein || 0), 0));

  // Local state for floating point celebration popups
  const [activeFloaters, setActiveFloaters] = useState([]);

  // Trigger floating calorie particle
  const spawnFloater = (itemId, text, isPositive) => {
    const id = Date.now() + Math.random();
    setActiveFloaters((prev) => [...prev, { id, itemId, text, isPositive }]);
    setTimeout(() => {
      setActiveFloaters((prev) => prev.filter((f) => f.id !== id));
    }, 1200);
  };

  const handleToggleItem = (item) => {
    if (isFuture || isSkipped || isTickingItem) return;

    const itemId = item.itemId || item._id;
    const nextEaten = !item.eaten;

    if (nextEaten) {
      haptics.eaten();
      spawnFloater(itemId, `+${Math.round(item.calories || 0)} kcal`, true);

      // If this check completes the entire meal, fire a celebratory micro-burst!
      if (items.length > 1 && eatenCount + 1 === items.length) {
        try {
          confetti({
            particleCount: 25,
            spread: 50,
            origin: { y: 0.7 },
            colors: ["#84CC16", "#10B981", "#6366F1"],
          });
        } catch (_) {}
      }
    } else {
      haptics.tick();
      spawnFloater(itemId, `-${Math.round(item.calories || 0)} kcal`, false);
    }

    onTickItem({
      mealId,
      itemId,
      eaten: nextEaten,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: mealIndex * 0.05 }}
      layout
    >
      <GlassCard
        className={`relative overflow-hidden p-4 sm:p-5 rounded-3xl border transition-all duration-300 ${
          isAllEaten
            ? "bg-lime-50/80 dark:bg-lime-950/20 border-lime-300 dark:border-lime-700/80 shadow-md shadow-lime-500/10 ring-1 ring-lime-400/30"
            : isSkipped
            ? "bg-slate-50/90 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75"
            : isPartial
            ? "bg-white dark:bg-slate-900 border-violet-200 dark:border-violet-900/70 shadow-xs"
            : "bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300"
        }`}
      >
        {/* Subtle decorative highlight when all eaten */}
        {isAllEaten && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/10 rounded-full blur-2xl pointer-events-none" />
        )}

        {/* Meal Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                {meal.mealName}
              </h3>

              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3 text-slate-400" />
                {meal.scheduledTime || "08:00"}
              </span>

              {isAllEaten && (
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-lime-500 text-slate-950 inline-flex items-center gap-1 shadow-xs"
                >
                  <Sparkles className="w-3 h-3" /> ALL EATEN
                </motion.span>
              )}

              {isSkipped && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  SKIPPED
                </span>
              )}
            </div>

            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums flex items-center gap-2">
              <span className={eatenCount > 0 ? "text-lime-700 dark:text-lime-400 font-bold" : ""}>
                {eatenCount}/{items.length} items logged
              </span>
              <span>·</span>
              <span>{totalMealKcal} kcal</span>
              <span>·</span>
              <span className="text-violet-600 dark:text-violet-400 font-bold">{totalMealProtein}g P</span>
            </div>
          </div>

          {/* Action Buttons: Tick All, Skip, Undo */}
          <div className="flex items-center gap-2 shrink-0">
            {!isSkipped && !isAllEaten && (
              <motion.button
                whileTap={{ scale: 0.94 }}
                type="button"
                disabled={isFuture || isTickingMeal}
                onClick={() => {
                  haptics.eaten();
                  onTickMeal({ mealId, status: "eaten" });
                }}
                className="min-h-[40px] px-3.5 text-xs font-black rounded-xl bg-lime-100 hover:bg-lime-200 dark:bg-lime-950/60 dark:hover:bg-lime-900/80 text-lime-900 dark:text-lime-300 border border-lime-300/80 dark:border-lime-700 transition-colors disabled:opacity-40 cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tick All</span>
              </motion.button>
            )}

            {!isSkipped && (
              <motion.button
                whileTap={{ scale: 0.94 }}
                type="button"
                onClick={() => {
                  haptics.tick();
                  onOpenSkipModal({ mealId, mealName: meal.mealName });
                }}
                className="min-h-[40px] px-3 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5 text-slate-400" />
                <span>Skip</span>
              </motion.button>
            )}

            {isSkipped && (
              <motion.button
                whileTap={{ scale: 0.94 }}
                type="button"
                disabled={isTickingMeal}
                onClick={() => {
                  haptics.tick();
                  onTickMeal({ mealId, status: "pending" });
                }}
                className="min-h-[40px] px-3.5 text-xs font-black rounded-xl bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 cursor-pointer"
              >
                Undo Skip
              </motion.button>
            )}
          </div>
        </div>

        {/* Checkable Food Item Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 pt-1">
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
                className="relative py-2.5 flex items-center justify-between gap-2.5 group transition-colors rounded-2xl px-1 hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
              >
                {/* Floating Calorie Burst */}
                <AnimatePresence>
                  {activeFloaters
                    .filter((f) => f.itemId === itemId)
                    .map((f) => (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 1, y: 0, scale: 0.8 }}
                        animate={{ opacity: 0, y: -28, scale: 1.15 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`absolute left-10 -top-1 pointer-events-none z-30 font-black text-xs px-2 py-0.5 rounded-full shadow-sm ${
                          f.isPositive
                            ? "bg-lime-500 text-slate-950"
                            : "bg-slate-800 text-slate-200"
                        }`}
                      >
                        {f.text}
                      </motion.div>
                    ))}
                </AnimatePresence>

                {/* 48x48px Thumb Hit Target for Checkmark */}
                <motion.button
                  whileTap={{ scale: 0.82 }}
                  whileHover={{ scale: 1.05 }}
                  type="button"
                  aria-label={`Mark ${item.name} as ${isChecked ? "not eaten" : "eaten"}`}
                  disabled={isFuture || isSkipped || isTickingItem}
                  onClick={() => handleToggleItem(item)}
                  className="w-11 h-11 -ml-1 flex items-center justify-center shrink-0 rounded-2xl cursor-pointer disabled:opacity-40"
                >
                  <motion.span
                    animate={
                      isChecked
                        ? { scale: [1, 1.25, 1], rotate: [0, 6, 0] }
                        : { scale: 1, rotate: 0 }
                    }
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                      isChecked
                        ? "bg-lime-500 text-slate-950 shadow-sm shadow-lime-500/30 ring-2 ring-lime-400/40"
                        : "bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-transparent hover:border-lime-500"
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </motion.span>
                </motion.button>

                {/* Food Details & Portion Info */}
                <button
                  type="button"
                  onClick={() => onOpenEditQuantity(mealId, item)}
                  className="flex-1 min-w-0 text-left py-1 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-sm leading-snug transition-all ${
                        isChecked
                          ? "text-slate-900 dark:text-white font-black line-through decoration-lime-500/80 decoration-2 opacity-90"
                          : "text-slate-800 dark:text-slate-100 font-extrabold"
                      }`}
                    >
                      {item.name}
                    </span>

                    {item.isUnplanned && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60">
                        EXTRA
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums flex items-center gap-1.5 flex-wrap">
                    {qtyChanged ? (
                      <span className="text-slate-700 dark:text-slate-300 font-bold">
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
                    <span>·</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {Math.round(item.calories || 0)} kcal
                    </span>
                    <span>·</span>
                    <span className="text-violet-600 dark:text-violet-400 font-bold">
                      {item.protein}g P
                    </span>
                  </div>
                </button>

                {/* Edit Portion Trigger */}
                <div className="shrink-0 flex items-center gap-1">
                  {isChecked && item.eatenAt && (
                    <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                      {new Date(item.eatenAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    title={`Edit portion for ${item.name}`}
                    onClick={() => onOpenEditQuantity(mealId, item)}
                    className="min-h-[40px] min-w-[40px] rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Extra Food Trigger Row */}
        <div className="pt-2.5 mt-1 border-t border-slate-100 dark:border-slate-800">
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => {
              haptics.tick();
              onOpenAddExtra(mealId, meal.mealName);
            }}
            className="w-full min-h-[44px] px-3.5 rounded-2xl bg-violet-50/80 dark:bg-violet-950/40 hover:bg-violet-100/90 dark:hover:bg-violet-900/50 border border-dashed border-violet-300 dark:border-violet-700/80 text-xs font-black text-violet-700 dark:text-violet-300 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="w-5 h-5 rounded-full bg-violet-200/70 dark:bg-violet-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>Add Extra Food Eaten to {meal.mealName}</span>
          </motion.button>
        </div>
      </GlassCard>
    </motion.div>
  );
};

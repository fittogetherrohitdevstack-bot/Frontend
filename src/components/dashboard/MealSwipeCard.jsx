import React, { useState } from "react";
import { motion, useMotionValue } from "motion/react";
import { useDrag } from "@use-gesture/react";
import { Check, X, Clock, UtensilsCrossed } from "lucide-react";
import { haptics } from "../../motion/Haptics";

/**
 * MealSwipeCard
 * Mobile-first swipeable card for Light Theme:
 * - Swipe right (> 80px) to mark EATEN (lime glow + check pop + haptic)
 * - Swipe left (< -80px) to mark SKIPPED
 * - Direct tap buttons for quick accessibility
 */
export const MealSwipeCard = ({ meal, onStatusChange, isUpdating = false }) => {
  const [swiped, setSwiped] = useState(null);
  const x = useMotionValue(0);

  const bind = useDrag(
    ({ down, movement: [mx], velocity }) => {
      if (isUpdating) return;

      const vx = Array.isArray(velocity) ? velocity[0] : typeof velocity === "number" ? velocity : 0;
      const trigger = Math.abs(mx) > 90 || (Math.abs(vx) > 0.6 && Math.abs(mx) > 40);

      if (!down && trigger) {
        if (mx > 0) {
          haptics.eaten();
          setSwiped("eaten");
          onStatusChange(meal.mealId || meal._id, "eaten");
        } else {
          haptics.tick();
          setSwiped("skipped");
          onStatusChange(meal.mealId || meal._id, "skipped");
        }
      }

      x.set(down ? mx : 0);
    },
    { axis: "x", rubberband: true }
  );

  const isEaten = meal.status === "eaten";
  const isSkipped = meal.status === "skipped";

  const items = meal.plannedFoodItems || meal.actualFoodItems || [];
  const mealCals = items.reduce((sum, f) => sum + (f.calories || 0), 0);
  const mealPro = items.reduce((sum, f) => sum + (f.protein || 0), 0);

  return (
    <div className="relative rounded-3xl overflow-hidden select-none shadow-xs">
      {/* Background swipe reveal lanes */}
      <div className="absolute inset-0 flex items-center justify-between px-6 rounded-3xl pointer-events-none bg-slate-100/90">
        {/* Left reveal: Skipped (Rose) */}
        <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
          <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center">
            <X className="w-4 h-4 stroke-[3]" />
          </div>
          <span>Skip</span>
        </div>

        {/* Right reveal: Eaten (Lime) */}
        <div className="flex items-center gap-2 text-lime-700 font-bold text-xs uppercase tracking-wider ml-auto">
          <span>Eaten</span>
          <div className="w-8 h-8 rounded-full bg-lime-100 border border-lime-400 flex items-center justify-center">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
        </div>
      </div>

      {/* Foreground Draggable Card */}
      <motion.div
        {...bind()}
        style={{ x }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className={`relative z-10 p-4 sm:p-5 rounded-3xl backdrop-blur-xl border transition-all duration-300 touch-pan-y ${
          isEaten
            ? "bg-lime-50/90 border-lime-300/90 shadow-[0_4px_20px_rgba(132,204,22,0.18)]"
            : isSkipped
            ? "bg-rose-50/80 border-rose-200/90 opacity-80"
            : "bg-white/95 border-slate-200/90 hover:border-slate-300 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            {/* Meal Check / Status Icon */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              type="button"
              onClick={() => {
                const nextStatus = isEaten ? "pending" : "eaten";
                if (nextStatus === "eaten") haptics.eaten();
                else haptics.tick();
                onStatusChange(meal.mealId || meal._id, nextStatus);
              }}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer ${
                isEaten
                  ? "bg-gradient-to-tr from-[#84CC16] to-[#65A30D] text-white shadow-md shadow-lime-500/30"
                  : isSkipped
                  ? "bg-rose-100 text-rose-600 border border-rose-300"
                  : "bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-lime-500"
              }`}
            >
              {isEaten ? (
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <motion.path
                    d="M5 13l4 4L19 7"
                    fill="transparent"
                    strokeWidth="3.5"
                    stroke="#FFFFFF"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </svg>
              ) : isSkipped ? (
                <X className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <UtensilsCrossed className="w-5 h-5 stroke-[2]" />
              )}
            </motion.button>

            {/* Meal Details */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4
                  className={`font-bold text-sm sm:text-base tracking-tight truncate ${
                    isEaten ? "text-slate-500 line-through decoration-lime-600" : "text-slate-900"
                  }`}
                >
                  {meal.mealName || "Meal"}
                </h4>
                {meal.scheduledTime && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 shrink-0">
                    <Clock className="w-3 h-3 text-lime-600" />
                    {meal.scheduledTime}
                  </span>
                )}
              </div>

              {/* Items summary */}
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {items.length > 0
                  ? items.map((f) => f.name).join(", ")
                  : "No items specified"}
              </p>

              {/* Macro badges */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] font-black text-lime-700 bg-lime-100 px-2 py-0.5 rounded-full border border-lime-200">
                  {mealCals} kcal
                </span>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                  {mealPro}g pro
                </span>
              </div>
            </div>
          </div>

          {/* Quick Skip or Undo Button */}
          <div className="flex items-center gap-1 shrink-0">
            {isSkipped || isEaten ? (
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => onStatusChange(meal.mealId || meal._id, "pending")}
                className="text-[10px] font-bold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 cursor-pointer"
              >
                Reset
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => {
                  haptics.tick();
                  onStatusChange(meal.mealId || meal._id, "skipped");
                }}
                className="text-[10px] font-bold text-slate-500 hover:text-rose-600 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-rose-50 border border-slate-200 cursor-pointer transition-colors"
              >
                Skip
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MealSwipeCard;

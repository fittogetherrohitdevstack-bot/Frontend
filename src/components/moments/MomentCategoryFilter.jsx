import React from "react";
import { motion } from "motion/react";
import { haptics } from "../../motion/Haptics";

export const MOMENT_CATEGORIES_CONFIG = [
  { id: "all", label: "All Moments", emoji: "✨" },
  { id: "gym", label: "Gym", emoji: "💪" },
  { id: "cheat_meal", label: "Cheat Meal", emoji: "🍕" },
  { id: "funny", label: "Funny", emoji: "😂" },
  { id: "achievement", label: "Achievement", emoji: "🏆" },
  { id: "squad", label: "Squad", emoji: "👥" },
  { id: "daily", label: "Daily Life", emoji: "🌿" },
];

export const MomentCategoryFilter = ({
  activeCategory = "all",
  onSelectCategory,
  categoryCounts = {},
}) => {
  return (
    <div className="w-full overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
      <div className="flex items-center gap-2 min-w-max">
        {MOMENT_CATEGORIES_CONFIG.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count = categoryCounts[cat.id];

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                haptics.tick();
                onSelectCategory(cat.id);
              }}
              className={`relative min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer select-none flex items-center gap-1.5 border ${
                isActive
                  ? "bg-slate-900 text-lime-400 border-slate-900 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="text-sm">{cat.emoji}</span>
              <span>{cat.label}</span>
              {typeof count === "number" && count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive
                      ? "bg-lime-400/20 text-lime-300"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

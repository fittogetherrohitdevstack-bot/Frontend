import React from "react";

export const MacroProgress = ({
  current = 0,
  target = 2000,
  label = "Calories",
  unit = "kcal",
  color = "emerald",
}) => {
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  const colorClasses = {
    emerald: "bg-lime-500",
    blue: "bg-cyan-500",
    amber: "bg-amber-500",
    purple: "bg-purple-500",
    rose: "bg-rose-500",
  };

  const textClasses = {
    emerald: "text-lime-700",
    blue: "text-cyan-700",
    amber: "text-amber-700",
    purple: "text-purple-700",
    rose: "text-rose-700",
  };

  return (
    <div className="flex-1 bg-white/90 border border-slate-200/90 rounded-2xl p-3 flex flex-col justify-between shadow-xs">
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>{label}</span>
        <span className="font-bold text-slate-900">{percent}%</span>
      </div>

      <div className="my-2">
        <div className="w-full h-2 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-300 ${colorClasses[color] || colorClasses.emerald}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="flex items-baseline justify-between text-xs">
        <span className={`font-black ${textClasses[color] || textClasses.emerald}`}>
          {current} <span className="text-[10px] text-slate-400 font-normal">{unit}</span>
        </span>
        <span className="text-[11px] text-slate-400">
          / {target} {unit}
        </span>
      </div>
    </div>
  );
};

export default MacroProgress;

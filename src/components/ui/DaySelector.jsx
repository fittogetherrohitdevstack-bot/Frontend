import React from "react";

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DaySelector = ({ selectedDay, onSelectDay, activeDaysWithMeals = [] }) => {
  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-1.5 py-0.5">
      {[0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
        const isSelected = selectedDay === dayNum;
        const hasMeals = activeDaysWithMeals.includes(dayNum);

        return (
          <button
            key={dayNum}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelectDay(dayNum)}
            className={`min-h-[52px] sm:min-h-[56px] w-full flex flex-col items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-150 select-none cursor-pointer ${
              isSelected
                ? "bg-lime-500 text-white font-extrabold shadow-md shadow-lime-500/25 ring-2 ring-lime-500/30"
                : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs"
            }`}
          >
            <span className="text-[11px] sm:text-xs uppercase tracking-wider font-bold">{DAYS_SHORT[dayNum]}</span>
            <div className="mt-1 flex items-center justify-center">
              {hasMeals ? (
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? "bg-white" : "bg-lime-500"
                  }`}
                />
              ) : (
                <div className="w-1.5 h-1.5" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default DaySelector;

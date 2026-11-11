import React from "react";

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DaySelector = ({ selectedDay, onSelectDay, activeDaysWithMeals = [] }) => {
  return (
    <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-2 scrollbar-none py-1">
      {[0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
        const isSelected = selectedDay === dayNum;
        const hasMeals = activeDaysWithMeals.includes(dayNum);

        return (
          <button
            key={dayNum}
            type="button"
            onClick={() => onSelectDay(dayNum)}
            className={`flex-1 min-w-[44px] min-h-[56px] flex flex-col items-center justify-center rounded-2xl transition-all duration-150 select-none cursor-pointer ${
              isSelected
                ? "bg-lime-500 text-white font-extrabold shadow-md shadow-lime-500/25 scale-105"
                : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs"
            }`}
          >
            <span className="text-xs uppercase tracking-wider font-bold">{DAYS_SHORT[dayNum]}</span>
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

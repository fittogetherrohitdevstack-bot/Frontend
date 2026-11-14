import React from "react";
import { Camera, Sparkles, Plus } from "lucide-react";
import { haptics } from "../../motion/Haptics";

export const MomentsEmptyState = ({ category = "all", onOpenComposer }) => {
  return (
    <div className="bg-white/90 border border-slate-200/90 rounded-3xl p-8 sm:p-12 text-center shadow-sm space-y-4 max-w-lg mx-auto">
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-lime-400/20 via-emerald-400/20 to-teal-400/20 border border-lime-300 flex items-center justify-center mx-auto shadow-sm">
        <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-lime-700" />
        <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-lime-400 text-slate-950 flex items-center justify-center text-xs font-black shadow-xs">
          ✨
        </span>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
          {category === "all" ? "No Squad Moments Yet" : `No ${category.replace("_", " ")} moments yet`}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          {category === "all"
            ? "Your squad feed is waiting for its first post! Share your gym pump, cheat meal, or funny moment."
            : "No posts in this category yet. Be the trendsetter and post the first one!"}
        </p>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            haptics.tick();
            onOpenComposer();
          }}
          className="min-h-[46px] px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-lime-300 text-xs font-black inline-flex items-center gap-2 shadow-lg shadow-slate-900/15 active:scale-95 transition-all cursor-pointer"
        >
          <Camera className="w-4 h-4 text-lime-400" />
          <span>Share the First Moment</span>
        </button>
      </div>
    </div>
  );
};

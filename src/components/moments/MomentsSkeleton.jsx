import React from "react";

export const MomentsSkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="bg-white/90 border border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-3 animate-pulse"
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-28 bg-slate-200 rounded-md" />
              <div className="h-2.5 w-16 bg-slate-100 rounded-md" />
            </div>
          </div>

          {/* Photo Canvas */}
          <div className="w-full aspect-square sm:aspect-[4/3] rounded-2xl bg-slate-200" />

          {/* Interaction Bar */}
          <div className="flex items-center gap-2 pt-1">
            <div className="h-9 w-20 bg-slate-200 rounded-2xl" />
            <div className="h-9 w-20 bg-slate-200 rounded-2xl" />
          </div>

          {/* Caption */}
          <div className="space-y-1 pt-1">
            <div className="h-3 w-3/4 bg-slate-200 rounded-md" />
            <div className="h-3 w-1/2 bg-slate-100 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};

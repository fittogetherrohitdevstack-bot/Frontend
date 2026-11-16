import React from "react";
import { ArrowLeft, Users, Flame, Info } from "lucide-react";
import { haptics } from "../../motion/Haptics";

export const ChatHeader = ({ squad, onlineCount = 0, onBack, onOpenInfo }) => {
  if (!squad) return null;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3.5 sm:px-5 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              onBack();
            }}
            className="p-1.5 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 lg:hidden"
            aria-label="Back to Squads"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Squad Avatar with Initials */}
        <div
          onClick={onOpenInfo}
          className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-lime-400 via-emerald-500 to-teal-600 p-0.5 shadow-md shadow-emerald-500/15 shrink-0 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center font-black text-white text-sm tracking-wider">
            {squad.name?.slice(0, 2).toUpperCase() || "SQ"}
          </div>
          {onlineCount > 0 && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 ring-2 ring-emerald-400/30" />
          )}
        </div>

        {/* Squad Title & Presence */}
        <div className="min-w-0 cursor-pointer" onClick={onOpenInfo}>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate tracking-tight">
              {squad.name}
            </h2>
            {squad.currentStreak > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-[10px] font-black shrink-0">
                <Flame className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                {squad.currentStreak}d
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium truncate">
            {onlineCount > 0 ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {onlineCount} {onlineCount === 1 ? "member" : "members"} online
                </span>
                <span>•</span>
              </>
            ) : null}
            <span>{squad.totalMembers || "Squad"} members</span>
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            haptics.tick();
            onOpenInfo();
          }}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
          title="Squad Info & Members"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

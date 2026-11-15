import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Trophy,
  UtensilsCrossed,
  Droplets,
  Dumbbell,
  Scale,
  Ruler,
  Camera,
  Flame,
  Award,
  AlertTriangle,
  Snowflake,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { haptics } from "../../motion/Haptics";

export const SquadPointsInfoSheet = ({ isOpen, onClose }) => {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center sm:items-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer"
        />

        {/* Sheet / Modal */}
        <motion.div
          initial={{ y: "100%", opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0.8 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full sm:max-w-xl max-h-[88vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Mobile Drag Handle */}
          <div className="pt-3 pb-1 flex justify-center sm:hidden">
            <div className="w-12 h-1.5 rounded-full bg-slate-300" />
          </div>

          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  How Points &amp; Penalties Work
                </h3>
                <p className="text-xs text-slate-500 font-medium truncate">
                  Consistency XP system &amp; leaderboard rules
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                haptics.tick();
                onClose();
              }}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 text-slate-800">
            {/* Overview Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-lime-50 via-emerald-50 to-teal-50 border border-lime-200/80">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-lime-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  XP
                </div>
                <div className="text-xs text-slate-700 leading-relaxed font-medium">
                  <span className="font-bold text-slate-900">Rankings reflect pure consistency</span> — never weight lost.
                  Show up every day, fuel properly, stay hydrated, and train to climb the podium!
                </div>
              </div>
            </div>

            {/* 1. Points Awarded Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  Daily Habit Rewards (Earn Points)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Meals */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-lime-100 text-lime-700 flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">Meal Logging</p>
                      <p className="text-[11px] text-slate-500 truncate">Pro-rated eaten meals</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-lime-700 bg-lime-100/90 px-2.5 py-1 rounded-full shrink-0">
                    Up to +40 XP
                  </span>
                </div>

                {/* Workout */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <Dumbbell className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">Workout / Rest Day</p>
                      <p className="text-[11px] text-slate-500 truncate">Session or active recovery</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-purple-700 bg-purple-100/90 px-2.5 py-1 rounded-full shrink-0">
                    +30 XP
                  </span>
                </div>

                {/* Water */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">Hydration Goal</p>
                      <p className="text-[11px] text-slate-500 truncate">Hit daily target ml</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-cyan-700 bg-cyan-100/90 px-2.5 py-1 rounded-full shrink-0">
                    +15 XP
                  </span>
                </div>

                {/* Weigh-in */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">Weigh-in Log</p>
                      <p className="text-[11px] text-slate-500 truncate">Morning weight check</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-indigo-700 bg-indigo-100/90 px-2.5 py-1 rounded-full shrink-0">
                    +10 XP
                  </span>
                </div>

                {/* Measurements */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                      <Ruler className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">Body Measurements</p>
                      <p className="text-[11px] text-slate-500 truncate">Weekly waist/chest tape</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-teal-700 bg-teal-100/90 px-2.5 py-1 rounded-full shrink-0">
                    +15 XP
                  </span>
                </div>

                {/* Photos */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">Photo Check-in</p>
                      <p className="text-[11px] text-slate-500 truncate">Progress physique photos</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-pink-700 bg-pink-100/90 px-2.5 py-1 rounded-full shrink-0">
                    +20 XP
                  </span>
                </div>

                {/* Streak Bonus */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">Daily Streak Bonus</p>
                      <p className="text-[11px] text-slate-500 truncate">+5 XP/day (capped at +50)</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-orange-700 bg-orange-100/90 px-2.5 py-1 rounded-full shrink-0">
                    +5 / day
                  </span>
                </div>

                {/* Challenges */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">Squad Challenges</p>
                      <p className="text-[11px] text-slate-500 truncate">Conquering group quests</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-700 bg-amber-100/90 px-2.5 py-1 rounded-full shrink-0">
                    +50–100 XP
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Deductions / Penalties Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-800">
                  Habit Deductions &amp; Penalties (Missed Days)
                </h4>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/90 space-y-2.5">
                <p className="text-xs text-rose-900 font-medium leading-relaxed">
                  To keep squad competition honest, missing core habits on completed days deducts XP points from your weekly leaderboard score:
                </p>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-white border border-rose-200/80 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        Missed Meals (0 meals logged)
                      </span>
                    </div>
                    <span className="text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full shrink-0">
                      -15 XP
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-rose-200/80 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Droplets className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        Missed Water (no water intake logged)
                      </span>
                    </div>
                    <span className="text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full shrink-0">
                      -10 XP
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-rose-200/80 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Dumbbell className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        Missed Daily Exercise (no workout or rest log)
                      </span>
                    </div>
                    <span className="text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full shrink-0">
                      -15 XP
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Fair Play & Streak Freeze Protection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-blue-800">
                  Fair Play &amp; Streak Freeze Protection
                </h4>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Snowflake className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-blue-950">Streak Freeze Protection</h5>
                    <p className="text-[11px] text-blue-800 font-medium mt-0.5 leading-relaxed">
                      If you activated your weekly streak freeze on a day you were away or unwell, that day is completely shielded from habit penalties!
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-emerald-950">Instant Retroactive Revoke</h5>
                    <p className="text-[11px] text-emerald-800 font-medium mt-0.5 leading-relaxed">
                      Forgot to log yesterday? As soon as you log your meals, water, or workout retroactively, the penalty is automatically erased and positive XP is awarded.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900">Zero Score Floor</h5>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-relaxed">
                      Your total score on the leaderboard will never drop below 0 XP. Penalties adjust your relative position without negative totals.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0">
            <button
              type="button"
              onClick={() => {
                haptics.tick();
                onClose();
              }}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2 rounded-2xl bg-slate-900 text-white font-extrabold text-xs hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
            >
              Got It
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

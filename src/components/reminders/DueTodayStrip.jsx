import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reminderApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";
import {
  BellRing,
  Scale,
  Ruler,
  Camera,
  Target,
  Clock,
  SkipForward,
  SlidersHorizontal,
  ArrowUpRight,
} from "lucide-react";

const TYPE_META = {
  daily_weight: {
    Icon: Scale,
    bg: "bg-indigo-50 border-indigo-200 text-indigo-900",
    iconColor: "text-indigo-600",
  },
  weekly_measurements: {
    Icon: Ruler,
    bg: "bg-violet-50 border-violet-200 text-violet-900",
    iconColor: "text-violet-600",
  },
  biweekly_photos: {
    Icon: Camera,
    bg: "bg-sky-50 border-sky-200 text-sky-900",
    iconColor: "text-sky-600",
  },
  weekly_target: {
    Icon: Target,
    bg: "bg-amber-50 border-amber-200 text-amber-900",
    iconColor: "text-amber-600",
  },
};

export const DueTodayStrip = ({ className = "" }) => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [expandedType, setExpandedType] = useState(null);

  const { data } = useQuery({
    queryKey: ["reminders-due"],
    queryFn: async () => {
      const res = await reminderApi.getDue();
      return res.data?.data;
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: ({ type, minutes }) => reminderApi.snooze({ type, minutes }),
    onSuccess: (res) => {
      haptics.tick();
      toast.success(res.data?.message || "Reminder snoozed");
      setExpandedType(null);
      queryClient.invalidateQueries({ queryKey: ["reminders-due"] });
    },
  });

  const skipMutation = useMutation({
    mutationFn: ({ type, periodKey }) => reminderApi.skip({ type, periodKey }),
    onSuccess: () => {
      haptics.tick();
      toast.success("Skipped for this check-in window");
      setExpandedType(null);
      queryClient.invalidateQueries({ queryKey: ["reminders-due"] });
    },
  });

  const enabled = Boolean(data?.enabled ?? profile?.featureFlags?.reminders);
  const items = data?.items || [];

  if (!enabled || items.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-3xl bg-white/95 border border-slate-200/90 p-3.5 sm:p-4 shadow-xs space-y-2.5 ${className}`}
      aria-label="Due today check-ins"
    >
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-lime-100 text-lime-700 border border-lime-200 flex items-center justify-center shrink-0">
            <BellRing className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight truncate">
              Due today ({items.length})
            </h2>
          </div>
        </div>

        <Link
          to="/settings/reminders"
          onClick={() => haptics.tick()}
          className="inline-flex items-center gap-1 min-h-[44px] px-2.5 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>Schedule</span>
        </Link>
      </div>

      {/* Horizontal / Responsive Chips */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {items.map((item) => {
            const meta = TYPE_META[item.type] || TYPE_META.daily_weight;
            const ItemIcon = meta.Icon;
            const isExpanded = expandedType === item.type;

            return (
              <motion.div
                key={`${item.type}_${item.periodKey}`}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className="flex flex-col gap-1.5 w-full sm:w-auto"
              >
                <div
                  className={`flex items-center justify-between gap-2 rounded-2xl border px-3 py-1.5 min-h-[44px] transition-all ${meta.bg}`}
                >
                  <Link
                    to={item.route}
                    onClick={() => haptics.tick()}
                    className="flex items-center gap-2 min-w-0 flex-1 py-1"
                  >
                    <ItemIcon className={`w-4 h-4 shrink-0 ${meta.iconColor}`} />
                    <span className="text-xs font-extrabold truncate">
                      {item.shortLabel}
                    </span>
                    {item.status === "overdue" && (
                      <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                        Overdue
                      </span>
                    )}
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-70 shrink-0" />
                  </Link>

                  <button
                    type="button"
                    aria-label={`Snooze or skip ${item.shortLabel}`}
                    onClick={() => {
                      haptics.tick();
                      setExpandedType(isExpanded ? null : item.type);
                    }}
                    className="min-w-[44px] min-h-[44px] rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 cursor-pointer shrink-0"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="flex items-center gap-1.5 px-1">
                    <button
                      type="button"
                      disabled={snoozeMutation.isPending}
                      onClick={() =>
                        snoozeMutation.mutate({
                          type: item.type,
                          minutes: item.defaultSnoozeMinutes || 60,
                        })
                      }
                      className="flex-1 min-h-[44px] px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Clock className="w-3 h-3" /> Snooze {item.defaultSnoozeMinutes || 60}m
                    </button>
                    <button
                      type="button"
                      disabled={skipMutation.isPending}
                      onClick={() =>
                        skipMutation.mutate({
                          type: item.type,
                          periodKey: item.periodKey,
                        })
                      }
                      className="flex-1 min-h-[44px] px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <SkipForward className="w-3 h-3" /> Skip this time
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DueTodayStrip;

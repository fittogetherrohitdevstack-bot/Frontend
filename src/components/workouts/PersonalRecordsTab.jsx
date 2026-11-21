import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { workoutApi } from "../../api/endpoints";
import { GlassCard } from "../ui/GlassCard";
import { Skeleton } from "../ui/Skeleton";
import { Trophy, Sparkles, TrendingUp, Calendar, Search, Award } from "lucide-react";
import { motion } from "motion/react";

export const PersonalRecordsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: recordsData, isLoading } = useQuery({
    queryKey: ["personal-records-full"],
    queryFn: async () => {
      const res = await workoutApi.getRecords();
      return res.data?.data?.records || [];
    },
  });

  const filtered = (recordsData || []).filter((pr) =>
    pr.exerciseName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500 fill-amber-400" /> Personal Records Trophy Cabinet
          </h2>
          <p className="text-xs text-slate-500">
            Automatically detected peak lifts, maximum repetitions, and estimated 1-Rep Maxes
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-8 text-center bg-white/95 border-slate-200">
          <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
          <h3 className="font-extrabold text-slate-800 text-sm">No personal records yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Complete workout sets with weight and reps to automatically unlock and track your PRs!
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((pr) => (
            <motion.div
              key={pr._id}
              whileHover={{ y: -2 }}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                    {pr.primaryMuscle || "Strength"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {pr.achievedAt ? new Date(pr.achievedAt).toLocaleDateString() : ""}
                  </span>
                </div>

                <h3 className="font-black text-slate-900 text-sm line-clamp-1">
                  {pr.exerciseName}
                </h3>

                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-100">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">
                      Max Weight
                    </span>
                    <span className="text-base font-black text-amber-700">
                      {pr.bestWeight} kg
                    </span>
                    <span className="text-[10px] text-slate-500 block">× {pr.bestReps} reps</span>
                  </div>

                  <div className="p-2 rounded-xl bg-purple-50/60 border border-purple-100">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">
                      Est. 1RM *
                    </span>
                    <span className="text-base font-black text-purple-700">
                      ~{pr.estimatedOneRepMax || pr.bestWeight} kg
                    </span>
                    <span className="text-[10px] text-slate-400 block">Epley Model</span>
                  </div>
                </div>
              </div>

              {pr.history && pr.history.length > 1 && (
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Progression History ({pr.history.length} PRs)
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {pr.history.slice(-4).map((h, hIdx) => (
                      <span
                        key={hIdx}
                        className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-mono font-bold text-slate-700 shrink-0"
                      >
                        {h.weight}kg × {h.reps}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Note about 1RM calculation */}
      <p className="text-[11px] text-slate-400 italic text-center pt-2">
        * Estimated 1-Rep Max (1RM) is calculated using the validated Epley formula: Weight × (1 + Reps / 30).
        It provides a safe estimation of maximal strength without requiring risky 1-rep maximum attempts.
      </p>
    </div>
  );
};

export default PersonalRecordsTab;

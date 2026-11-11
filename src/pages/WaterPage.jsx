import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { progressApi } from "../api/endpoints";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Droplets, Plus, Trash2, Award } from "lucide-react";
import confetti from "canvas-confetti";
import { haptics } from "../motion/Haptics";
import { toast } from "sonner";

export const WaterPage = () => {
  const queryClient = useQueryClient();
  const [customAmount, setCustomAmount] = useState("");

  const { data: waterData, isLoading } = useQuery({
    queryKey: ["today-water"],
    queryFn: async () => {
      const res = await progressApi.getTodayWater();
      return res.data?.data;
    },
  });

  const { data: historyData } = useQuery({
    queryKey: ["water-history"],
    queryFn: async () => {
      const res = await progressApi.getWaterHistory();
      return res.data?.data?.history || [];
    },
  });

  const addWaterMutation = useMutation({
    mutationFn: (amountMl) => progressApi.addWater({ amountMl }),
    onSuccess: (res, amount) => {
      queryClient.invalidateQueries({ queryKey: ["today-water"] });
      queryClient.invalidateQueries({ queryKey: ["water-history"] });
      queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["group-dashboard"] });
      haptics.goal();
      toast.success(`+${amount} ml logged! 💧`);
      if (res.data?.data?.percent >= 100) {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      }
      setCustomAmount("");
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId) => progressApi.deleteWaterEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-water"] });
      queryClient.invalidateQueries({ queryKey: ["water-history"] });
      queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] });
      haptics.tick();
      toast("Water entry removed");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const totalConsumed = waterData?.totalConsumed || 0;
  const targetMl = waterData?.targetMl || 3000;
  const percent = waterData?.percent || 0;
  const entries = waterData?.entries || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-slate-900">
      {/* Hydration Main Card */}
      <GlassCard glow="cyan" className="bg-white/95 text-center py-6 sm:py-8">
        <div className="inline-flex items-center gap-2 text-cyan-700 bg-cyan-100/70 px-3 py-1 rounded-full border border-cyan-200 mb-2">
          <Droplets className="w-4 h-4 fill-cyan-500" />
          <span className="text-xs uppercase font-extrabold tracking-wider">Hydration Tracker</span>
        </div>

        {/* Big Circular Ring Progress */}
        <div className="relative w-48 h-48 mx-auto my-4 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              className="text-slate-100"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              className="text-cyan-500 transition-all duration-700 ease-out"
              strokeWidth="10"
              strokeDasharray={264}
              strokeDashoffset={264 - (264 * Math.min(100, percent)) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          <div className="absolute flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {totalConsumed}
            </span>
            <span className="text-xs text-slate-500 font-bold">/ {targetMl} ml</span>
            <span className="text-xs font-black text-cyan-700 mt-1">{percent}% Target</span>
          </div>
        </div>

        {percent >= 100 ? (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-lime-100 border border-lime-300 text-lime-800 text-xs font-extrabold shadow-xs">
            <Award className="w-4 h-4" /> Daily Hydration Goal Hit (+15 pts)!
          </div>
        ) : (
          <p className="text-xs text-slate-500 font-medium">
            {targetMl - totalConsumed} ml left to reach today's target.
          </p>
        )}

        {/* 1-Tap Quick Action Buttons (min 44px) */}
        <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto mt-6">
          <Button
            size="md"
            variant="secondary"
            className="flex-col min-h-[56px] text-xs"
            isLoading={addWaterMutation.isPending}
            onClick={() => addWaterMutation.mutate(250)}
          >
            <span className="font-extrabold text-cyan-700">+250 ml</span>
            <span className="text-[10px] text-slate-500">Glass</span>
          </Button>
          <Button
            size="md"
            variant="secondary"
            className="flex-col min-h-[56px] text-xs"
            isLoading={addWaterMutation.isPending}
            onClick={() => addWaterMutation.mutate(500)}
          >
            <span className="font-extrabold text-cyan-700">+500 ml</span>
            <span className="text-[10px] text-slate-500">Bottle</span>
          </Button>
          <Button
            size="md"
            variant="secondary"
            className="flex-col min-h-[56px] text-xs"
            isLoading={addWaterMutation.isPending}
            onClick={() => addWaterMutation.mutate(1000)}
          >
            <span className="font-extrabold text-cyan-700">+1000 ml</span>
            <span className="text-[10px] text-slate-500">Large Jug</span>
          </Button>
        </div>

        {/* Custom amount form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (Number(customAmount) > 0) addWaterMutation.mutate(Number(customAmount));
          }}
          className="flex items-center gap-2 max-w-sm mx-auto mt-4"
        >
          <input
            type="number"
            inputMode="numeric"
            placeholder="Custom ml (e.g. 350)"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="flex-1 min-h-[46px] px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
          />
          <Button type="submit" variant="cyan" size="md" className="min-h-[46px]">
            <Plus className="w-4 h-4 mr-1 stroke-[3]" /> Add
          </Button>
        </form>
      </GlassCard>

      {/* Today's Intake Entries Timeline */}
      <GlassCard className="bg-white/95">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
          Today's Logs ({entries.length})
        </h3>

        {entries.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center font-medium">No water logged yet today.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const time = new Date(entry.consumedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <div
                  key={entry._id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900">{entry.amountMl} ml</span>
                      <span className="text-xs text-slate-500 ml-2 font-medium">{time}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteEntryMutation.mutate(entry._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default WaterPage;

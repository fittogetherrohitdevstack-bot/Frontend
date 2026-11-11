import React, { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { weeklyTargetApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { Sheet } from "../ui/Sheet";
import { Button } from "../ui/Button";
import { Switch } from "../ui/Switch";
import { haptics } from "../../motion/Haptics";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Minus,
  Plus,
  Sparkles,
  Info,
  Repeat,
  Ruler,
  Scale,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const round2 = (n) => Math.round(n * 100) / 100;

export const SetWeeklyTargetSheet = ({
  open,
  onOpenChange,
  weekStart,
  currentTarget,
  targetDefaults,
  currentWeightKg = 70,
}) => {
  const queryClient = useQueryClient();
  const { profile, refreshUser } = useAuth();

  const refWeight =
    typeof currentWeightKg === "number" && currentWeightKg >= 20
      ? currentWeightKg
      : profile?.currentWeight || 70;

  const [rateKg, setRateKg] = useState(-0.3);
  const [weighInsTarget, setWeighInsTarget] = useState(5);
  const [useWaistTarget, setUseWaistTarget] = useState(false);
  const [waistChangeCm, setWaistChangeCm] = useState(-0.5);
  const [carryOver, setCarryOver] = useState(true);
  const [note, setNote] = useState("");
  const [source, setSource] = useState("manual");
  const [suggestBanner, setSuggestBanner] = useState(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSuggestBanner(null);
    if (currentTarget) {
      setRateKg(
        currentTarget.weightChangeKgPerWeek !== null &&
          currentTarget.weightChangeKgPerWeek !== undefined
          ? currentTarget.weightChangeKgPerWeek
          : 0
      );
      setWeighInsTarget(currentTarget.weighInsTarget || 5);
      const hasWaist =
        currentTarget.waistChangeCm !== null && currentTarget.waistChangeCm !== undefined;
      setUseWaistTarget(hasWaist);
      setWaistChangeCm(hasWaist ? currentTarget.waistChangeCm : -0.5);
      setCarryOver(Boolean(targetDefaults?.enabled ?? true));
      setNote(currentTarget.note || "");
      setSource(currentTarget.source || "manual");
    } else if (targetDefaults && targetDefaults.weightChangeKgPerWeek !== null) {
      setRateKg(targetDefaults.weightChangeKgPerWeek);
      setWeighInsTarget(targetDefaults.weighInsTarget || 5);
      const hasWaist =
        targetDefaults.waistChangeCm !== null && targetDefaults.waistChangeCm !== undefined;
      setUseWaistTarget(hasWaist);
      setWaistChangeCm(hasWaist ? targetDefaults.waistChangeCm : -0.5);
      setCarryOver(Boolean(targetDefaults.enabled));
      setNote(targetDefaults.note || "");
      setSource("manual");
    } else {
      // Neutral starting value aligned smoothly with goal direction without auto-suggesting extremes
      const goal = profile?.fitnessGoal || "maintenance";
      if (goal === "fat_loss") setRateKg(-0.4);
      else if (goal === "muscle_gain") setRateKg(0.25);
      else setRateKg(0);
      setWeighInsTarget(5);
      setUseWaistTarget(false);
      setWaistChangeCm(-0.5);
      setCarryOver(true);
      setNote("");
      setSource("manual");
    }
  }, [open, currentTarget, targetDefaults, profile?.fitnessGoal]);

  // Live guardrail feedback (non-blocking informational guidance)
  const guardrail = useMemo(() => {
    const maxLoss = round2(refWeight * 0.01);
    const maxGain = 0.5;
    if (rateKg < 0 && Math.abs(rateKg) > maxLoss + 0.001) {
      return {
        isAggressive: true,
        message: `Losing more than ~1% of your body weight per week (~${maxLoss} kg/wk) is an aggressive pace and may be harder to sustain. Informational pace guidance only, not medical advice.`,
      };
    }
    if (rateKg > maxGain + 0.001) {
      return {
        isAggressive: true,
        message: `Gaining more than ~0.5 kg/week is faster than typical lean pacing. Consider a steadier surplus if preferred. Informational guidance only, not medical advice.`,
      };
    }
    return { isAggressive: false, message: null };
  }, [rateKg, refWeight]);

  const saveMutation = useMutation({
    mutationFn: (payload) => weeklyTargetApi.upsertWeekly(payload),
    onSuccess: async () => {
      haptics.goal();
      toast.success("Weekly target updated! 🎯");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["weekly-target"] }),
        queryClient.invalidateQueries({ queryKey: ["weekly-targets-history"] }),
        queryClient.invalidateQueries({ queryKey: ["weight-summary"] }),
        refreshUser(),
      ]);
      onOpenChange(false);
    },
    onError: (err) => {
      haptics.warning();
      toast.error(err.response?.data?.message || "Could not save weekly target");
    },
  });

  const handleStepRate = (delta) => {
    haptics.tick();
    setSource("manual");
    setSuggestBanner(null);
    setRateKg((prev) => {
      const next = round2(Math.max(-2.5, Math.min(2.0, prev + delta)));
      return Object.is(next, -0) ? 0 : next;
    });
  };

  const handleSuggestOne = async () => {
    haptics.selection();
    setIsSuggesting(true);
    try {
      const res = await weeklyTargetApi.suggest();
      const s = res.data?.data?.suggestion;
      if (s) {
        setRateKg(s.weightChangeKgPerWeek);
        setWeighInsTarget(s.weighInsTarget || 5);
        setSource("suggested");
        setSuggestBanner(s.disclaimer);
      }
    } catch (err) {
      toast.error("Could not generate conservative suggestion");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      week: weekStart,
      weightChangeKgPerWeek: rateKg,
      weighInsTarget,
      waistChangeCm: useWaistTarget ? waistChangeCm : null,
      note: note.trim(),
      source,
      carryOver,
    });
  };

  const formatSignedKg = (val) => {
    if (val === 0) return "0.0 kg";
    return `${val > 0 ? "+" : "−"}${Math.abs(val).toFixed(2).replace(/\.00$/, ".0")} kg`;
  };

  const paceSubtitle =
    rateKg < -0.01
      ? "Gradual weekly average fat loss"
      : rateKg > 0.01
      ? "Lean weekly average gain"
      : "Maintain steady weekly average";

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Set Weekly Target"
      description={
        weekStart
          ? `Week of ${weekStart} (Mon–Sun). Tracked via weekly average weight.`
          : "Choose a calm, sustainable pace for your weekly average weight."
      }
    >
      <form onSubmit={handleSave} className="space-y-5 pt-1 pb-4" data-vaul-no-drag>
        {/* 1. Weekly Weight Rate Stepper */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Weekly Avg Change Target
              </span>
            </div>
            <button
              type="button"
              onClick={handleSuggestOne}
              disabled={isSuggesting}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 shadow-xs cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isSuggesting ? "Calculating..." : "Suggest one"}</span>
            </button>
          </div>

          <AnimatePresence>
            {suggestBanner && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-start gap-2"
              >
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-bold">Conservative Estimate:</strong> {suggestBanner}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Big Stepper Controls (min 44px touch targets) */}
          <div className="flex items-center justify-between gap-3">
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              aria-label="Decrease weekly target by 0.1 kg"
              onClick={() => handleStepRate(-0.1)}
              className="w-12 h-12 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center shadow-xs cursor-pointer"
            >
              <Minus className="w-5 h-5 stroke-[2.5]" />
            </motion.button>

            <div className="text-center flex-1 min-w-0">
              <div className="text-3xl font-black text-slate-900 tabular-nums tracking-tight">
                {formatSignedKg(rateKg)}
                <span className="text-sm font-bold text-slate-500"> / wk</span>
              </div>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{paceSubtitle}</p>
            </div>

            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              aria-label="Increase weekly target by 0.1 kg"
              onClick={() => handleStepRate(0.1)}
              className="w-12 h-12 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center shadow-xs cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </motion.button>
          </div>

          {/* Preset Pace Chips */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { val: -0.5, label: "−0.5 kg" },
              { val: -0.25, label: "−0.25 kg" },
              { val: 0, label: "Maintain" },
              { val: 0.25, label: "+0.25 kg" },
            ].map((p) => {
              const active = Math.abs(rateKg - p.val) < 0.01;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    haptics.tick();
                    setSource("manual");
                    setSuggestBanner(null);
                    setRateKg(p.val);
                  }}
                  className={`min-h-[40px] px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    active
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Informational Healthy Guardrail Warning */}
          <AnimatePresence>
            {guardrail.isAggressive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                role="status"
                className="p-3 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs flex items-start gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-snug">{guardrail.message}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Weekly Weigh-Ins Target */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-extrabold text-slate-800 block">
              Weigh-Ins Goal This Week
            </span>
            <span className="text-[11px] text-slate-500">
              3+ weigh-ins smooths noise; 5+ is ideal
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              aria-label="Decrease weigh-ins target"
              onClick={() => {
                haptics.tick();
                setWeighInsTarget((v) => Math.max(1, v - 1));
              }}
              className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-black text-base text-slate-900 tabular-nums">
              {weighInsTarget}d
            </span>
            <button
              type="button"
              aria-label="Increase weigh-ins target"
              onClick={() => {
                haptics.tick();
                setWeighInsTarget((v) => Math.min(7, v + 1));
              }}
              className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. Optional Waist Change Target */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-violet-600" />
              <div>
                <span className="text-xs font-extrabold text-slate-800 block">
                  Optional Waist Target (cm / wk)
                </span>
                <span className="text-[11px] text-slate-500">
                  Track alongside weekly tape check-in
                </span>
              </div>
            </div>
            <Switch
              id="toggle-waist-target"
              checked={useWaistTarget}
              onCheckedChange={setUseWaistTarget}
            />
          </div>

          {useWaistTarget && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
              <button
                type="button"
                aria-label="Decrease waist target"
                onClick={() => {
                  haptics.tick();
                  setWaistChangeCm((v) => round2(Math.max(-3.0, v - 0.25)));
                }}
                className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-black text-lg text-slate-900 tabular-nums">
                {waistChangeCm > 0 ? `+${waistChangeCm}` : waistChangeCm} cm / wk
              </span>
              <button
                type="button"
                aria-label="Increase waist target"
                onClick={() => {
                  haptics.tick();
                  setWaistChangeCm((v) => round2(Math.min(3.0, v + 0.25)));
                }}
                className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 4. Carry Over Every Week Switch */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <label htmlFor="carry-over-switch" className="text-xs font-extrabold text-slate-800 block cursor-pointer">
                Carry over every week
              </label>
              <span className="text-[11px] text-slate-500">
                Automatically start each Monday with this default target
              </span>
            </div>
          </div>

          <Switch
            id="carry-over-switch"
            checked={carryOver}
            onCheckedChange={setCarryOver}
          />
        </div>

        {/* 5. Optional Note */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Focus Note (Optional)
          </label>
          <input
            type="text"
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., Prioritize 8k steps & consistent morning weigh-ins"
            className="w-full min-h-[44px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
        </div>

        <Button
          type="submit"
          isLoading={saveMutation.isPending}
          className="w-full min-h-[48px] text-sm font-extrabold shadow-md"
        >
          <CheckCircle2 className="w-4 h-4" /> Save Weekly Target
        </Button>
      </form>
    </Sheet>
  );
};

export default SetWeeklyTargetSheet;

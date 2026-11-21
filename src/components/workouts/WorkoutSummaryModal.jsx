import React, { useState, useEffect } from "react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import {
  Trophy,
  Flame,
  Clock,
  Dumbbell,
  Layers,
  Sparkles,
  Share2,
  CheckCircle2,
  X,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { haptics } from "../../motion/Haptics";

export const WorkoutSummaryModal = ({
  summaryData,
  open,
  onClose,
  onShareToFeed,
  isSharing,
}) => {
  const [caption, setCaption] = useState("");
  const [hasShared, setHasShared] = useState(false);

  useEffect(() => {
    if (open) {
      haptics.goal();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#84CC16", "#7C3AED", "#06B6D4", "#F59E0B"],
      });
    }
  }, [open]);

  if (!open || !summaryData) return null;

  const {
    durationMinutes = 0,
    totalVolumeKg = 0,
    totalReps = 0,
    caloriesBurned = 0,
    targetMuscles = [],
    newPersonalRecords = [],
  } = summaryData;

  const handleShare = () => {
    haptics.selection();
    onShareToFeed(caption, () => {
      setHasShared(true);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-auto"
      >
        {/* Celebration Header */}
        <div className="text-center space-y-1.5 relative">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-500 to-lime-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20">
            <Trophy className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Workout Completed! 🎉
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Outstanding session! You earned <strong className="text-purple-700">+30 habit points</strong> and
            solidified your squad streak.
          </p>
        </div>

        {/* PR Achievements if detected */}
        {newPersonalRecords.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-800">
              <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>NEW PERSONAL RECORDS CRUSHED ({newPersonalRecords.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {newPersonalRecords.map((pr, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 rounded-xl bg-white border border-amber-200 text-xs font-extrabold text-amber-900 shadow-2xs"
                >
                  🏆 {pr.exerciseName}: {pr.bestWeight} kg ({pr.metric})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4 Key Summary Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 text-center">
            <Clock className="w-4 h-4 text-purple-600 mx-auto mb-1" />
            <span className="text-[10px] font-black uppercase text-slate-400 block">Duration</span>
            <span className="text-base font-black text-slate-900">{durationMinutes}m</span>
          </div>

          <div className="p-3 rounded-2xl bg-lime-50/70 border border-lime-200 text-center">
            <Dumbbell className="w-4 h-4 text-lime-700 mx-auto mb-1" />
            <span className="text-[10px] font-black uppercase text-slate-400 block">Volume</span>
            <span className="text-base font-black text-slate-900">{totalVolumeKg} kg</span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 text-center">
            <Flame className="w-4 h-4 text-amber-600 mx-auto mb-1" />
            <span className="text-[10px] font-black uppercase text-slate-400 block">Est. Calories</span>
            <span className="text-base font-black text-slate-900">~{caloriesBurned}</span>
          </div>

          <div className="p-3 rounded-2xl bg-cyan-50/70 border border-cyan-100 text-center">
            <Layers className="w-4 h-4 text-cyan-700 mx-auto mb-1" />
            <span className="text-[10px] font-black uppercase text-slate-400 block">Total Reps</span>
            <span className="text-base font-black text-slate-900">{totalReps}</span>
          </div>
        </div>

        {/* Muscles Trained */}
        {targetMuscles.length > 0 && (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
              Muscle Groups Targeted
            </span>
            <div className="flex flex-wrap gap-1">
              {targetMuscles.map((m) => (
                <span
                  key={m}
                  className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Optional Squad Social Sharing */}
        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-purple-700" />
            <span className="text-xs font-black text-purple-900">
              Share Achievement to Squad Feed (Optional)
            </span>
          </div>

          {!hasShared ? (
            <>
              <input
                type="text"
                placeholder="Add a hype caption (e.g., Felt strong on squats today!)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-xs rounded-xl bg-white border border-purple-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <Button
                size="sm"
                variant="secondary"
                isLoading={isSharing}
                onClick={handleShare}
                className="w-full text-xs font-bold min-h-[44px] justify-center"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" /> Post to Squad Activity Feed
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-100 p-2.5 rounded-xl border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Shared to your squad! Your team can now view and react.</span>
            </div>
          )}
        </div>

        {/* Done / Close Button */}
        <Button
          onClick={() => {
            haptics.tick();
            onClose();
          }}
          className="w-full min-h-[46px] font-black shadow-md justify-center"
        >
          Done
        </Button>
      </motion.div>
    </div>
  );
};

export default WorkoutSummaryModal;

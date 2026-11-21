import React from "react";
import { Sheet } from "../ui/Sheet";
import { Button } from "../ui/Button";
import {
  Dumbbell,
  AlertTriangle,
  Lightbulb,
  Repeat,
  Heart,
  Layers,
  Sparkles,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { haptics } from "../../motion/Haptics";

export const ExerciseDetailSheet = ({
  exercise,
  open,
  onOpenChange,
  onToggleFavorite,
  onStartWithExercise,
}) => {
  if (!exercise) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={exercise.name}
      description={exercise.category ? `${exercise.category} • ${exercise.primaryMuscle}` : exercise.primaryMuscle}
    >
      <div className="space-y-5 pb-6">
        {/* Quick Badges Header */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-extrabold text-xs border border-purple-200">
            {exercise.primaryMuscle}
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
            {exercise.equipment || "Barbell"}
          </span>
          <span
            className={`px-3 py-1 rounded-full font-bold text-xs border ${
              exercise.difficulty === "Advanced"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : exercise.difficulty === "Intermediate"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {exercise.difficulty || "Intermediate"}
          </span>

          <button
            type="button"
            onClick={() => {
              haptics.tick();
              onToggleFavorite?.(exercise._id);
            }}
            className={`ml-auto min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
              exercise.isFavorite
                ? "bg-rose-50 border-rose-200 text-rose-600"
                : "bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-500"
            }`}
            title="Toggle Favorite"
          >
            <Heart className={`w-4 h-4 ${exercise.isFavorite ? "fill-rose-500" : ""}`} />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          {exercise.description}
        </p>

        {/* Secondary Muscles */}
        {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Secondary Muscles Recruited
            </span>
            <div className="flex flex-wrap gap-1.5">
              {exercise.secondaryMuscles.map((m) => (
                <span
                  key={m}
                  className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Step-by-Step Instructions */}
        {exercise.instructions && exercise.instructions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instructions
            </h4>
            <div className="space-y-2">
              {exercise.instructions.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 text-xs text-slate-700"
                >
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center shrink-0 text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed font-medium">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Common Mistakes */}
        {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Common Mistakes
            </h4>
            <ul className="space-y-1.5 list-none">
              {exercise.commonMistakes.map((mistake, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-rose-900/90 bg-rose-50/70 p-2.5 rounded-xl border border-rose-100"
                >
                  <span className="text-rose-500 font-bold shrink-0">•</span>
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Coaching Tips */}
        {exercise.tips && exercise.tips.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" /> Pro Tips
            </h4>
            <div className="space-y-1.5">
              {exercise.tips.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 font-medium"
                >
                  💡 {tip}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alternatives */}
        {exercise.alternatives && exercise.alternatives.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Repeat className="w-4 h-4 text-slate-500" /> Exercise Alternatives
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {exercise.alternatives.map((alt) => (
                <span
                  key={alt}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200"
                >
                  {alt}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Action Button */}
        {onStartWithExercise && (
          <div className="pt-2">
            <Button
              className="w-full min-h-[46px] font-bold shadow-md justify-center"
              onClick={() => {
                haptics.goal();
                onStartWithExercise(exercise);
              }}
            >
              <Dumbbell className="w-4 h-4 mr-2" /> Start Workout With This Exercise
            </Button>
          </div>
        )}
      </div>
    </Sheet>
  );
};

export default ExerciseDetailSheet;

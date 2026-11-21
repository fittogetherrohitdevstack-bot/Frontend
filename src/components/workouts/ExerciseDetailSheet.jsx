import React from "react";
import { Sheet } from "../ui/Sheet";
import { Button } from "../ui/Button";
import { ExerciseMedia } from "./ExerciseMedia";
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
  Wind,
  Plus,
  Play,
  Share2,
} from "lucide-react";
import { haptics } from "../../motion/Haptics";

export const ExerciseDetailSheet = ({
  exercise,
  open,
  onOpenChange,
  onToggleFavorite,
  onStartWithExercise,
  onAddToPlan,
  similarExercises = [],
  onSelectSimilar,
}) => {
  if (!exercise) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={exercise.name}
      description={
        exercise.category
          ? `${exercise.category} • ${exercise.primaryMuscle} • ${exercise.equipment}`
          : `${exercise.primaryMuscle} • ${exercise.equipment}`
      }
    >
      <div className="space-y-5 pb-8">
        {/* Large Video / GIF Demonstration Player */}
        <ExerciseMedia
          exercise={exercise}
          autoPlay={true}
          showControls={true}
          aspectRatio="aspect-video"
          className="shadow-sm border-slate-200"
        />

        {/* Quick Badges & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-black text-xs border border-purple-200">
            {exercise.primaryMuscle}
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
            {exercise.equipment || "Barbells"}
          </span>
          <span
            className={`px-3 py-1 rounded-full font-bold text-xs border ${
              exercise.difficulty === "Advanced"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : exercise.difficulty === "Beginner"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {exercise.difficulty || "Intermediate"}
          </span>

          {exercise.category && (
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
              {exercise.category}
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              haptics.tick();
              onToggleFavorite?.(exercise._id);
            }}
            className={`ml-auto min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
              exercise.isFavorite
                ? "bg-rose-50 border-rose-200 text-rose-600 shadow-2xs"
                : "bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-500"
            }`}
            title="Toggle Favorite"
          >
            <Heart className={`w-4 h-4 ${exercise.isFavorite ? "fill-rose-500" : ""}`} />
          </button>
        </div>

        {/* Alternative Names */}
        {exercise.alternativeNames && exercise.alternativeNames.length > 0 && (
          <div className="text-xs text-slate-500">
            <span className="font-bold text-slate-700">Also known as: </span>
            <span>{exercise.alternativeNames.join(", ")}</span>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          {exercise.description}
        </p>

        {/* Secondary Muscles */}
        {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
              Secondary Muscles Recruited
            </span>
            <div className="flex flex-wrap gap-1.5">
              {exercise.secondaryMuscles.map((m) => (
                <span
                  key={m}
                  className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Breathing Instructions */}
        {exercise.breathingInstructions && (
          <div className="p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-200 text-xs text-cyan-950 flex items-start gap-2.5">
            <Wind className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-black uppercase tracking-wider text-[10px] text-cyan-800 block mb-0.5">
                Breathing Technique
              </span>
              <p className="font-medium leading-relaxed">{exercise.breathingInstructions}</p>
            </div>
          </div>
        )}

        {/* Form Cues */}
        {exercise.formCues && exercise.formCues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" /> Key Form Cues
            </h4>
            <div className="grid grid-cols-1 gap-1.5">
              {exercise.formCues.map((cue, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-purple-950 font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                  <span>{cue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step-by-Step Instructions */}
        {exercise.instructions && exercise.instructions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Step-by-Step Instructions
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

        {/* Similar Exercises */}
        {similarExercises && similarExercises.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Repeat className="w-4 h-4 text-purple-600" /> Similar Exercises
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {similarExercises.map((sim) => (
                <div
                  key={sim._id}
                  onClick={() => onSelectSimilar?.(sim)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <span className="text-xs font-bold text-slate-900 truncate block">
                    {sim.name}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {sim.primaryMuscle} • {sim.equipment}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attribution & Copyright Footer */}
        {exercise.attribution && (
          <p className="text-[10px] text-slate-400 italic text-center pt-2 border-t border-slate-100">
            {exercise.attribution}
          </p>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {onStartWithExercise && (
            <Button
              className="w-full min-h-[46px] font-black shadow-md justify-center"
              onClick={() => {
                haptics.goal();
                onStartWithExercise(exercise);
              }}
            >
              <Play className="w-4 h-4 mr-2 fill-current" /> Start Workout With This Exercise
            </Button>
          )}

          {onAddToPlan && (
            <Button
              variant="secondary"
              className="w-full min-h-[44px] font-bold justify-center text-xs"
              onClick={() => {
                haptics.selection();
                onAddToPlan(exercise);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add to Workout Plan
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  );
};

export default ExerciseDetailSheet;

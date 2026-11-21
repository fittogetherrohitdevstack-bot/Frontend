import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workoutApi } from "../../api/endpoints";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import { ExerciseDetailSheet } from "./ExerciseDetailSheet";
import {
  Search,
  Filter,
  Heart,
  Dumbbell,
  Sparkles,
  ChevronRight,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

const MUSCLE_GROUPS = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Legs",
  "Abs",
  "Full Body",
];

const EQUIPMENT_OPTIONS = ["All", "Barbell", "Dumbbell", "Cable", "Machine", "Bodyweight", "Kettlebell"];

const DIFFICULTY_OPTIONS = ["All", "Beginner", "Intermediate", "Advanced"];

export const ExerciseLibraryTab = ({ onStartWorkoutWithExercise }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("All");
  const [selectedEquipment, setSelectedEquipment] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Query exercises with server-side filters
  const { data: exercisesData, isLoading } = useQuery({
    queryKey: [
      "workout-exercises",
      selectedMuscle,
      selectedEquipment,
      selectedDifficulty,
      favoritesOnly,
      searchTerm,
    ],
    queryFn: async () => {
      const res = await workoutApi.getExercises({
        muscle: selectedMuscle !== "All" ? selectedMuscle : undefined,
        equipment: selectedEquipment !== "All" ? selectedEquipment : undefined,
        difficulty: selectedDifficulty !== "All" ? selectedDifficulty : undefined,
        favoritesOnly: favoritesOnly ? "true" : undefined,
        search: searchTerm || undefined,
      });
      return res.data?.data?.exercises || [];
    },
  });

  // Favorite toggle mutation
  const favoriteMutation = useMutation({
    mutationFn: (exerciseId) => workoutApi.toggleFavoriteExercise(exerciseId),
    onSuccess: (res, exerciseId) => {
      queryClient.setQueryData(
        [
          "workout-exercises",
          selectedMuscle,
          selectedEquipment,
          selectedDifficulty,
          favoritesOnly,
          searchTerm,
        ],
        (old = []) =>
          old.map((ex) =>
            ex._id === exerciseId ? { ...ex, isFavorite: !ex.isFavorite } : ex
          )
      );
      if (selectedExercise?._id === exerciseId) {
        setSelectedExercise((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
      }
    },
  });

  const handleCardClick = (exercise) => {
    haptics.tick();
    setSelectedExercise(exercise);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Search and Quick Filters Header */}
      <GlassCard className="p-4 sm:p-5 bg-white/95 border-slate-200 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search exercises by name, muscle, equipment..."
            className="w-full pl-10 pr-4 min-h-[46px] rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
          />
        </div>

        {/* Muscle Group Horizontal Scrollable Chips */}
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
            Target Muscle Group
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {MUSCLE_GROUPS.map((muscle) => {
              const active = selectedMuscle === muscle;
              return (
                <button
                  key={muscle}
                  type="button"
                  onClick={() => {
                    haptics.selection();
                    setSelectedMuscle(muscle);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-purple-600 text-white shadow-xs shadow-purple-600/20"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {muscle}
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Filters Row: Equipment, Difficulty, Favorites */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Equipment Filter */}
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              {EQUIPMENT_OPTIONS.map((eq) => (
                <option key={eq} value={eq}>
                  {eq === "All" ? "All Equipment" : eq}
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              {DIFFICULTY_OPTIONS.map((diff) => (
                <option key={diff} value={diff}>
                  {diff === "All" ? "All Levels" : diff}
                </option>
              ))}
            </select>
          </div>

          {/* Favorites Only Toggle */}
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setFavoritesOnly(!favoritesOnly);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              favoritesOnly
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? "fill-rose-500 text-rose-500" : ""}`} />
            <span>Favorites</span>
          </button>
        </div>
      </GlassCard>

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : exercisesData?.length === 0 ? (
        <GlassCard className="p-8 text-center bg-white/95 border-slate-200">
          <Dumbbell className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
          <h3 className="font-extrabold text-slate-800 text-sm">No exercises matched</h3>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {exercisesData?.map((exercise) => (
            <motion.div
              key={exercise._id}
              whileHover={{ y: -2 }}
              onClick={() => handleCardClick(exercise)}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <Dumbbell className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-purple-700 transition-colors line-clamp-1">
                      {exercise.name}
                    </h3>
                  </div>

                  <button
                    type="button"
                    aria-label="Toggle favorite"
                    onClick={(e) => {
                      e.stopPropagation();
                      haptics.tick();
                      favoriteMutation.mutate(exercise._id);
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        exercise.isFavorite ? "fill-rose-500 text-rose-500" : ""
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {exercise.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                    {exercise.primaryMuscle}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {exercise.equipment}
                  </span>
                </div>

                <span className="text-xs font-bold text-purple-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Details <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Exercise Detail Sheet */}
      <ExerciseDetailSheet
        exercise={selectedExercise}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onToggleFavorite={(id) => favoriteMutation.mutate(id)}
        onStartWithExercise={onStartWorkoutWithExercise}
      />
    </div>
  );
};

export default ExerciseLibraryTab;

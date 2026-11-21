import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { workoutApi } from "../../api/endpoints";
import { ExerciseMedia } from "./ExerciseMedia";
import { ExerciseDetailSheet } from "./ExerciseDetailSheet";
import { Button } from "../ui/Button";
import {
  Search,
  X,
  Plus,
  Dumbbell,
  Filter,
  Check,
  ChevronRight,
  Flame,
  Info,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../../motion/Haptics";

const MUSCLE_CHIPS = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Abs",
  "Full Body",
];

const EQUIPMENT_CHIPS = [
  "All",
  "Dumbbells",
  "Barbells",
  "Cable",
  "Machines",
  "Bodyweight",
  "Resistance bands",
  "Kettlebells",
];

const CATEGORY_CHIPS = [
  "All",
  "Strength",
  "Cardio",
  "HIIT",
  "Stretching",
  "Mobility",
  "Plyometrics",
];

export const ExercisePickerModal = ({
  open,
  onClose,
  onSelectExercise,
  replaceMode = false,
  replacingExerciseName = "",
}) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("All");
  const [selectedEquipment, setSelectedEquipment] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);

  // Exercise Detail Sheet state
  const [inspectExercise, setInspectExercise] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch exercises from complete catalog
  const { data: exercisesData, isLoading } = useQuery({
    queryKey: [
      "exercise-picker",
      debouncedSearch,
      selectedMuscle,
      selectedEquipment,
      selectedCategory,
      page,
    ],
    queryFn: async () => {
      const params = {
        page,
        limit: 25,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (selectedMuscle !== "All") params.muscle = selectedMuscle;
      if (selectedEquipment !== "All") params.equipment = selectedEquipment;
      if (selectedCategory !== "All") params.category = selectedCategory;

      const res = await workoutApi.getExercises(params);
      return res.data?.data || { exercises: [], pagination: {} };
    },
    enabled: open,
    keepPreviousData: true,
  });

  const exercises = exercisesData?.exercises || [];
  const pagination = exercisesData?.pagination || {};

  const handleSelect = (exercise) => {
    haptics.selection();
    onSelectExercise(exercise);
    onClose();
  };

  const handleInspect = (e, exercise) => {
    e.stopPropagation();
    haptics.tick();
    setInspectExercise(exercise);
    setIsDetailOpen(true);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 15 }}
        className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-purple-600" />
              {replaceMode ? `Replace: ${replacingExerciseName}` : "Discover & Add Exercise"}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Search 2,100+ exercises with video and animation demonstrations
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search exercise (e.g. bench, chest, squat, cable, pull-up)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-100/80 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:bg-white focus:border-purple-400 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Muscle Group Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[10px] font-black uppercase text-slate-400 shrink-0 mr-1">
              Muscle:
            </span>
            {MUSCLE_CHIPS.map((muscle) => (
              <button
                key={muscle}
                type="button"
                onClick={() => {
                  haptics.tick();
                  setSelectedMuscle(muscle);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedMuscle === muscle
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {muscle}
              </button>
            ))}
          </div>

          {/* Equipment Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[10px] font-black uppercase text-slate-400 shrink-0 mr-1">
              Equipment:
            </span>
            {EQUIPMENT_CHIPS.map((eq) => (
              <button
                key={eq}
                type="button"
                onClick={() => {
                  haptics.tick();
                  setSelectedEquipment(eq);
                  setPage(1);
                }}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                  selectedEquipment === eq
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                  </div>
                  <div className="w-16 h-8 bg-slate-200 rounded-xl" />
                </div>
              ))}
            </div>
          ) : exercises.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div>
                <p className="font-extrabold text-slate-800 text-sm">No exercises found</p>
                <p className="text-xs text-slate-500">
                  Try adjusting your search terms or clearing muscle/equipment filters.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setSelectedMuscle("All");
                    setSelectedEquipment("All");
                    setSelectedCategory("All");
                  }}
                >
                  Clear Filters
                </Button>
                {search.trim() && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      handleSelect({
                        name: search.trim(),
                        primaryMuscle: selectedMuscle !== "All" ? selectedMuscle : "Full Body",
                        equipment: selectedEquipment !== "All" ? selectedEquipment : "Bodyweight",
                      })
                    }
                  >
                    Add "{search.trim()}" as Custom
                  </Button>
                )}
              </div>
            </div>
          ) : (
            exercises.map((ex) => (
              <div
                key={ex._id || ex.slug || ex.name}
                onClick={() => handleSelect(ex)}
                className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-purple-50/60 transition-all cursor-pointer group"
              >
                {/* Media Thumbnail */}
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  <ExerciseMedia
                    exercise={ex}
                    autoPlay={false}
                    showControls={false}
                    aspectRatio="aspect-square"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-slate-900 text-sm truncate group-hover:text-purple-700 transition-colors">
                    {ex.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                      {ex.primaryMuscle || "Full Body"}
                    </span>
                    {ex.equipment && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {ex.equipment}
                      </span>
                    )}
                    {ex.difficulty && (
                      <span className="text-[10px] font-bold text-slate-400">
                        • {ex.difficulty}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    title="View Instructions & Demo"
                    onClick={(e) => handleInspect(e, ex)}
                    className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:text-purple-600 hover:bg-purple-100 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <Button
                    size="sm"
                    variant={replaceMode ? "secondary" : "primary"}
                    className="h-8 px-2.5 text-xs font-black shadow-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(ex);
                    }}
                  >
                    {replaceMode ? (
                      "Replace"
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 mr-0.5 stroke-[3]" /> Add
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs shrink-0">
            <span className="text-slate-500 font-medium">
              Page {pagination.page} of {pagination.pages} ({pagination.total} exercises)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 text-xs px-2.5"
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 text-xs px-2.5"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Exercise Detail Sheet for Deep Inspection */}
      {inspectExercise && (
        <ExerciseDetailSheet
          exercise={inspectExercise}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      )}
    </div>
  );
};

export default ExercisePickerModal;

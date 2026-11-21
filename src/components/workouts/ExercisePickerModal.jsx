import React, { useState, useEffect } from "react";
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
  Check,
  ChevronRight,
  Info,
  Film,
  Sparkles,
  ArrowLeft,
  SlidersHorizontal,
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
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Exercise Detail Sheet state
  const [inspectExercise, setInspectExercise] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch exercises from complete catalog
  const { data: exercisesData, isLoading } = useQuery({
    queryKey: [
      "exercise-picker",
      debouncedSearch,
      selectedMuscle,
      selectedEquipment,
      page,
    ],
    queryFn: async () => {
      const params = {
        page,
        limit: 20,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (selectedMuscle !== "All") params.muscle = selectedMuscle;
      if (selectedEquipment !== "All") params.equipment = selectedEquipment;

      const res = await workoutApi.getExercises(params);
      return res.data?.data || { exercises: [], pagination: {} };
    },
    enabled: open,
    keepPreviousData: true,
  });

  const exercises = exercisesData?.exercises || [];
  const pagination = exercisesData?.pagination || {};

  const handleSelect = (exercise) => {
    haptics.goal();
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

  const hasActiveFilters = selectedMuscle !== "All" || selectedEquipment !== "All";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="w-full sm:max-w-2xl h-[94vh] sm:h-[88vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Top Header */}
        <div className="px-4 py-3 sm:p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-slate-900 truncate leading-tight">
                {replaceMode ? `Replace: ${replacingExerciseName}` : "Add Exercise to Workout"}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {pagination.total ? `${pagination.total} exercises available` : "2,100+ exercises with video/GIF demos"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`min-h-[38px] px-2.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                showFilters || hasActiveFilters
                  ? "bg-purple-100 border-purple-300 text-purple-800"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-purple-600 ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar & Filter Chips */}
        <div className="p-3 sm:p-4 border-b border-slate-100 space-y-2.5 shrink-0 bg-white">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              inputMode="search"
              placeholder="Search by name, muscle, cable, dumbbell..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-100/90 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:bg-white focus:border-purple-400 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="w-8 h-8 rounded-full flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Muscle Chips Horizontal Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs -mx-1 px-1">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSelectedMuscle("All");
                  setSelectedEquipment("All");
                  setPage(1);
                }}
                className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200 shrink-0 cursor-pointer"
              >
                Reset
              </button>
            )}
            {MUSCLE_CHIPS.map((muscle) => (
              <button
                key={muscle}
                type="button"
                onClick={() => {
                  haptics.tick();
                  setSelectedMuscle(muscle);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer ${
                  selectedMuscle === muscle
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {muscle}
              </button>
            ))}
          </div>

          {/* Optional Equipment Row when Filters toggled */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-1 border-t border-slate-100"
            >
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
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                      selectedEquipment === eq
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 divide-y divide-slate-100/80">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse p-2">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                  </div>
                  <div className="w-16 h-10 bg-slate-200 rounded-xl" />
                </div>
              ))}
            </div>
          ) : exercises.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                <Dumbbell className="w-7 h-7" />
              </div>
              <div>
                <p className="font-extrabold text-slate-800 text-sm">No exercises found</p>
                <p className="text-xs text-slate-500">
                  Try adjusting your search terms or clearing muscle filters.
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
                className="pt-2 first:pt-0 flex items-center justify-between gap-2.5 p-2 rounded-2xl hover:bg-purple-50/70 transition-all cursor-pointer group"
              >
                {/* Media Thumbnail with Video/GIF Play Badge */}
                <div
                  onClick={(e) => handleInspect(e, ex)}
                  title="Watch Form Demonstration"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative shadow-2xs group-hover:border-purple-300 transition-colors"
                >
                  <ExerciseMedia
                    exercise={ex}
                    autoPlay={false}
                    showControls={false}
                    aspectRatio="aspect-square"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                    <span className="w-5 h-5 rounded-full bg-white/90 text-purple-700 flex items-center justify-center shadow-xs">
                      <Film className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-900 text-xs sm:text-sm truncate group-hover:text-purple-700 transition-colors">
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
                    {ex.videoUrl ? (
                      <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-1 rounded">
                        HD Video
                      </span>
                    ) : ex.gifUrl ? (
                      <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 px-1 rounded">
                        GIF
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Mobile-First Action Touch Target (>= 44px) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    title="Form Demonstration & Instructions"
                    onClick={(e) => handleInspect(e, ex)}
                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:text-purple-600 hover:bg-purple-100 flex items-center justify-center transition-all cursor-pointer shrink-0"
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  <Button
                    size="sm"
                    variant={replaceMode ? "secondary" : "primary"}
                    className="min-h-[44px] px-3.5 text-xs font-black shadow-sm rounded-xl shrink-0"
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

        {/* Sticky Mobile Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between text-xs shrink-0">
            <span className="text-slate-500 font-bold text-[11px] truncate mr-2">
              Page {pagination.page} / {pagination.pages} ({pagination.total})
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-9 px-3 font-bold text-xs rounded-xl"
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="h-9 px-3 font-bold text-xs rounded-xl"
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

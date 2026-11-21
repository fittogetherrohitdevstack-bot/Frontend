import React, { useState, useEffect } from "react";
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
  ChevronLeft,
  Video,
  Zap,
  Image as ImageIcon,
  Check,
  SlidersHorizontal,
  Layers,
  ArrowUpDown,
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
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Abs",
  "Obliques",
  "Lower Back",
  "Full Body",
];

const CATEGORY_TABS = [
  "All",
  "Strength",
  "Hypertrophy",
  "Bodyweight",
  "Cardio",
  "Stretching",
  "Mobility",
  "Olympic",
];

const EQUIPMENT_OPTIONS = [
  "All",
  "Barbells",
  "Dumbbells",
  "Cable Machine",
  "Machines",
  "No Equipment",
  "Resistance Bands",
  "Kettlebells",
  "Pull-up Bar",
  "Smith Machine",
  "Bench",
];

const DIFFICULTY_OPTIONS = ["All", "Beginner", "Intermediate", "Advanced"];

export const ExerciseLibraryTab = ({ onStartWorkoutWithExercise, onAddToPlan }) => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedEquipment, setSelectedEquipment] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedMediaType, setSelectedMediaType] = useState("all"); // 'all' | 'video' | 'gif' | 'images'
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState("media");
  const [page, setPage] = useState(1);

  // Detail Sheet state
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [similarExercises, setSimilarExercises] = useState([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // reset to page 1 on search change
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page to 1 when filters change
  const handleFilterChange = (setter, val) => {
    haptics.selection();
    setter(val);
    setPage(1);
  };

  // 1. Fetch Filter Metadata & Counts
  const { data: filtersData } = useQuery({
    queryKey: ["exercise-filters"],
    queryFn: async () => {
      const res = await workoutApi.getExerciseFilters();
      return res.data?.data;
    },
    staleTime: 1000 * 60 * 10, // 10 mins cache
  });

  // 2. Fetch Paginated Exercises
  const { data: exercisesResult, isLoading } = useQuery({
    queryKey: [
      "workout-exercises",
      selectedMuscle,
      selectedCategory,
      selectedEquipment,
      selectedDifficulty,
      selectedMediaType,
      favoritesOnly,
      debouncedSearch,
      sortBy,
      page,
    ],
    queryFn: async () => {
      const res = await workoutApi.getExercises({
        muscle: selectedMuscle !== "All" ? selectedMuscle : undefined,
        category: selectedCategory !== "All" ? selectedCategory : undefined,
        equipment: selectedEquipment !== "All" ? selectedEquipment : undefined,
        difficulty: selectedDifficulty !== "All" ? selectedDifficulty : undefined,
        mediaType: selectedMediaType !== "all" ? selectedMediaType : undefined,
        favoritesOnly: favoritesOnly ? "true" : undefined,
        search: debouncedSearch || undefined,
        sortBy,
        page,
        limit: 24,
      });
      return res.data?.data;
    },
  });

  const exercises = exercisesResult?.exercises || [];
  const pagination = exercisesResult?.pagination || { page: 1, total: 0, totalPages: 1 };

  // Favorite toggle mutation
  const favoriteMutation = useMutation({
    mutationFn: (exerciseId) => workoutApi.toggleFavoriteExercise(exerciseId),
    onSuccess: (res, exerciseId) => {
      queryClient.invalidateQueries({ queryKey: ["workout-exercises"] });
      if (selectedExercise?._id === exerciseId) {
        setSelectedExercise((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
      }
    },
  });

  const handleCardClick = async (exercise) => {
    haptics.tick();
    setSelectedExercise(exercise);
    setIsDetailOpen(true);

    try {
      const detailRes = await workoutApi.getExerciseById(exercise._id);
      if (detailRes.data?.data?.similarExercises) {
        setSimilarExercises(detailRes.data.data.similarExercises);
      }
    } catch (e) {
      // fallback
    }
  };

  const mediaCounts = filtersData?.mediaCounts || { video: 314, gif: 1165, images: 448 };

  return (
    <div className="space-y-5">
      {/* Search Bar & Media Filter Tabs */}
      <GlassCard className="p-4 sm:p-5 bg-white/95 border-slate-200 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search 2,100+ exercises by name, alternative name, muscle, equipment..."
            className="w-full pl-10 pr-4 min-h-[46px] rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
          />
        </div>

        {/* Media Type Tabs (Videos, GIFs, Diagrams, All) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => handleFilterChange(setSelectedMediaType, "all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-tight whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedMediaType === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <span>All Catalog ({filtersData?.totalCount || "2,100+"})</span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange(setSelectedMediaType, "video")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-tight whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedMediaType === "video"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>🎬 HD Videos ({mediaCounts.video})</span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange(setSelectedMediaType, "gif")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-tight whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedMediaType === "gif"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>⚡ Animated GIFs ({mediaCounts.gif})</span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange(setSelectedMediaType, "images")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-tight whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedMediaType === "images"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>🖼️ Illustrations ({mediaCounts.images})</span>
          </button>
        </div>

        {/* Muscle Group Horizontal Scrollable Chips */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
            Filter by Muscle Group
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {MUSCLE_GROUPS.map((muscle) => {
              const active = selectedMuscle === muscle;
              return (
                <button
                  key={muscle}
                  type="button"
                  onClick={() => handleFilterChange(setSelectedMuscle, muscle)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {muscle}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Tabs */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
            Category
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleFilterChange(setSelectedCategory, cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Filter Dropdowns & Favorites */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="col-span-2 sm:col-span-1 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            {/* Equipment Filter */}
            <select
              value={selectedEquipment}
              onChange={(e) => handleFilterChange(setSelectedEquipment, e.target.value)}
              className="w-full sm:w-auto min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
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
              onChange={(e) => handleFilterChange(setSelectedDifficulty, e.target.value)}
              className="w-full sm:w-auto min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              {DIFFICULTY_OPTIONS.map((diff) => (
                <option key={diff} value={diff}>
                  {diff === "All" ? "All Levels" : diff}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="col-span-2 sm:col-span-1 w-full sm:w-auto min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="media">Sort: Demo Media First</option>
              <option value="name">Sort: Alphabetical (A-Z)</option>
              <option value="difficulty">Sort: Difficulty</option>
            </select>
          </div>

          {/* Favorites Only Toggle */}
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setFavoritesOnly(!favoritesOnly);
              setPage(1);
            }}
            className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3.5 min-h-[42px] rounded-xl text-xs font-bold transition-all border cursor-pointer ${
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

      {/* Catalog Results Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-600">
          Found <strong className="text-purple-700 font-black">{pagination.total}</strong> exercises
          {pagination.totalPages > 1 && ` • Page ${pagination.page} of ${pagination.totalPages}`}
        </span>

        {/* Compact pagination controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                haptics.tick();
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="min-w-[40px] min-h-[40px] rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 px-2 font-mono">
              {page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={!pagination.hasMore}
              onClick={() => {
                haptics.tick();
                setPage((p) => p + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="min-w-[40px] min-h-[40px] rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center cursor-pointer transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <GlassCard className="p-10 text-center bg-white/95 border-slate-200 space-y-2">
          <Dumbbell className="w-12 h-12 text-slate-300 mx-auto stroke-[1.5]" />
          <h3 className="font-black text-slate-800 text-base">No exercises found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try resetting your muscle or equipment filters to discover more movements.
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedMuscle("All");
              setSelectedCategory("All");
              setSelectedEquipment("All");
              setSelectedMediaType("all");
              setSearchTerm("");
              setFavoritesOnly(false);
            }}
            className="mt-2 text-xs font-bold"
          >
            Reset All Filters
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {exercises.map((exercise) => {
            const hasVideo = Boolean(exercise.videoUrl);
            const hasGif = Boolean(exercise.gifUrl);
            const hasIllustration = Boolean(exercise.images?.length > 0 || exercise.thumbnailUrl);

            return (
              <motion.div
                key={exercise._id}
                whileHover={{ y: -3 }}
                onClick={() => handleCardClick(exercise)}
                className="rounded-2xl bg-white border border-slate-200 hover:border-purple-300 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between overflow-hidden group"
              >
                {/* Media Preview Thumbnail */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center">
                  {hasVideo ? (
                    <>
                      <img
                        src={exercise.thumbnailUrl}
                        alt={exercise.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          <Video className="w-4 h-4 fill-current ml-0.5 text-purple-700" />
                        </div>
                      </div>
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[9px] font-black uppercase flex items-center gap-1 border border-white/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        1080p Video
                      </span>
                    </>
                  ) : hasGif ? (
                    <>
                      <img
                        src={exercise.thumbnailUrl || exercise.gifUrl}
                        alt={exercise.name}
                        loading="lazy"
                        className="w-full h-full object-contain p-2"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-purple-600/90 text-white text-[9px] font-black uppercase flex items-center gap-1 shadow-xs">
                        ⚡ Animated GIF
                      </span>
                    </>
                  ) : hasIllustration ? (
                    <>
                      <img
                        src={exercise.thumbnailUrl || exercise.images?.[0]}
                        alt={exercise.name}
                        loading="lazy"
                        className="w-full h-full object-contain p-2 bg-slate-50"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-700/80 text-white text-[9px] font-bold uppercase">
                        Diagram
                      </span>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <Dumbbell className="w-8 h-8 text-slate-300" />
                    </div>
                  )}

                  {/* Favorite toggle top right */}
                  <button
                    type="button"
                    aria-label="Toggle favorite"
                    onClick={(e) => {
                      e.stopPropagation();
                      haptics.tick();
                      favoriteMutation.mutate(exercise._id);
                    }}
                    className="absolute top-2 right-2 min-w-[38px] min-h-[38px] rounded-xl bg-black/50 hover:bg-black/80 backdrop-blur-md text-white transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        exercise.isFavorite ? "fill-rose-500 text-rose-500" : "text-white"
                      }`}
                    />
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-purple-700 transition-colors line-clamp-1">
                      {exercise.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {exercise.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black uppercase px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                        {exercise.primaryMuscle}
                      </span>
                      <span className="font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {exercise.equipment}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-purple-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Bottom Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <span className="text-xs font-bold text-slate-600">
            Showing exercises {(page - 1) * 24 + 1} - {Math.min(page * 24, pagination.total)} of{" "}
            {pagination.total}
          </span>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => {
                haptics.tick();
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-xs font-bold min-h-[36px]"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
            </Button>

            <span className="text-xs font-mono font-bold text-slate-700 px-2">
              Page {page} of {pagination.totalPages}
            </span>

            <Button
              size="sm"
              variant="secondary"
              disabled={!pagination.hasMore}
              onClick={() => {
                haptics.tick();
                setPage((p) => p + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-xs font-bold min-h-[36px]"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Exercise Detail Sheet */}
      <ExerciseDetailSheet
        exercise={selectedExercise}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onToggleFavorite={(id) => favoriteMutation.mutate(id)}
        onStartWithExercise={onStartWorkoutWithExercise}
        onAddToPlan={onAddToPlan}
        similarExercises={similarExercises}
        onSelectSimilar={(sim) => handleCardClick(sim)}
      />
    </div>
  );
};

export default ExerciseLibraryTab;

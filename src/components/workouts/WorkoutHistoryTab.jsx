import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workoutApi } from "../../api/endpoints";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import { CompletedWorkoutDetailModal } from "./CompletedWorkoutDetailModal";
import { EditCompletedWorkoutModal } from "./EditCompletedWorkoutModal";
import { DeleteWorkoutConfirmDialog } from "./DeleteWorkoutConfirmDialog";
import {
  Calendar,
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Trophy,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  X,
  Flame,
  Check,
  Plus,
} from "lucide-react";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

const MUSCLE_OPTIONS = [
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

const TIME_FILTERS = [
  { id: "all", label: "All Time" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "custom", label: "Custom Range" },
];

export const WorkoutHistoryTab = () => {
  const queryClient = useQueryClient();

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedMuscle, setSelectedMuscle] = useState("All");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [page, setPage] = useState(1);

  // Modal State
  const [detailSession, setDetailSession] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [editingSession, setEditingSession] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [deletingSession, setDeletingSession] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Query completed workouts
  const { data: historyData, isLoading } = useQuery({
    queryKey: [
      "workout-history",
      timeFilter,
      debouncedSearch,
      selectedMuscle,
      customStartDate,
      customEndDate,
      page,
    ],
    queryFn: async () => {
      const params = {
        page,
        limit: 25,
      };

      if (timeFilter !== "all" && timeFilter !== "custom") {
        params.timeRange = timeFilter;
      } else if (timeFilter === "custom") {
        if (customStartDate) params.startDate = customStartDate;
        if (customEndDate) params.endDate = customEndDate;
      }

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (selectedMuscle !== "All") params.muscle = selectedMuscle;

      const res = await workoutApi.getHistory(params);
      return res.data?.data || { sessions: [], pagination: {} };
    },
    keepPreviousData: true,
  });

  const sessions = historyData?.sessions || [];
  const pagination = historyData?.pagination || {};

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: ({ id, payload }) => workoutApi.updateCompletedSession(id, payload),
    onSuccess: (res) => {
      haptics.goal();
      toast.success("Workout session updated successfully!");
      setIsEditOpen(false);
      setEditingSession(null);
      // If detail modal is open for this session, update it
      if (detailSession?._id === res.data?.data?.session?._id) {
        setDetailSession(res.data.data.session);
      }
      queryClient.invalidateQueries({ queryKey: ["workout-history"] });
      queryClient.invalidateQueries({ queryKey: ["workout-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["workout-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["exercise-history"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update workout");
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: (id) => workoutApi.deleteCompletedSession(id),
    onSuccess: () => {
      haptics.tick();
      toast.success("Workout session deleted successfully");
      setIsDeleteOpen(false);
      setDeletingSession(null);
      setIsDetailOpen(false);
      setDetailSession(null);
      queryClient.invalidateQueries({ queryKey: ["workout-history"] });
      queryClient.invalidateQueries({ queryKey: ["workout-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["workout-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["exercise-history"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete workout");
    },
  });

  const handleOpenDetail = (session) => {
    haptics.tick();
    setDetailSession(session);
    setIsDetailOpen(true);
  };

  const handleOpenEdit = (session) => {
    haptics.tick();
    setEditingSession(session);
    setIsEditOpen(true);
  };

  const handleOpenDelete = (session) => {
    haptics.tick();
    setDeletingSession(session);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Workout History & Session Logs
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            View, edit, and manage all your completed workouts and set performances
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search workouts or exercises (e.g. Push, Bench, Squats)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 min-h-[44px] rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-xs focus:outline-none focus:border-purple-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Time Filters Strip & Muscle Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Time range pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none w-full sm:w-auto">
            {TIME_FILTERS.map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => {
                  haptics.tick();
                  setTimeFilter(tf.id);
                  setPage(1);
                }}
                className={`px-3.5 py-2 min-h-[38px] rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center justify-center ${
                  timeFilter === tf.id
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Muscle dropdown */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <span className="text-[10px] font-black uppercase text-slate-400">Muscle:</span>
            <select
              value={selectedMuscle}
              onChange={(e) => {
                setSelectedMuscle(e.target.value);
                setPage(1);
              }}
              className="px-3 min-h-[38px] rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-400"
            >
              {MUSCLE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m === "All" ? "All Muscles" : m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Range Pickers if selected */}
        {timeFilter === "custom" && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
              />
            </div>
          </div>
        )}
      </div>

      {/* History Session Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-3xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <GlassCard className="p-8 text-center bg-white/95 border-slate-200 space-y-2 rounded-3xl">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto stroke-[1.5]" />
          <h3 className="font-extrabold text-slate-800 text-sm">No workout sessions found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search || timeFilter !== "all" || selectedMuscle !== "All"
              ? "No workouts matched your search or filters. Try clearing them to see all records."
              : "Completed workouts will automatically appear here with full set breakdowns and edit controls."}
          </p>
          {(search || timeFilter !== "all" || selectedMuscle !== "All") && (
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setTimeFilter("all");
                  setSelectedMuscle("All");
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const completedSetsCount = (session.exercises || []).reduce(
              (acc, ex) => acc + (ex.sets || []).filter((s) => s.completed !== false).length,
              0
            );

            return (
              <GlassCard
                key={session._id}
                onClick={() => handleOpenDetail(session)}
                className="p-4 sm:p-5 bg-white/95 border-slate-200/90 shadow-2xs hover:border-purple-300 transition-all rounded-3xl space-y-3 cursor-pointer group"
              >
                {/* Card Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black shrink-0">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-purple-700">
                          {session.date}
                        </span>
                        {session.targetMuscles && session.targetMuscles[0] && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-md bg-purple-50 text-purple-800 border border-purple-200/60">
                            {session.targetMuscles[0]}
                          </span>
                        )}
                        {session.workoutPlanId?.name && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 truncate max-w-[120px]">
                            {session.workoutPlanId.name}
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate mt-0.5">
                        {session.workoutName || "Workout Session"}
                      </h3>
                    </div>
                  </div>

                  {/* Actions on Card Header */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      title="View Details"
                      onClick={() => handleOpenDetail(session)}
                      className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 text-slate-600 hover:text-purple-600 hover:bg-purple-50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Edit Completed Workout"
                      onClick={() => handleOpenEdit(session)}
                      className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete Workout Session"
                      onClick={() => handleOpenDelete(session)}
                      className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metrics Strip */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs py-1 px-1 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="p-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Duration</span>
                    <span className="font-black text-slate-800 text-xs">
                      {session.durationMinutes || 0}m
                    </span>
                  </div>
                  <div className="p-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Volume</span>
                    <span className="font-black text-purple-700 text-xs">
                      {session.totalVolumeKg || 0}kg
                    </span>
                  </div>
                  <div className="p-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Sets</span>
                    <span className="font-black text-slate-800 text-xs">
                      {completedSetsCount}
                    </span>
                  </div>
                  <div className="p-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Exercises</span>
                    <span className="font-black text-slate-800 text-xs">
                      {(session.exercises || []).length}
                    </span>
                  </div>
                </div>

                {/* Exercises preview pills */}
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  {(session.exercises || []).slice(0, 4).map((ex, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200/80 px-2 py-0.5 rounded-lg truncate max-w-[160px]"
                    >
                      {ex.name}
                    </span>
                  ))}
                  {(session.exercises || []).length > 4 && (
                    <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-lg">
                      +{(session.exercises || []).length - 4} more
                    </span>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <span className="text-slate-500 font-medium">
            Page {pagination.page} of {pagination.pages} ({pagination.total} sessions)
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="h-8 text-xs px-2.5 font-bold"
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pagination.pages}
              onClick={() => {
                setPage((p) => p + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="h-8 text-xs px-2.5 font-bold"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {detailSession && (
        <CompletedWorkoutDetailModal
          session={detailSession}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          onEditWorkout={(sess) => {
            setIsDetailOpen(false);
            handleOpenEdit(sess);
          }}
          onDeleteWorkout={(sess) => {
            handleOpenDelete(sess);
          }}
        />
      )}

      {/* Edit Completed Workout Modal */}
      {editingSession && (
        <EditCompletedWorkoutModal
          session={editingSession}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSave={(id, payload) => updateSessionMutation.mutate({ id, payload })}
          isSaving={updateSessionMutation.isPending}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingSession && (
        <DeleteWorkoutConfirmDialog
          open={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={() => deleteSessionMutation.mutate(deletingSession._id)}
          isDeleting={deleteSessionMutation.isPending}
          workoutName={deletingSession.workoutName}
          workoutDate={deletingSession.date}
        />
      )}
    </div>
  );
};

export default WorkoutHistoryTab;

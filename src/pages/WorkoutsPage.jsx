import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workoutApi } from "../api/endpoints";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import {
  Dumbbell,
  Play,
  CheckCircle2,
  Calendar,
  Trophy,
  TrendingUp,
  Sparkles,
  Flame,
  Plus,
  Layers,
  History,
  Activity,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../motion/Haptics";
import { toast } from "sonner";

// Tab Subcomponents
import WorkoutDashboardTab from "../components/workouts/WorkoutDashboardTab";
import WorkoutPlansTab from "../components/workouts/WorkoutPlansTab";
import ExerciseLibraryTab from "../components/workouts/ExerciseLibraryTab";
import LiveWorkoutTracker from "../components/workouts/LiveWorkoutTracker";
import WorkoutSummaryModal from "../components/workouts/WorkoutSummaryModal";
import WorkoutHistoryTab from "../components/workouts/WorkoutHistoryTab";
import WorkoutAnalyticsTab from "../components/workouts/WorkoutAnalyticsTab";
import PersonalRecordsTab from "../components/workouts/PersonalRecordsTab";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: Activity },
  { id: "plans", label: "Plans", icon: Calendar },
  { id: "exercises", label: "Exercises", icon: Dumbbell },
  { id: "history", label: "History", icon: History },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "records", label: "PRs", icon: Trophy },
];

export const WorkoutsPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Live session state
  const [isLiveTrackerOpen, setIsLiveTrackerOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);

  // Completion summary modal state
  const [summaryData, setSummaryData] = useState(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState(null);

  // 1. Fetch Dashboard data
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ["workout-dashboard"],
    queryFn: async () => {
      const res = await workoutApi.getDashboard();
      return res.data?.data;
    },
  });

  // Automatically sync active in-progress session if one exists
  useEffect(() => {
    if (dashboardData?.hasActiveSession && dashboardData?.activeSession) {
      setActiveSession(dashboardData.activeSession);
    }
  }, [dashboardData]);

  // 2. Start workout session mutation
  const startSessionMutation = useMutation({
    mutationFn: (payload) => workoutApi.startSession(payload),
    onSuccess: (res) => {
      const session = res.data?.data?.session;
      setActiveSession(session);
      setIsLiveTrackerOpen(true);
      queryClient.invalidateQueries({ queryKey: ["workout-dashboard"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to start workout session");
    },
  });

  // 3. Live save mutation (debounced autosave)
  const liveSaveMutation = useMutation({
    mutationFn: (payload) => {
      if (!activeSession?._id) return Promise.resolve();
      return workoutApi.liveSaveSession(activeSession._id, payload);
    },
    onSuccess: (res) => {
      if (res?.data?.data?.session) {
        setActiveSession(res.data.data.session);
      }
    },
  });

  // 4. Finish workout mutation
  const finishSessionMutation = useMutation({
    mutationFn: (payload) => {
      if (!activeSession?._id) throw new Error("No active session");
      return workoutApi.finishSession(activeSession._id, payload);
    },
    onSuccess: (res) => {
      const result = res.data?.data;
      setSummaryData(result?.summary);
      setCompletedSessionId(result?.session?._id);
      setIsSummaryOpen(true);
      setIsLiveTrackerOpen(false);
      setActiveSession(null);

      // Invalidate all related caches
      queryClient.invalidateQueries({ queryKey: ["workout-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["workout-history"] });
      queryClient.invalidateQueries({ queryKey: ["workout-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["workout-muscle-map"] });
      queryClient.invalidateQueries({ queryKey: ["personal-records-full"] });
      queryClient.invalidateQueries({ queryKey: ["personal-records"] });
      queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["group-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["group-leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["group-challenges"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to finish workout");
    },
  });

  // 5. Cancel workout mutation
  const cancelSessionMutation = useMutation({
    mutationFn: () => {
      if (!activeSession?._id) return Promise.resolve();
      return workoutApi.cancelSession(activeSession._id);
    },
    onSuccess: () => {
      toast.info("Workout session cancelled");
      setIsLiveTrackerOpen(false);
      setActiveSession(null);
      queryClient.invalidateQueries({ queryKey: ["workout-dashboard"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to cancel session");
    },
  });

  // 6. Share to squad feed mutation
  const shareToFeedMutation = useMutation({
    mutationFn: ({ caption }) => {
      if (!completedSessionId) throw new Error("No completed session to share");
      return workoutApi.shareSession(completedSessionId, { caption });
    },
    onSuccess: () => {
      toast.success("Workout shared to squad feed!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to share workout");
    },
  });

  // 7. Mark Attendance / Rest day quick mutation
  const markAttendanceMutation = useMutation({
    mutationFn: (status = "rest") =>
      workoutApi.markAttendance({
        status,
        workoutName: status === "rest" ? "Rest Day Honored" : "Quick Workout",
      }),
    onSuccess: (_, status) => {
      haptics.goal();
      toast.success(
        status === "rest"
          ? "Rest day logged! +30 points earned 🧘"
          : "Workout attendance recorded! +30 points 💪"
      );
      queryClient.invalidateQueries({ queryKey: ["workout-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["today-workout"] });
      queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["group-dashboard"] });
    },
  });

  // Handler: Start today's workout
  const handleStartTodayWorkout = (scheduledDay) => {
    const payload = {
      workoutPlanId: dashboardData?.activePlan?._id || null,
      workoutName: scheduledDay?.dayName || "Daily Workout",
      targetMuscles: scheduledDay?.targetMuscles || [],
      exercises: scheduledDay?.exercises || [],
    };
    startSessionMutation.mutate(payload);
  };

  // Handler: Start with single exercise from library
  const handleStartWithExercise = (exercise) => {
    const payload = {
      workoutName: `${exercise.name} Focus Session`,
      targetMuscles: [exercise.primaryMuscle],
      exercises: [
        {
          exerciseId: exercise._id,
          name: exercise.name,
          primaryMuscle: exercise.primaryMuscle,
          targetSets: 3,
          targetReps: 10,
        },
      ],
    };
    startSessionMutation.mutate(payload);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 max-w-5xl mx-auto pb-12"
    >
      {/* If Live Workout Tracker is active, show tracker view */}
      {isLiveTrackerOpen && activeSession ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setIsLiveTrackerOpen(false)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-purple-700 transition-colors cursor-pointer px-2 py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Workout Dashboard (Session stays active)
          </button>

          <LiveWorkoutTracker
            session={activeSession}
            onLiveSave={(data) => liveSaveMutation.mutate(data)}
            onFinishWorkout={(data) => finishSessionMutation.mutate(data)}
            onCancelWorkout={() => cancelSessionMutation.mutate()}
            isFinishing={finishSessionMutation.isPending}
          />
        </div>
      ) : (
        <>
          {/* Main Top Tab Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none border-b border-slate-200/80 -mx-4 px-4 sm:mx-0 sm:px-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    haptics.selection();
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer shrink-0 min-h-[44px] ${
                    isActive
                      ? "bg-purple-600 text-white shadow-sm shadow-purple-600/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.5]" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === "dashboard" && (
                <WorkoutDashboardTab
                  dashboardData={dashboardData}
                  isLoading={isLoadingDashboard}
                  onStartTodayWorkout={handleStartTodayWorkout}
                  onResumeActiveWorkout={() => setIsLiveTrackerOpen(true)}
                  onMarkRestDay={() => markAttendanceMutation.mutate("rest")}
                  onNavigateTab={(tabId) => setActiveTab(tabId)}
                />
              )}

              {activeTab === "plans" && <WorkoutPlansTab />}

              {activeTab === "exercises" && (
                <ExerciseLibraryTab
                  onStartWorkoutWithExercise={(ex) => handleStartWithExercise(ex)}
                />
              )}

              {activeTab === "history" && <WorkoutHistoryTab />}

              {activeTab === "analytics" && <WorkoutAnalyticsTab />}

              {activeTab === "records" && <PersonalRecordsTab />}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {/* Workout Completion Summary Modal with Celebration and Squad Sharing */}
      <WorkoutSummaryModal
        open={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        summaryData={summaryData}
        onShareToFeed={(caption, onSuccess) => {
          shareToFeedMutation.mutate(
            { caption },
            {
              onSuccess: () => {
                onSuccess?.();
              },
            }
          );
        }}
        isSharing={shareToFeedMutation.isPending}
      />
    </motion.div>
  );
};

export default WorkoutsPage;

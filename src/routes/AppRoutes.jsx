import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/layout/AppLayout";
import { AuthPage } from "../pages/AuthPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DietPage } from "../pages/DietPage";
import { DailyTrackerPage } from "../pages/DailyTrackerPage";
import { WorkoutsPage } from "../pages/WorkoutsPage";
import { WaterPage } from "../pages/WaterPage";
import { ProgressPage } from "../pages/ProgressPage";
import { GroupPage } from "../pages/GroupPage";
import { LeaderboardPage } from "../pages/LeaderboardPage";
import { ChallengesPage } from "../pages/ChallengesPage";
import { BadgesPage } from "../pages/BadgesPage";
import { ProfilePage } from "../pages/ProfilePage";
import { WeightPage } from "../pages/WeightPage";
import { MeasurementsPage } from "../pages/MeasurementsPage";
import { PhotosPage } from "../pages/PhotosPage";
import { ReminderSettingsPage } from "../pages/ReminderSettingsPage";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Routes>
      {/* Public Route */}
      <Route
        path="/login"
        element={
          isLoading ? (
            <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <AuthPage />
          )
        }
      />

      {/* Protected App Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="diet" element={<DietPage />} />
        <Route path="tracker" element={<DailyTrackerPage />} />
        <Route path="workouts" element={<WorkoutsPage />} />
        <Route path="water" element={<WaterPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="photos" element={<PhotosPage />} />
        <Route path="weight" element={<WeightPage />} />
        <Route path="measurements" element={<MeasurementsPage />} />
        <Route path="group" element={<GroupPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="challenges" element={<ChallengesPage />} />
        <Route path="badges" element={<BadgesPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings/reminders" element={<ReminderSettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

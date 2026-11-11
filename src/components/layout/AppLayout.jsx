import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Header } from "./Header";
import { useSocket } from "../../context/SocketContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dietApi, progressApi } from "../../api/endpoints";
import {
  Home,
  UtensilsCrossed,
  Dumbbell,
  Users,
  User,
  Droplets,
  TrendingUp,
  Trophy,
  Award,
  Sparkles,
  Plus,
  X,
  Scale,
  Ruler,
  Compass,
  Camera,
  Bell,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";

export const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { liveEvent, clearLiveEvent } = useSocket();
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  // Fetch summary to keep streak in header updated
  const { data: summaryData } = useQuery({
    queryKey: ["my-dashboard-summary"],
    queryFn: async () => {
      const res = await dietApi.getMyDashboard();
      return res.data?.data;
    },
    refetchInterval: 30000,
  });

  // Quick water addition from radial menu
  const quickWaterMutation = useMutation({
    mutationFn: (amountMl) => progressApi.addWater({ amountMl }),
    onSuccess: (res, amount) => {
      haptics.goal();
      toast.success(`Hydrated! +${amount} ml logged 💧`, {
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["today-water"] });
      setQuickMenuOpen(false);
    },
  });

  // Auto-dismiss live socket activity toast after 5s
  useEffect(() => {
    if (liveEvent) {
      const timer = setTimeout(() => {
        clearLiveEvent();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [liveEvent, clearLiveEvent]);

  // Close quick menu on route change
  useEffect(() => {
    setQuickMenuOpen(false);
  }, [location.pathname]);

  const mobileNavLeft = [
    { label: "Home", to: "/", icon: Home, matchPaths: ["/"] },
    { label: "Diet", to: "/diet", icon: UtensilsCrossed, matchPaths: ["/diet", "/tracker"] },
  ];

  const mobileNavRight = [
    { label: "Workout", to: "/workouts", icon: Dumbbell, matchPaths: ["/workouts"] },
    {
      label: "Squad",
      to: "/group",
      icon: Users,
      matchPaths: ["/group", "/leaderboard", "/challenges", "/badges"],
    },
  ];

  const sidebarNavItems = [
    { label: "Home", to: "/", icon: Home },
    { label: "Diet Plan", to: "/diet", icon: UtensilsCrossed },
    { label: "Workouts", to: "/workouts", icon: Dumbbell },
    { label: "Squad", to: "/group", icon: Users },
    { label: "Profile", to: "/profile", icon: User },
  ];

  const subNavItems = [
    { label: "Daily Tracker", to: "/tracker", icon: UtensilsCrossed, color: "text-lime-600" },
    { label: "Weight", to: "/weight", icon: Scale, color: "text-lime-600" },
    { label: "Measurements", to: "/measurements", icon: Ruler, color: "text-violet-600" },
    { label: "Photos", to: "/photos", icon: Camera, color: "text-sky-600" },
    { label: "Water", to: "/water", icon: Droplets, color: "text-cyan-600" },
    { label: "Progress", to: "/progress", icon: TrendingUp, color: "text-emerald-600" },
    { label: "Rankings", to: "/leaderboard", icon: Trophy, color: "text-amber-500" },
    { label: "Challenges", to: "/challenges", icon: Award, color: "text-purple-600" },
    { label: "Reminders", to: "/settings/reminders", icon: Bell, color: "text-indigo-600" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900 flex flex-col antialiased selection:bg-lime-500 selection:text-white relative overflow-x-clip">
      {/* Ambient Drifting Mesh Blobs (Soft Pastel for Light Theme) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-200/35 blur-[130px] animate-blob-1" />
        <div className="absolute top-1/4 -right-32 w-[28rem] h-[28rem] rounded-full bg-lime-200/35 blur-[140px] animate-blob-2" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full bg-cyan-200/35 blur-[130px] animate-blob-3" />
      </div>

      {/* Top Header */}
      <Header streakCount={summaryData?.streak || 0} />

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto relative z-10">
        {/* Desktop Left Sidebar (Fixed & Non-Moving when Scrolling) */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/80 p-4 space-y-6 shrink-0 bg-white/80 backdrop-blur-md sticky top-16 self-start h-[calc(100dvh-4rem)] overflow-y-auto">
          <div className="space-y-1">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-3">
              Core
            </span>
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => haptics.tick()}
                  className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? "text-slate-900 font-extrabold shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      className="absolute inset-0 bg-lime-100 border border-lime-300 rounded-2xl -z-10 shadow-xs"
                    />
                  )}
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-lime-700" : ""}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="space-y-1 pt-4 border-t border-slate-200/80">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-3">
              Explore
            </span>
            {subNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => haptics.tick()}
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-slate-100 text-slate-900 font-bold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </aside>

        {/* Center Content Body */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 pb-28 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Real-time Socket Event Notification Pill */}
      <AnimatePresence>
        {liveEvent && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 sm:bottom-8 right-3 sm:right-6 z-50 max-w-sm w-[calc(100%-1.5rem)] bg-white/95 border border-lime-300 shadow-[0_12px_40px_rgba(15,23,42,0.15)] rounded-3xl p-3.5 flex items-start gap-3.5 backdrop-blur-xl"
          >
            <div className="w-9 h-9 rounded-2xl bg-lime-100 border border-lime-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-lime-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[10px] font-black text-lime-700 tracking-widest uppercase">
                Squad Pulse
              </h4>
              <p className="text-xs text-slate-800 mt-0.5 leading-snug">
                <span className="font-bold text-slate-900">{liveEvent.userName}</span>{" "}
                {liveEvent.type === "meal" && `logged ${liveEvent.mealName} as ${liveEvent.status}!`}
                {liveEvent.type === "workout" && `completed ${liveEvent.workoutName}!`}
                {liveEvent.type === "water" && `crushed their hydration goal!`}
                {liveEvent.type === "badge" && `unlocked badge: ${liveEvent.badgeName}!`}
                {liveEvent.type === "challenge" && `joined ${liveEvent.challengeTitle}!`}
                {liveEvent.type === "challenge-created" && `launched challenge: ${liveEvent.title}!`}
                {liveEvent.type === "member-joined" && `joined the squad!`}
              </p>
            </div>
            <button
              onClick={clearLiveEvent}
              className="text-slate-400 hover:text-slate-700 text-xs font-semibold p-1"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Radial Quick Action Menu Backdrop */}
      <AnimatePresence>
        {quickMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuickMenuOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Flexible & Comprehensive Mobile Action Hub Drawer */}
      <AnimatePresence>
        {quickMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 120, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 120, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-22 left-3 right-3 z-50 max-w-sm mx-auto bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl p-4 shadow-[0_15px_50px_rgba(15,23,42,0.18)] lg:hidden space-y-3.5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-slate-900 flex items-center justify-center p-1 shadow-xs ring-1 ring-slate-800/40">
                  <img src="/apple-touch-icon.png" alt="FitTogether" className="w-full h-full object-contain" />
                </div>
                <h3 className="font-black text-sm text-slate-900 tracking-tight">
                  Quick Actions & Shortcuts
                </h3>
              </div>
              <button
                onClick={() => setQuickMenuOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* Quick Action: Log Today's Meal */}
              <button
                onClick={() => {
                  haptics.tick();
                  setQuickMenuOpen(false);
                  navigate("/tracker");
                }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-lime-50 hover:border-lime-300 text-left transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-lime-100 text-lime-700 flex items-center justify-center shrink-0">
                  <UtensilsCrossed className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 leading-tight">Log Meal</h4>
                  <span className="text-[10px] text-slate-500">Daily tracker</span>
                </div>
              </button>

              {/* Quick Action: +250ml Water */}
              <button
                onClick={() => quickWaterMutation.mutate(250)}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-cyan-50 hover:border-cyan-300 text-left transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                  <Droplets className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 leading-tight">+250ml Water</h4>
                  <span className="text-[10px] text-slate-500">Quick hydrate</span>
                </div>
              </button>

              {/* Quick Action: Start Workout */}
              <button
                onClick={() => {
                  haptics.tick();
                  setQuickMenuOpen(false);
                  navigate("/workouts");
                }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-purple-50 hover:border-purple-300 text-left transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 leading-tight">Workout</h4>
                  <span className="text-[10px] text-slate-500">Log sets & PRs</span>
                </div>
              </button>

              {/* Quick Action: Log Weight */}
              <button
                onClick={() => {
                  haptics.tick();
                  setQuickMenuOpen(false);
                  navigate("/weight");
                }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-lime-50 hover:border-lime-300 text-left transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-lime-100 text-lime-700 flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 leading-tight">Log Weight</h4>
                  <span className="text-[10px] text-slate-500">Analytics & Trend</span>
                </div>
              </button>
            </div>

            {/* Quick Navigation Chips */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2 px-1">
                More Destinations
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <button
                  onClick={() => {
                    haptics.tick();
                    setQuickMenuOpen(false);
                    navigate("/water");
                  }}
                  className="p-2 rounded-xl bg-slate-100/70 hover:bg-cyan-100 text-slate-700 hover:text-cyan-800 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                >
                  <Droplets className="w-4 h-4 text-cyan-600" />
                  <span className="text-[10px] font-bold">Water</span>
                </button>

                <button
                  onClick={() => {
                    haptics.tick();
                    setQuickMenuOpen(false);
                    navigate("/leaderboard");
                  }}
                  className="p-2 rounded-xl bg-slate-100/70 hover:bg-amber-100 text-slate-700 hover:text-amber-800 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-bold">Ranks</span>
                </button>

                <button
                  onClick={() => {
                    haptics.tick();
                    setQuickMenuOpen(false);
                    navigate("/challenges");
                  }}
                  className="p-2 rounded-xl bg-slate-100/70 hover:bg-purple-100 text-slate-700 hover:text-purple-800 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                >
                  <Award className="w-4 h-4 text-purple-600" />
                  <span className="text-[10px] font-bold">Goals</span>
                </button>

                <button
                  onClick={() => {
                    haptics.tick();
                    setQuickMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="p-2 rounded-xl bg-slate-100/70 hover:bg-slate-200 text-slate-700 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-700" />
                  <span className="text-[10px] font-bold">Profile</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flexible & Symmetrical Mobile Floating Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-3 left-0 right-0 z-40 w-[calc(100%-1.25rem)] max-w-md mx-auto bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl p-1.5 shadow-[0_10px_35px_rgba(15,23,42,0.12),inset_0_1px_0_0_rgba(255,255,255,0.9)] flex items-center justify-between safe-bottom">
        {/* Left 2 Tabs (Home, Diet) */}
        {mobileNavLeft.map((item) => {
          const Icon = item.icon;
          const isActive = item.matchPaths.some((p) => location.pathname === p);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => haptics.tick()}
              className="relative flex-1 min-w-0 min-h-[46px] flex flex-col items-center justify-center py-1 px-1 rounded-2xl select-none"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  className="absolute inset-0 bg-lime-100 border border-lime-300 rounded-2xl shadow-xs"
                />
              )}
              <motion.div
                whileTap={{ scale: 0.8 }}
                animate={{ scale: isActive ? 1.08 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="relative z-10 flex flex-col items-center"
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? "text-lime-700 stroke-[2.5]" : "text-slate-400"
                  }`}
                />
                <span
                  className={`text-[10px] font-bold tracking-tight transition-colors mt-0.5 truncate max-w-[56px] text-center ${
                    isActive ? "text-lime-800" : "text-slate-500"
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            </NavLink>
          );
        })}

        {/* Perfectly Centered Quick-Action (+) Button */}
        <div className="flex-1 min-w-0 flex justify-center px-1">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => {
              haptics.tick();
              setQuickMenuOpen(!quickMenuOpen);
            }}
            aria-label="Quick Actions"
            className={`w-12 h-12 rounded-2xl -translate-y-1.5 flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer ${
              quickMenuOpen
                ? "bg-rose-500 text-white rotate-45 shadow-rose-500/30"
                : "bg-gradient-to-tr from-[#84CC16] to-[#10B981] text-white shadow-lime-500/35"
            }`}
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </motion.button>
        </div>

        {/* Right 2 Tabs (Workout, Squad) */}
        {mobileNavRight.map((item) => {
          const Icon = item.icon;
          const isActive = item.matchPaths.some((p) => location.pathname === p);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => haptics.tick()}
              className="relative flex-1 min-w-0 min-h-[46px] flex flex-col items-center justify-center py-1 px-1 rounded-2xl select-none"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  className="absolute inset-0 bg-lime-100 border border-lime-300 rounded-2xl shadow-xs"
                />
              )}
              <motion.div
                whileTap={{ scale: 0.8 }}
                animate={{ scale: isActive ? 1.08 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="relative z-10 flex flex-col items-center"
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? "text-lime-700 stroke-[2.5]" : "text-slate-400"
                  }`}
                />
                <span
                  className={`text-[10px] font-bold tracking-tight transition-colors mt-0.5 truncate max-w-[56px] text-center ${
                    isActive ? "text-lime-800" : "text-slate-500"
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default AppLayout;

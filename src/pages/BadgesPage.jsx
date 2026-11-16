import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { socialApi } from "../api/endpoints";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import {
  Award,
  Bell,
  CheckCircle2,
  Lock,
  Sparkles,
  Flame,
  Droplets,
  Dumbbell,
  Footprints,
  Crown,
  Trophy,
  Sun,
  Check,
  Medal,
  Star,
} from "lucide-react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { haptics } from "../motion/Haptics";
import { toast } from "sonner";
import { NotificationCenter } from "../components/notifications/NotificationCenter";

export const BadgesPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() =>
    searchParams.get("tab") === "notifications" ? "notifications" : "badges"
  ); // badges, notifications

  useEffect(() => {
    if (searchParams.get("tab") === "notifications") {
      setActiveTab("notifications");
    }
  }, [searchParams]);

  const { data: badgesData, isLoading: isBadgesLoading } = useQuery({
    queryKey: ["my-badges"],
    queryFn: async () => {
      const res = await socialApi.getMyBadges();
      return res.data?.data;
    },
  });

  const { data: notificationsData, isLoading: isNotifsLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await socialApi.getNotifications();
      return res.data?.data;
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => socialApi.markAllNotificationsRead(),
    onSuccess: () => {
      haptics.tick();
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markSingleReadMutation = useMutation({
    mutationFn: (id) => socialApi.markNotificationRead(id),
    onSuccess: () => {
      haptics.tick();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const getBadgeIcon = (iconName) => {
    switch (iconName) {
      case "Flame":
        return <Flame className="w-6 h-6 text-amber-500 fill-amber-400" />;
      case "Crown":
        return <Crown className="w-6 h-6 text-amber-500 fill-amber-300" />;
      case "Droplets":
        return <Droplets className="w-6 h-6 text-cyan-500 fill-cyan-400" />;
      case "Dumbbell":
        return <Dumbbell className="w-6 h-6 text-purple-600" />;
      case "Footprints":
        return <Footprints className="w-6 h-6 text-emerald-600" />;
      case "Trophy":
        return <Trophy className="w-6 h-6 text-amber-500 fill-amber-300" />;
      case "Sun":
        return <Sun className="w-6 h-6 text-amber-500 fill-amber-400" />;
      case "Medal":
        return <Medal className="w-6 h-6 text-indigo-600" />;
      case "Star":
        return <Star className="w-6 h-6 text-amber-500 fill-amber-400" />;
      default:
        return <Award className="w-6 h-6 text-lime-600" />;
    }
  };

  useEffect(() => {
    if (badgesData?.newlyEarned?.length > 0) {
      haptics.goal();
      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.6 },
      });
      toast.success(`🎉 Unlocked ${badgesData.newlyEarned.length} new badge!`);
    }
  }, [badgesData?.newlyEarned?.length]);

  const badges = badgesData?.badges || [];
  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-4xl mx-auto pb-8 sm:pb-12"
    >
      {/* Header and Toggle Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider border border-amber-300">
              <Award className="w-3.5 h-3.5 stroke-[2.5]" />
              Achievements
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Milestones & Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect trophies as you build lifelong fitness habits.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex w-full sm:w-auto bg-white/90 border border-slate-200 p-1.5 rounded-2xl shadow-xs gap-1">
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setActiveTab("badges");
            }}
            className={`min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "badges"
                ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <Award className="w-3.5 h-3.5 stroke-[2.5]" /> Badges ({badgesData?.totalEarned || 0})
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setActiveTab("notifications");
            }}
            className={`min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
              activeTab === "notifications"
                ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <Bell className="w-3.5 h-3.5" /> Notifications
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Badges Grid View */}
      {activeTab === "badges" && (
        <div className="space-y-4">
          {isBadgesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Skeleton className="h-28 w-full rounded-3xl" />
              <Skeleton className="h-28 w-full rounded-3xl" />
              <Skeleton className="h-28 w-full rounded-3xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {badges.map((b) => (
                <GlassCard
                  key={b.code}
                  className={`p-4 sm:p-5 transition-all flex items-start gap-3.5 ${
                    b.isEarned
                      ? "border-amber-300/80 bg-amber-50/40 shadow-xs"
                      : "border-slate-200 bg-white/70 opacity-65"
                  }`}
                >
                  <div
                    className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 border ${
                      b.isEarned
                        ? "bg-amber-100 border-amber-300 shadow-sm"
                        : "bg-slate-100 border-slate-200 text-slate-400"
                    }`}
                  >
                    {b.isEarned ? (
                      getBadgeIcon(b.icon)
                    ) : (
                      <Lock className="w-5 h-5 text-slate-400 stroke-[2.5]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                        {b.name}
                      </h4>
                      {b.isEarned ? (
                        <span className="text-[10px] text-amber-800 font-black bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full shrink-0">
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                          Locked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">{b.description}</p>
                    {b.earnedAt && (
                      <span className="text-[10px] font-medium text-slate-400 mt-2 block">
                        Unlocked on {new Date(b.earnedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications Feed View */}
      {activeTab === "notifications" && (
        <NotificationCenter />
      )}
    </motion.div>
  );
};

export default BadgesPage;


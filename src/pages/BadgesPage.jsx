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
} from "lucide-react";
import { motion } from "motion/react";
import { haptics } from "../motion/Haptics";
import { toast } from "sonner";

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
      default:
        return <Award className="w-6 h-6 text-lime-600" />;
    }
  };

  const badges = badgesData?.badges || [];
  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header and Toggle Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider border border-amber-300">
              <Award className="w-3.5 h-3.5 stroke-[2.5]" />
              Achievements
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Milestones & Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect trophies as you build lifelong fitness habits.
          </p>
        </div>

        <div className="flex bg-white/90 border border-slate-200 p-1.5 rounded-2xl shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setActiveTab("badges");
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
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
        <GlassCard className="p-5 sm:p-6 bg-white/95 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Notification History
              </h3>
              <p className="text-xs text-slate-500">Live activity and alerts from your fitness squads</p>
            </div>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => markAllReadMutation.mutate()}
                className="text-xs font-bold"
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Mark All As Read
              </Button>
            )}
          </div>

          {isNotifsLoading ? (
            <Skeleton className="h-40 w-full rounded-2xl" />
          ) : notifications.length === 0 ? (
            <p className="text-xs text-slate-400 py-10 text-center font-medium">
              No in-app notifications right now. Keep crushing your goals!
            </p>
          ) : (
            <div className="space-y-2.5">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => {
                    if (!n.readAt) markSingleReadMutation.mutate(n._id);
                    if (n.data?.route) {
                      haptics.tick();
                      navigate(n.data.route);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 cursor-pointer transition-all ${
                    !n.readAt
                      ? "bg-lime-50/60 border-lime-300 shadow-xs"
                      : "bg-slate-50/60 border-slate-200/80 text-slate-600 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        !n.readAt
                          ? "bg-lime-100 text-lime-700 border border-lime-300"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      <Sparkles className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {n.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-snug">{n.body}</p>
                      <div className="flex flex-wrap items-center gap-2.5 mt-1">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        {n.data?.route && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!n.readAt) markSingleReadMutation.mutate(n._id);
                              haptics.tick();
                              navigate(n.data.route);
                            }}
                            className="text-[11px] font-bold text-lime-700 hover:text-lime-800 underline underline-offset-2 cursor-pointer"
                          >
                            {n.data?.actionLabel || "Open →"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {!n.readAt && (
                    <span className="w-2.5 h-2.5 rounded-full bg-lime-500 shadow-xs shrink-0 mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
};

export default BadgesPage;


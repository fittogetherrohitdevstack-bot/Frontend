import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { toast } from "sonner";
import { groupApi } from "../../api/endpoints";
import { Avatar } from "../ui/Avatar";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import { haptics } from "../../motion/Haptics";
import {
  Scale,
  Droplets,
  UtensilsCrossed,
  Flame,
  Award,
  Trophy,
  ChevronDown,
} from "lucide-react";

const EMOJIS = ["👏", "💪", "🔥", "❤️"];

const EVENT_STYLE_MAP = {
  logged_weight: {
    icon: Scale,
    badge: "Weight Log",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
  },
  water_goal: {
    icon: Droplets,
    badge: "Hydration",
    badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-200",
  },
  diet_completed: {
    icon: UtensilsCrossed,
    badge: "Diet Done",
    badgeClass: "bg-lime-100 text-lime-800 border-lime-200",
  },
  streak_milestone: {
    icon: Flame,
    badge: "Milestone",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
  },
  badge_earned: {
    icon: Award,
    badge: "Badge",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  challenge_won: {
    icon: Trophy,
    badge: "Challenge Win",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
  },
};

const formatRelTime = (iso) => {
  if (!iso) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return "Just now";
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

export const SquadFeedList = ({ groupId, currentUserId }) => {
  const queryClient = useQueryClient();
  const [events, setEvents] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFeed = async (cursor = null, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoadingInitial(true);

      const res = await groupApi.getFeed(groupId, cursor, 12);
      const data = res.data?.data || {};
      const fetched = data.events || [];

      setEvents((prev) => (append ? [...prev, ...fetched] : fetched));
      setNextCursor(data.nextCursor || null);
      setHasMore(Boolean(data.hasMore));
    } catch {
      // Keep graceful empty state
    } finally {
      setLoadingInitial(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      loadFeed(null, false);
    }
  }, [groupId]);

  const reactMutation = useMutation({
    mutationFn: ({ eventId, emoji }) => groupApi.reactFeedEvent(eventId, emoji),
    onSuccess: (res, { eventId }) => {
      haptics.tick();
      const updated = res.data?.data?.event;
      if (updated) {
        setEvents((prev) =>
          prev.map((ev) => (String(ev._id) === String(eventId) ? updated : ev))
        );
      }
      queryClient.invalidateQueries({ queryKey: ["squad-feed", groupId] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Could not react right now");
    },
  });

  if (loadingInitial) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (!events.length) {
    return (
      <GlassCard className="p-5 bg-white/95 text-center border-slate-200">
        <p className="text-sm font-black text-slate-900">Squad Social Feed</p>
        <p className="text-xs text-slate-500 mt-1">
          Log weight, hit water goals, complete your diet chart, or hit 3/7/14/30-day milestones to drop celebrations here!
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-2.5">
      {events.map((ev) => {
        const style = EVENT_STYLE_MAP[ev.type] || EVENT_STYLE_MAP.streak_milestone;
        const Icon = style.icon;
        const isSelf = String(ev.userId) === String(currentUserId);
        const displayName = isSelf ? "You" : ev.user?.name || "Teammate";

        return (
          <motion.div
            key={ev._id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar src={ev.user?.profileImage} name={ev.user?.name} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${style.badgeClass}`}
                    >
                      <Icon className="w-3 h-3" />
                      {style.badge}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {formatRelTime(ev.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 mt-1 leading-snug">
                    <span className="font-black">{displayName}</span> {ev.title}
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Reaction Bar (one toggleable reaction per user per emoji) */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {EMOJIS.map((emoji) => {
                const count = ev.reactionCounts?.[emoji] || 0;
                const active = (ev.myReactions || []).includes(emoji);
                return (
                  <motion.button
                    key={emoji}
                    type="button"
                    whileTap={{ scale: 0.84 }}
                    onClick={() => reactMutation.mutate({ eventId: ev._id, emoji })}
                    className={`min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-extrabold border inline-flex items-center gap-1 transition-all cursor-pointer ${
                      active
                        ? "bg-lime-100 border-lime-400 text-lime-900 shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>{emoji}</span>
                    {count > 0 && <span className="tabular-nums text-[11px]">{count}</span>}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      {hasMore && (
        <Button
          variant="secondary"
          size="md"
          isLoading={loadingMore}
          onClick={() => loadFeed(nextCursor, true)}
          className="w-full min-h-[44px]"
        >
          <ChevronDown className="w-4 h-4 mr-1.5" />
          Load Earlier Squad Milestones
        </Button>
      )}
    </div>
  );
};

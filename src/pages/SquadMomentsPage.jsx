import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Users,
  Sparkles,
  Plus,
  RefreshCw,
  Flame,
  Shield,
  Layers,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGroup } from "../context/GroupContext";
import { useAuth } from "../context/AuthContext";
import { momentApi } from "../api/endpoints";
import { MomentCategoryFilter } from "../components/moments/MomentCategoryFilter";
import { MomentCard } from "../components/moments/MomentCard";
import { CreateMomentSheet } from "../components/moments/CreateMomentSheet";
import { CommentsSheet } from "../components/moments/CommentsSheet";
import { ImageViewerModal } from "../components/moments/ImageViewerModal";
import { EditMomentModal } from "../components/moments/EditMomentModal";
import { MomentsSkeleton } from "../components/moments/MomentsSkeleton";
import { MomentsEmptyState } from "../components/moments/MomentsEmptyState";
import { haptics } from "../motion/Haptics";
import { toast } from "sonner";

export const SquadMomentsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { groups, activeGroup, selectGroup, isLoading: isGroupLoading } = useGroup();

  const [activeCategory, setActiveCategory] = useState("all");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [activeCommentsMoment, setActiveCommentsMoment] = useState(null);
  const [activeEditMoment, setActiveEditMoment] = useState(null);

  // Lightbox state
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    images: [],
    initialIndex: 0,
    author: null,
    caption: "",
    category: "",
  });

  const groupId = activeGroup?._id;

  // Fetch moments for the active squad
  const {
    data: momentsData,
    isLoading: isMomentsLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["squad-moments", groupId, activeCategory],
    queryFn: async () => {
      if (!groupId) return { moments: [], nextCursor: null, hasMore: false };
      const res = await momentApi.getMoments(groupId, {
        category: activeCategory !== "all" ? activeCategory : undefined,
        limit: 15,
      });
      return res.data?.data || { moments: [], nextCursor: null, hasMore: false };
    },
    enabled: !!groupId,
    staleTime: 1000 * 30, // 30s cache
  });

  const moments = momentsData?.moments || [];

  // Compute category counts from loaded moments
  const categoryCounts = moments.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, {});

  // Reaction mutation
  const reactMutation = useMutation({
    mutationFn: ({ momentId, emoji }) => momentApi.react(groupId, momentId, emoji),
    onMutate: async ({ momentId, emoji }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["squad-moments", groupId, activeCategory] });
      const previousData = queryClient.getQueryData(["squad-moments", groupId, activeCategory]);

      queryClient.setQueryData(["squad-moments", groupId, activeCategory], (old) => {
        if (!old || !old.moments) return old;
        return {
          ...old,
          moments: old.moments.map((m) => {
            if (m._id !== momentId) return m;

            const isSame = m.userReaction === emoji;
            const newUserReaction = isSame ? null : emoji;
            const diff = isSame ? -1 : m.userReaction ? 0 : 1;

            const newBreakdown = { ...(m.reactionBreakdown || {}) };
            if (m.userReaction) {
              newBreakdown[m.userReaction] = Math.max(0, (newBreakdown[m.userReaction] || 1) - 1);
              if (newBreakdown[m.userReaction] === 0) delete newBreakdown[m.userReaction];
            }
            if (newUserReaction) {
              newBreakdown[newUserReaction] = (newBreakdown[newUserReaction] || 0) + 1;
            }

            return {
              ...m,
              userReaction: newUserReaction,
              reactionsCount: Math.max(0, (m.reactionsCount || 0) + diff),
              reactionBreakdown: newBreakdown,
            };
          }),
        };
      });

      return { previousData };
    },
    onError: (err, vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["squad-moments", groupId, activeCategory], context.previousData);
      }
      toast.error(err.response?.data?.message || "Failed to react");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["squad-moments", groupId] });
    },
  });

  // Delete moment mutation
  const deleteMutation = useMutation({
    mutationFn: (momentId) => momentApi.delete(groupId, momentId),
    onSuccess: () => {
      haptics.tick();
      toast.success("Moment deleted");
      queryClient.invalidateQueries({ queryKey: ["squad-moments", groupId] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete moment");
    },
  });

  const handleOpenImageViewer = (images, initialIndex, author, caption, category) => {
    setViewerState({
      isOpen: true,
      images,
      initialIndex,
      author,
      caption,
      category,
    });
  };

  const handleCloseImageViewer = () => {
    setViewerState((prev) => ({ ...prev, isOpen: false }));
  };

  // If user has no active group
  if (!isGroupLoading && (!activeGroup || groups.length === 0)) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-lime-100 text-lime-800 flex items-center justify-center mx-auto shadow-sm">
          <Users className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Squad Moments is Private
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Join or launch a squad with your gym friends to unlock your private moments feed, gym selfies, and cheat meal celebrations.
          </p>
        </div>
        <Link
          to="/group"
          className="inline-flex items-center justify-center gap-2 min-h-[46px] px-6 rounded-2xl bg-slate-900 text-lime-300 font-extrabold text-xs shadow-lg hover:bg-slate-800 transition-colors"
        >
          <span>Go to Squad Hub</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const isAdmin = activeGroup?.createdBy === user?._id;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20 sm:pb-8">
      {/* 1. SQUAD MULTI-SELECTOR (when user belongs to >1 squad) */}
      {groups.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 px-1">
            Squad:
          </span>
          {groups.map((g) => {
            const isSelected = g._id === activeGroup._id;
            return (
              <button
                key={g._id}
                type="button"
                onClick={() => {
                  haptics.tick();
                  selectGroup(g);
                }}
                className={`shrink-0 min-h-[36px] px-3.5 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-slate-900 text-lime-400 border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {g.name}
              </button>
            );
          })}
        </div>
      )}

      {/* 2. COMPACT SQUAD MOMENTS HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white p-4 sm:p-5 border border-slate-800 shadow-[0_12px_36px_rgba(15,23,42,0.16)]">
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-lime-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-lime-400/20 text-lime-300 text-[10px] font-black uppercase tracking-wider border border-lime-400/30">
                <Sparkles className="w-3 h-3" />
                Squad Moments
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-[10px] font-bold">
                <Users className="w-3 h-3" />
                {activeGroup?.name || "Squad"}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Daily Moments & Hype
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md">
              Share gym selfies, PRs, cheat meals & funny moments with your friends.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                haptics.tick();
                refetch();
              }}
              disabled={isFetching}
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              title="Refresh feed"
              aria-label="Refresh feed"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                haptics.tick();
                setIsComposerOpen(true);
              }}
              className="min-h-[42px] px-4 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-black tracking-wide inline-flex items-center gap-1.5 shadow-md shadow-lime-400/25 active:scale-95 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Share Moment</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. HORIZONTAL CATEGORY FILTER PILLS */}
      <MomentCategoryFilter
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        categoryCounts={categoryCounts}
      />

      {/* 4. MOMENTS FEED */}
      {isMomentsLoading ? (
        <MomentsSkeleton />
      ) : moments.length === 0 ? (
        <MomentsEmptyState
          category={activeCategory}
          onOpenComposer={() => setIsComposerOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {moments.map((moment) => (
            <MomentCard
              key={moment._id}
              moment={moment}
              currentUserId={user?._id}
              isAdmin={isAdmin}
              onReact={(emoji) => reactMutation.mutate({ momentId: moment._id, emoji })}
              onOpenComments={(m) => setActiveCommentsMoment(m)}
              onOpenImageViewer={handleOpenImageViewer}
              onEdit={(m) => setActiveEditMoment(m)}
              onDelete={(mId) => deleteMutation.mutate(mId)}
            />
          ))}
        </div>
      )}

      {/* 5. FLOATING ACTION BUTTON (MOBILE-FIRST ACCESS) */}
      <div className="fixed bottom-22 sm:bottom-8 right-4 sm:right-8 z-30 lg:hidden">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            haptics.tick();
            setIsComposerOpen(true);
          }}
          className="min-h-[50px] px-5 rounded-full bg-slate-900 text-lime-400 border border-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.35)] flex items-center gap-2 text-xs font-black cursor-pointer"
          aria-label="Share new moment"
        >
          <Camera className="w-4 h-4 text-lime-400" />
          <span>Post</span>
        </motion.button>
      </div>

      {/* 6. CREATE POST SHEET */}
      <CreateMomentSheet
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        groupId={groupId}
      />

      {/* 7. COMMENTS BOTTOM SHEET */}
      <CommentsSheet
        isOpen={!!activeCommentsMoment}
        onClose={() => setActiveCommentsMoment(null)}
        groupId={groupId}
        moment={activeCommentsMoment}
        isAdmin={isAdmin}
      />

      {/* 8. FULLSCREEN LIGHTBOX IMAGE VIEWER */}
      <ImageViewerModal
        isOpen={viewerState.isOpen}
        onClose={handleCloseImageViewer}
        images={viewerState.images}
        initialIndex={viewerState.initialIndex}
        author={viewerState.author}
        caption={viewerState.caption}
        category={viewerState.category}
      />

      {/* 9. EDIT MOMENT MODAL */}
      <EditMomentModal
        isOpen={!!activeEditMoment}
        onClose={() => setActiveEditMoment(null)}
        groupId={groupId}
        moment={activeEditMoment}
      />
    </div>
  );
};

export default SquadMomentsPage;

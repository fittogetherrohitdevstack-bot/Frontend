import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Sparkles, RefreshCw, ArrowUpRight } from "lucide-react";
import { momentApi } from "../../api/endpoints";
import { MomentCategoryFilter } from "../moments/MomentCategoryFilter";
import { MomentCard } from "../moments/MomentCard";
import { CreateMomentSheet } from "../moments/CreateMomentSheet";
import { CommentsSheet } from "../moments/CommentsSheet";
import { ImageViewerModal } from "../moments/ImageViewerModal";
import { EditMomentModal } from "../moments/EditMomentModal";
import { MomentsSkeleton } from "../moments/MomentsSkeleton";
import { MomentsEmptyState } from "../moments/MomentsEmptyState";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";

export const SquadMomentsTab = ({ groupId, currentUserId, isAdmin = false }) => {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("all");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [activeCommentsMoment, setActiveCommentsMoment] = useState(null);
  const [activeEditMoment, setActiveEditMoment] = useState(null);

  const [viewerState, setViewerState] = useState({
    isOpen: false,
    images: [],
    initialIndex: 0,
    author: null,
    caption: "",
    category: "",
  });

  const {
    data: momentsData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["squad-moments", groupId, activeCategory],
    queryFn: async () => {
      if (!groupId) return { moments: [] };
      const res = await momentApi.getMoments(groupId, {
        category: activeCategory !== "all" ? activeCategory : undefined,
        limit: 12,
      });
      return res.data?.data || { moments: [] };
    },
    enabled: !!groupId,
  });

  const moments = momentsData?.moments || [];

  const categoryCounts = moments.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, {});

  const reactMutation = useMutation({
    mutationFn: ({ momentId, emoji }) => momentApi.react(groupId, momentId, emoji),
    onMutate: async ({ momentId, emoji }) => {
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

  return (
    <div className="space-y-4">
      {/* Action Header Card */}
      <div className="bg-white/95 border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black text-slate-900 tracking-tight">
              Squad Moments
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime-100 text-lime-800 border border-lime-200">
              {moments.length} Posts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily photos, cheat meals, PRs & squad banter
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/moments"
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
            title="Open dedicated Moments page"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setIsComposerOpen(true);
            }}
            className="min-h-[42px] px-3.5 sm:px-4 rounded-2xl bg-lime-500 hover:bg-lime-400 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Share Moment</span>
            <span className="sm:hidden">Post</span>
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <MomentCategoryFilter
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        categoryCounts={categoryCounts}
      />

      {/* Feed List */}
      {isLoading ? (
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
              currentUserId={currentUserId}
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

      {/* Modals */}
      <CreateMomentSheet
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        groupId={groupId}
      />

      <CommentsSheet
        isOpen={!!activeCommentsMoment}
        onClose={() => setActiveCommentsMoment(null)}
        groupId={groupId}
        moment={activeCommentsMoment}
        isAdmin={isAdmin}
      />

      <ImageViewerModal
        isOpen={viewerState.isOpen}
        onClose={() => setViewerState((prev) => ({ ...prev, isOpen: false }))}
        images={viewerState.images}
        initialIndex={viewerState.initialIndex}
        author={viewerState.author}
        caption={viewerState.caption}
        category={viewerState.category}
      />

      <EditMomentModal
        isOpen={!!activeEditMoment}
        onClose={() => setActiveEditMoment(null)}
        groupId={groupId}
        moment={activeEditMoment}
      />
    </div>
  );
};

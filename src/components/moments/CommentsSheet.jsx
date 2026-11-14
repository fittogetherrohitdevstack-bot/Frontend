import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Trash2, MessageSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatRelativeTime } from "../../utils/formatTime";
import { momentApi } from "../../api/endpoints";
import { Avatar } from "../ui/Avatar";
import { useAuth } from "../../context/AuthContext";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";

const QUICK_EMOJIS = ["🔥", "💪", "👏", "😂", "❤️", "🏆"];

export const CommentsSheet = ({
  isOpen,
  onClose,
  groupId,
  moment,
  isAdmin = false,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const momentId = moment?._id;

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["moment-comments", groupId, momentId],
    queryFn: async () => {
      if (!groupId || !momentId) return [];
      const res = await momentApi.getComments(groupId, momentId);
      return res.data?.data?.comments || [];
    },
    enabled: isOpen && !!groupId && !!momentId,
  });

  const addCommentMutation = useMutation({
    mutationFn: (text) => momentApi.addComment(groupId, momentId, text),
    onSuccess: () => {
      haptics.goal();
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["moment-comments", groupId, momentId] });
      queryClient.invalidateQueries({ queryKey: ["squad-moments", groupId] });
      // Scroll to bottom
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 100);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Could not post comment");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => momentApi.deleteComment(groupId, momentId, commentId),
    onSuccess: () => {
      haptics.tick();
      toast.success("Comment deleted");
      queryClient.invalidateQueries({ queryKey: ["moment-comments", groupId, momentId] });
      queryClient.invalidateQueries({ queryKey: ["squad-moments", groupId] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete comment");
    },
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 200);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    haptics.selection();
    addCommentMutation.mutate(commentText.trim());
  };

  const handleAddEmoji = (emoji) => {
    haptics.tick();
    setCommentText((prev) => (prev ? `${prev} ${emoji}` : emoji));
    inputRef.current?.focus();
  };

  if (!isOpen || !moment || typeof document === "undefined") return null;

  const isPostAuthor = moment.authorId?._id?.toString() === user?._id?.toString();

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Bottom Sheet Drawer */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 320 }}
          className="relative w-full sm:max-w-lg bg-white border border-slate-200/90 rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[88dvh] h-[85dvh] flex flex-col overflow-hidden"
        >
          {/* Top Drag Indicator */}
          <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Squad Comments
              </h3>
              <span className="text-xs font-black bg-lime-100 text-lime-800 px-2 py-0.5 rounded-full">
                {comments.length}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Moment Context Preview */}
          <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3 shrink-0">
            {moment.images?.[0] && (
              <img
                src={moment.images[0].url}
                alt="Moment thumbnail"
                className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                {moment.authorId?.name || "Squad Member"}
              </p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {moment.caption || "Shared a photo"}
              </p>
            </div>
          </div>

          {/* Comments List */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-slate-100/80"
          >
            {isLoading ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-bold">Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-lime-50 text-lime-700 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-800">No comments yet</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Be the first to hype up your squadmate on their workout or cheat meal!
                </p>
              </div>
            ) : (
              comments.map((comment) => {
                const isCommentAuthor =
                  comment.authorId?._id?.toString() === user?._id?.toString();
                const canDelete = isCommentAuthor || isPostAuthor || isAdmin;

                return (
                  <div key={comment._id} className="pt-3 first:pt-0 flex items-start gap-3 group">
                    <Avatar
                      src={comment.authorId?.profileImage}
                      name={comment.authorId?.name || "Member"}
                      size="sm"
                      ringColor="lime"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-extrabold text-slate-900 truncate">
                            {comment.authorId?.name || "Squad Member"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        </div>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Delete this comment?")) {
                                deleteCommentMutation.mutate(comment._id);
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 sm:transition-opacity text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 font-medium mt-0.5 leading-relaxed break-words">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sticky Quick Emojis & Input Footer (Safely above Mobile Nav Bar) */}
          <div className="p-3 pb-8 sm:pb-3.5 bg-white border-t border-slate-200/80 space-y-2 shrink-0">
            {/* Quick Emojis Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider shrink-0 px-1">
                Quick:
              </span>
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleAddEmoji(emoji)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-sm flex items-center justify-center transition-transform active:scale-90 cursor-pointer shrink-0"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Avatar
                src={user?.profileImage}
                name={user?.name || "Me"}
                size="sm"
                ringColor="lime"
              />
              <input
                ref={inputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={500}
                placeholder="Say something motivating..."
                className="flex-1 min-h-[44px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime-400 transition-colors"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || addCommentMutation.isPending}
                className="w-11 h-11 rounded-2xl bg-lime-500 hover:bg-lime-400 text-slate-950 flex items-center justify-center shadow-xs disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform cursor-pointer shrink-0"
                aria-label="Send comment"
              >
                {addCommentMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

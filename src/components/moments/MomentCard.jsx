import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Edit3,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { formatRelativeTime } from "../../utils/formatTime";
import { Avatar } from "../ui/Avatar";
import { ReactionPicker } from "./ReactionPicker";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";

const CATEGORY_STYLES = {
  gym: { label: "Gym", emoji: "💪", bg: "bg-purple-100 text-purple-800 border-purple-200" },
  cheat_meal: { label: "Cheat Meal", emoji: "🍕", bg: "bg-amber-100 text-amber-800 border-amber-200" },
  funny: { label: "Funny", emoji: "😂", bg: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  achievement: { label: "Achievement", emoji: "🏆", bg: "bg-lime-100 text-lime-800 border-lime-300" },
  squad: { label: "Squad", emoji: "👥", bg: "bg-sky-100 text-sky-800 border-sky-200" },
  daily: { label: "Daily Life", emoji: "🌿", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

export const MomentCard = ({
  moment,
  currentUserId,
  isAdmin = false,
  onReact,
  onOpenComments,
  onOpenImageViewer,
  onEdit,
  onDelete,
}) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  const images = moment.images || [];
  const currentImage = images[photoIndex] || images[0];
  const catStyle = CATEGORY_STYLES[moment.category] || CATEGORY_STYLES.gym;

  const isAuthor = moment.authorId?._id?.toString() === currentUserId?.toString();
  const canDelete = isAuthor || isAdmin;

  // Handle double tap to ❤️
  const handlePhotoTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Double tap detected!
      haptics.goal();
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 850);
      onReact("❤️");
    } else {
      // Single tap -> open full lightbox
      onOpenImageViewer(images, photoIndex, moment.authorId, moment.caption, moment.category);
    }
    setLastTap(now);
  };

  const handleCopyLink = () => {
    haptics.tick();
    const url = `${window.location.origin}/moments`;
    navigator.clipboard?.writeText(url);
    toast.success("Squad Moments link copied!");
    setShowMenu(false);
  };

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    haptics.tick();
    setPhotoIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    haptics.tick();
    setPhotoIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <article className="relative bg-white/95 border border-slate-200/90 rounded-3xl shadow-[0_4px_24px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition-all overflow-hidden flex flex-col">
      {/* 1. Header: Author & Metadata */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            src={moment.authorId?.profileImage}
            name={moment.authorId?.name || "Squad Member"}
            size="md"
            ringColor="lime"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight truncate max-w-[150px] sm:max-w-none">
                {moment.authorId?.name || "Squad Member"}
              </h3>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${catStyle.bg} inline-flex items-center gap-1`}
              >
                <span>{catStyle.emoji}</span>
                <span>{catStyle.label}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {formatRelativeTime(moment.createdAt)}
            </p>
          </div>
        </div>

        {/* More Options Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Post options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                className="absolute right-0 top-full mt-1 z-30 w-44 bg-white border border-slate-200/90 shadow-xl rounded-2xl p-1.5 space-y-0.5 text-xs font-bold"
              >
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full px-3 py-2 rounded-xl text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Moment Link</span>
                </button>

                {isAuthor && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(moment);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit Caption</span>
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      if (window.confirm("Are you sure you want to delete this moment?")) {
                        onDelete(moment._id);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-rose-50 flex items-center gap-2 text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Delete Moment</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. Photo Canvas (Responsive 4:5 or 1:1, Double Tap to React) */}
      <div
        className="relative w-full aspect-square sm:aspect-[4/3] bg-slate-950 overflow-hidden cursor-pointer select-none group"
        onClick={handlePhotoTap}
      >
        {currentImage?.url && (
          <img
            src={currentImage.url}
            alt={moment.caption || "Squad moment photo"}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
          />
        )}

        {/* Double Tap Heart Burst Animation */}
        <AnimatePresence>
          {showHeartBurst && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            >
              <div className="w-24 h-24 rounded-full bg-rose-500/80 backdrop-blur-md flex items-center justify-center text-white shadow-2xl">
                <Heart className="w-14 h-14 fill-white stroke-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gallery Navigation Controls (when > 1 photo) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevPhoto}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-950/90 text-white flex items-center justify-center backdrop-blur-sm opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextPhoto}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-950/90 text-white flex items-center justify-center backdrop-blur-sm opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Top Right Counter Badge */}
            <span className="absolute top-3 right-3 text-[10px] font-black tracking-wider text-white bg-slate-950/70 backdrop-blur-md px-2 py-0.5 rounded-full pointer-events-none">
              {photoIndex + 1} / {images.length}
            </span>

            {/* Bottom Dots Indicator */}
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 pointer-events-none z-10">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    photoIndex === idx ? "w-5 bg-lime-400" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 3. Social Interaction Bar (Reactions, Comments, Share) */}
      <div className="p-3.5 sm:p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 relative">
            {/* Main Reaction Trigger Button */}
            <button
              type="button"
              onClick={() => {
                if (moment.userReaction) {
                  // If already reacted, clicking toggles it off
                  onReact(moment.userReaction);
                } else {
                  setShowPicker(!showPicker);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowPicker(true);
              }}
              className={`min-h-[40px] px-3 rounded-2xl border text-xs font-black inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                moment.userReaction
                  ? "bg-rose-50 border-rose-200 text-rose-600 shadow-xs"
                  : "bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {moment.userReaction ? (
                <span className="text-base">{moment.userReaction}</span>
              ) : (
                <Heart className="w-4 h-4 text-slate-500" />
              )}
              <span>{moment.reactionsCount || 0}</span>
            </button>

            {/* Quick Popover Trigger Arrow */}
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs cursor-pointer transition-colors"
              title="Pick reaction emoji"
              aria-label="Pick reaction emoji"
            >
              ✨
            </button>

            {/* Reaction Picker Floating Bar */}
            <ReactionPicker
              isOpen={showPicker}
              onClose={() => setShowPicker(false)}
              currentReaction={moment.userReaction}
              onSelectReaction={(emoji) => onReact(emoji)}
              position="top"
            />

            {/* Comments Action Button */}
            <button
              type="button"
              onClick={() => onOpenComments(moment)}
              className="min-h-[40px] px-3 rounded-2xl bg-slate-50 border border-slate-200/90 hover:bg-slate-100 text-slate-700 text-xs font-black inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-slate-500" />
              <span>{moment.commentsCount || 0}</span>
            </button>
          </div>

          {/* Share Moment Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200/90 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title="Share moment"
            aria-label="Share moment"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* 4. Reaction Breakdown Emojis Strip */}
        {moment.reactionBreakdown && Object.keys(moment.reactionBreakdown).length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {Object.entries(moment.reactionBreakdown).map(([emoji, count]) => (
              <span
                key={emoji}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-full text-slate-700"
              >
                <span>{emoji}</span>
                <span className="text-[10px] text-slate-500">{count}</span>
              </span>
            ))}
          </div>
        )}

        {/* 5. Caption with Read More Toggle */}
        {moment.caption && (
          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed pt-0.5">
            <span className="font-black text-slate-900 mr-1.5">
              {moment.authorId?.name || "Squad Member"}
            </span>
            <span>
              {captionExpanded || moment.caption.length <= 110
                ? moment.caption
                : `${moment.caption.slice(0, 110)}...`}
            </span>
            {moment.caption.length > 110 && (
              <button
                type="button"
                onClick={() => setCaptionExpanded(!captionExpanded)}
                className="ml-1 text-slate-500 font-bold hover:text-slate-900 cursor-pointer"
              >
                {captionExpanded ? "less" : "more"}
              </button>
            )}
          </div>
        )}

        {/* 6. Comments Preview & Open Drawer Trigger */}
        <div className="pt-1 border-t border-slate-100 space-y-1.5">
          {moment.recentComments && moment.recentComments.length > 0 && (
            <div className="space-y-1">
              {moment.recentComments.map((c) => (
                <div key={c._id} className="text-xs text-slate-700 flex items-start gap-1.5">
                  <span className="font-extrabold text-slate-900 truncate max-w-[120px]">
                    {c.authorId?.name || "Member"}:
                  </span>
                  <span className="truncate flex-1 text-slate-600 font-medium">{c.text}</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => onOpenComments(moment)}
            className="text-[11px] font-bold text-slate-500 hover:text-lime-700 transition-colors block cursor-pointer"
          >
            {moment.commentsCount > 0
              ? `View all ${moment.commentsCount} comments...`
              : "Add a comment for the squad..."}
          </button>
        </div>
      </div>
    </article>
  );
};

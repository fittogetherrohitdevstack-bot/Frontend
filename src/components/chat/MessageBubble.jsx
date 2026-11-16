import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MoreVertical,
  Reply,
  Edit3,
  Trash2,
  Smile,
  Copy,
  Check,
  CheckCheck,
  AlertCircle,
  X,
} from "lucide-react";
import { formatMessageTime } from "../../utils/chatDateUtils";
import { ReactionPicker } from "./ReactionPicker";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";

const QUICK_EMOJIS = ["❤️", "🔥", "💪", "😂", "👍", "👏"];

export const MessageBubble = ({
  message,
  isFirstInGroup,
  isLastInGroup,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onReact,
  canModerate = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);

  const senderId = message.sender?._id || message.sender?.id || message.sender;
  const isAuthor = Boolean(currentUserId && String(senderId) === String(currentUserId));
  const isMine = Boolean(message.isMine) || isAuthor;
  const isDeleted = Boolean(message.isDeleted);
  const canDelete = isAuthor || canModerate;

  // Formatted timestamp
  const timeFormatted = formatMessageTime(message.createdAt);

  // Group reactions by emoji: { [emoji]: { count: number, hasReacted: boolean } }
  const reactionMap = (message.reactions || []).reduce((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = { count: 0, hasReacted: false };
    }
    acc[r.emoji].count += 1;
    if (currentUserId && String(r.userId) === String(currentUserId)) {
      acc[r.emoji].hasReacted = true;
    }
    return acc;
  }, {});

  const handleCopyText = () => {
    if (message.text && !isDeleted) {
      navigator.clipboard?.writeText(message.text);
      haptics.tick();
      toast.success("Copied to clipboard");
      setShowActionModal(false);
    }
  };

  const scrollToReply = (replyId) => {
    if (!replyId) return;
    const el = document.getElementById(`msg-${replyId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-lime-400", "transition-all");
      setTimeout(() => el.classList.remove("ring-2", "ring-lime-400"), 1600);
    }
  };

  return (
    <motion.div
      id={`msg-${message._id}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`group relative flex flex-col ${isMine ? "items-end" : "items-start"} ${
        isFirstInGroup ? "mt-3" : "mt-0.5"
      } px-3 sm:px-4`}
    >
      {/* Sender Name (Teammate only, first in group) */}
      {!isMine && isFirstInGroup && (
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-10 mb-1 flex items-center gap-1.5">
          {message.sender?.name || "Squadmate"}
        </span>
      )}

      <div
        className={`flex items-end gap-2 max-w-[88%] sm:max-w-[78%] ${
          isMine ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Teammate Avatar */}
        {!isMine && (
          <div className="w-8 h-8 shrink-0 mb-0.5">
            {isLastInGroup ? (
              message.sender?.profileImage ? (
                <img
                  src={message.sender.profileImage}
                  alt={message.sender.name || "Squadmate"}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shadow-xs">
                  {message.sender?.name?.charAt(0).toUpperCase() || "S"}
                </div>
              )
            ) : (
              <div className="w-8" />
            )}
          </div>
        )}

        {/* Message Bubble Body */}
        <div className="relative group/bubble flex flex-col">
          {/* Reply Quote Banner */}
          {message.replyTo && (
            <div
              onClick={() => scrollToReply(message.replyTo._id)}
              className={`text-xs px-2.5 py-1.5 mb-1 rounded-xl cursor-pointer border-l-3 transition-colors ${
                isMine
                  ? "bg-lime-500/15 border-lime-600 text-lime-950 dark:text-lime-200"
                  : "bg-slate-100 dark:bg-slate-800/80 border-lime-500 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-[10px] text-lime-600 dark:text-lime-400">
                <Reply className="w-2.5 h-2.5" />
                <span>{message.replyTo.senderName || "Squadmate"}</span>
              </div>
              <p className="truncate text-[11px] max-w-[240px] mt-0.5 italic text-slate-600 dark:text-slate-300">
                {message.replyTo.text}
              </p>
            </div>
          )}

          {/* Core Bubble Content */}
          <div
            onClick={() => {
              if (window.innerWidth < 1024 && !isDeleted) {
                haptics.tick();
                setShowActionModal(true);
              }
            }}
            className={`px-3.5 py-2.5 text-[13.5px] sm:text-sm leading-relaxed select-text break-words transition-shadow ${
              isMine
                ? "bg-gradient-to-tr from-[#9EE616] to-[#84CC16] text-slate-950 font-medium rounded-2xl rounded-tr-xs shadow-sm shadow-lime-500/20"
                : isDeleted
                ? "bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 italic border border-slate-200/60 dark:border-slate-800 rounded-2xl rounded-tl-xs"
                : "bg-white dark:bg-slate-800/95 text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl rounded-tl-xs shadow-xs"
            }`}
          >
            <p className="whitespace-pre-wrap">{message.text}</p>

            {/* Bubble Footer: Edited label & Timestamp & Status */}
            <div
              className={`flex items-center justify-end gap-1.5 text-[10px] mt-1 select-none ${
                isMine ? "text-slate-800/80" : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {message.editedAt && !isDeleted && <span className="italic">edited</span>}
              <span>{timeFormatted}</span>
              {isMine && (
                message.isFailed ? (
                  <span className="flex items-center text-red-600 font-bold" title="Failed to send">
                    <AlertCircle className="w-3 h-3 ml-0.5" />
                  </span>
                ) : message.isOptimistic ? (
                  <span className="w-2.5 h-2.5 rounded-full border border-current border-t-transparent animate-spin ml-0.5" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5 text-slate-900/80 inline" />
                )
              )}
            </div>
          </div>

          {/* Desktop Hover Action Toolbar */}
          {!isDeleted && (
            <div
              className={`hidden lg:flex absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-all duration-150 items-center gap-1 z-10 ${
                isMine ? "right-full mr-2" : "left-full ml-2"
              }`}
            >
              <div className="flex items-center bg-white dark:bg-slate-800 rounded-full border border-slate-200/90 dark:border-slate-700 shadow-md p-0.5">
                <button
                  type="button"
                  onClick={() => setShowPicker((p) => !p)}
                  className="p-1 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="React"
                >
                  <Smile className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onReply(message)}
                  className="p-1 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Reply"
                >
                  <Reply className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="p-1 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Copy"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {isAuthor && (
                  <button
                    type="button"
                    onClick={() => onEdit(message)}
                    className="p-1 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(message._id)}
                    className="p-1 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Reaction Picker Popover */}
          <ReactionPicker
            isOpen={showPicker}
            onClose={() => setShowPicker(false)}
            onSelect={(emoji) => onReact(message._id, emoji)}
            position={isMine ? "top-right" : "top-left"}
          />
        </div>
      </div>

      {/* Emoji Reactions Tray below Bubble */}
      {Object.keys(reactionMap).length > 0 && !isDeleted && (
        <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "mr-1" : "ml-10"}`}>
          {Object.entries(reactionMap).map(([emoji, data]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                haptics.tick();
                onReact(message._id, emoji);
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                data.hasReacted
                  ? "bg-lime-500/20 border-lime-500/50 text-lime-700 dark:text-lime-300 shadow-2xs font-bold"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <span>{emoji}</span>
              <span className="text-[10px]">{data.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Mobile Action Bottom Sheet */}
      <AnimatePresence>
        {showActionModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActionModal(false)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs lg:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl p-5 border-t border-slate-200 dark:border-slate-800 shadow-2xl lg:hidden safe-bottom"
            >
              {/* Quick Emojis Row */}
              <div className="flex items-center justify-around py-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      try { haptics?.tick?.(); } catch (_) {}
                      onReact(message._id, emoji);
                      setShowActionModal(false);
                    }}
                    className="p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-2xl active:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowActionModal(false);
                    onReply(message);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm"
                >
                  <Reply className="w-4 h-4 text-lime-600 dark:text-lime-400" />
                  <span>Reply to message</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy text</span>
                </button>

                {isAuthor && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionModal(false);
                      onEdit(message);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm"
                  >
                    <Edit3 className="w-4 h-4 text-amber-500" />
                    <span>Edit message</span>
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionModal(false);
                      onDelete(message._id);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-sm"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span>Delete message</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

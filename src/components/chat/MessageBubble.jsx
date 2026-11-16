import React, { useState } from "react";
import { motion } from "motion/react";
import { MoreVertical, Reply, Edit3, Trash2, Smile, Check, CheckCheck } from "lucide-react";
import { formatMessageTime } from "../../utils/chatDateUtils";
import { ReactionPicker } from "./ReactionPicker";
import { haptics } from "../../motion/Haptics";

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
  const [showMenu, setShowMenu] = useState(false);

  const isMine = Boolean(message.isMine);
  const isDeleted = Boolean(message.isDeleted);
  const isAuthor = String(message.sender?._id) === String(currentUserId);
  const canDelete = isAuthor || canModerate;

  // Formatted timestamp
  const timeFormatted = formatMessageTime(message.createdAt);

  // Group reactions by emoji: { [emoji]: { count: number, hasReacted: boolean } }
  const reactionMap = (message.reactions || []).reduce((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = { count: 0, hasReacted: false };
    }
    acc[r.emoji].count += 1;
    if (String(r.userId) === String(currentUserId)) {
      acc[r.emoji].hasReacted = true;
    }
    return acc;
  }, {});

  const scrollToReply = (replyId) => {
    if (!replyId) return;
    const el = document.getElementById(`msg-${replyId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-lime-400/80", "transition-all");
      setTimeout(() => el.classList.remove("ring-2", "ring-lime-400/80"), 1600);
    }
  };

  return (
    <motion.div
      id={`msg-${message._id}`}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.16 }}
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

      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${isMine ? "flex-row-reverse" : "flex-row"}`}>
        {/* Teammate Avatar */}
        {!isMine && (
          <div className="w-8 h-8 shrink-0 mb-0.5">
            {isLastInGroup ? (
              message.sender?.profileImage ? (
                <img
                  src={message.sender.profileImage}
                  alt={message.sender.name}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
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
              className={`text-xs px-3 py-1.5 mb-1 rounded-xl cursor-pointer border border-black/5 dark:border-white/10 ${
                isMine
                  ? "bg-lime-600/20 text-lime-950 dark:text-lime-200"
                  : "bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-1 font-semibold text-[10px] opacity-80">
                <Reply className="w-3 h-3" />
                <span>{message.replyTo.senderName}</span>
              </div>
              <p className="truncate text-[11px] max-w-[240px] mt-0.5 italic">
                {message.replyTo.text}
              </p>
            </div>
          )}

          {/* Core Bubble Content */}
          <div
            className={`px-3.5 py-2.5 rounded-2xl text-[13.5px] sm:text-sm leading-relaxed shadow-xs select-text break-words ${
              isMine
                ? "bg-gradient-to-br from-lime-400 to-lime-500 text-slate-950 font-medium rounded-br-xs shadow-lime-500/10"
                : isDeleted
                ? "bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 italic border border-slate-200/60 dark:border-slate-800 rounded-bl-xs"
                : "bg-white dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700/60 rounded-bl-xs shadow-slate-200/40"
            }`}
          >
            <p className="whitespace-pre-wrap">{message.text}</p>

            {/* Bubble Footer: Edited label & Timestamp */}
            <div
              className={`flex items-center justify-end gap-1 text-[10px] mt-1 select-none ${
                isMine ? "text-slate-800/75" : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {message.editedAt && !isDeleted && <span className="italic">edited</span>}
              <span>{timeFormatted}</span>
              {isMine && (
                message.isOptimistic ? (
                  <span className="w-2.5 h-2.5 rounded-full border border-current border-t-transparent animate-spin ml-0.5" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5 text-slate-900/80 inline" />
                )
              )}
            </div>
          </div>

          {/* Hover / Long-press Action Trigger */}
          {!isDeleted && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-0.5 ${
                isMine ? "-left-18" : "-right-18"
              }`}
            >
              <button
                type="button"
                onClick={() => setShowPicker((p) => !p)}
                className="p-1 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 hover:scale-110 active:scale-95 transition-transform"
                title="React"
              >
                <Smile className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onReply(message)}
                className="p-1 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 hover:scale-110 active:scale-95 transition-transform"
                title="Reply"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMenu((m) => !m)}
                  className="p-1 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 hover:scale-110 active:scale-95 transition-transform"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {/* Context Menu Dropdown */}
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-32 py-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs">
                      {isAuthor && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            onEdit(message);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            onDelete(message._id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Reaction Picker Popover */}
          <ReactionPicker
            isOpen={showPicker}
            onClose={() => setShowPicker(false)}
            onSelect={(emoji) => onReact(message._id, emoji)}
            position="top"
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
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                data.hasReacted
                  ? "bg-lime-500/15 border-lime-500/35 text-lime-700 dark:text-lime-300 shadow-xs"
                  : "bg-white/90 dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <span>{emoji}</span>
              <span className="text-[10px] font-bold">{data.count}</span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

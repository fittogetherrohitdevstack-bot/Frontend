import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { formatDateDivider } from "../../utils/chatDateUtils";
import { MessageBubble } from "./MessageBubble";
import { ArrowDown, MessageSquare, Sparkles } from "lucide-react";
import { haptics } from "../../motion/Haptics";

const getDateDividerLabel = (dateStr) => {
  return formatDateDivider(dateStr);
};

export const MessageList = ({
  messages = [],
  isLoading = false,
  isLoadingOlder = false,
  hasMoreOlder = false,
  onLoadOlder,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onReact,
  canModerate = false,
}) => {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isNearBottomRef = useRef(true);

  // Maintain scroll position when older messages are prepended
  useLayoutEffect(() => {
    if (containerRef.current && prevScrollHeightRef.current > 0) {
      const newScrollHeight = containerRef.current.scrollHeight;
      const heightDiff = newScrollHeight - prevScrollHeightRef.current;
      if (heightDiff > 0) {
        containerRef.current.scrollTop += heightDiff;
      }
      prevScrollHeightRef.current = 0;
    }
  }, [messages.length]);

  // Handle scroll events
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

    // Check if near bottom (< 120px from bottom)
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    isNearBottomRef.current = distanceFromBottom < 120;
    setShowScrollBottom(distanceFromBottom > 240);

    // Trigger load older messages when scrolled near top
    if (scrollTop < 40 && hasMoreOlder && !isLoadingOlder && typeof onLoadOlder === "function") {
      prevScrollHeightRef.current = scrollHeight;
      onLoadOlder();
    }
  };

  // Auto-scroll to bottom on initial load or new messages if near bottom
  useEffect(() => {
    if (isNearBottomRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const scrollToBottom = () => {
    haptics.tick();
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`flex items-end gap-2.5 ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
          >
            {i % 2 !== 0 && <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />}
            <div
              className={`h-12 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60 animate-pulse ${
                i % 2 === 0 ? "w-48 sm:w-64" : "w-56 sm:w-80"
              }`}
            />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-lime-400/20 to-emerald-500/20 border border-lime-500/30 flex items-center justify-center text-lime-600 dark:text-lime-400 mb-4 shadow-lg shadow-lime-500/10">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          Squad Chat is Ready! 🔥
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mt-1 leading-relaxed">
          Cheer on your teammates, coordinate today's workout, and keep your squad streak burning!
        </p>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold text-slate-600 dark:text-slate-300 mt-4 border border-slate-200 dark:border-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-lime-500" />
          <span>Say hello to the squad</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto overscroll-contain py-3 relative"
    >
      {/* Loading older messages indicator */}
      {isLoadingOlder && (
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 font-medium">
            <span className="w-3 h-3 rounded-full border-2 border-lime-500 border-t-transparent animate-spin" />
            <span>Loading older messages...</span>
          </div>
        </div>
      )}

      {/* Messages with Date Separators & Consecutive Grouping */}
      {messages.map((msg, index) => {
        const prevMsg = messages[index - 1];
        const nextMsg = messages[index + 1];

        // Check date divider
        const currentDateLabel = getDateDividerLabel(msg.createdAt);
        const prevDateLabel = prevMsg ? getDateDividerLabel(prevMsg.createdAt) : null;
        const showDateDivider = !prevMsg || currentDateLabel !== prevDateLabel;

        // Group consecutive messages: within 5 minutes from same sender
        const isSameSenderAsPrev =
          prevMsg &&
          String(prevMsg.sender?._id) === String(msg.sender?._id) &&
          new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 5 * 60 * 1000;

        const isSameSenderAsNext =
          nextMsg &&
          String(nextMsg.sender?._id) === String(msg.sender?._id) &&
          new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() < 5 * 60 * 1000;

        const isFirstInGroup = !isSameSenderAsPrev;
        const isLastInGroup = !isSameSenderAsNext;

        return (
          <React.Fragment key={msg._id || index}>
            {showDateDivider && (
              <div className="flex items-center justify-center my-4 select-none">
                <span className="px-3 py-1 rounded-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 shadow-2xs">
                  {currentDateLabel}
                </span>
              </div>
            )}
            <MessageBubble
              message={msg}
              isFirstInGroup={isFirstInGroup}
              isLastInGroup={isLastInGroup}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReact={onReact}
              canModerate={canModerate}
            />
          </React.Fragment>
        );
      })}

      <div ref={bottomRef} className="h-2" />

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="fixed bottom-20 right-4 sm:right-8 z-30 p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xl hover:scale-105 active:scale-95 transition-all"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

import React from "react";
import { motion, AnimatePresence } from "motion/react";

export const TypingIndicator = ({ typingUsers = [] }) => {
  if (!typingUsers.length) return null;

  const displayText =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : typingUsers.length === 2
      ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
      : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 w-fit text-xs text-slate-600 dark:text-slate-300 shadow-sm"
      >
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </span>
        <span className="font-medium text-[11px] truncate max-w-[200px]">{displayText}</span>
      </motion.div>
    </AnimatePresence>
  );
};

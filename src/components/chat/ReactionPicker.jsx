import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../../motion/Haptics";

const QUICK_EMOJIS = ["❤️", "🔥", "💪", "😂", "👍", "👏"];

export const ReactionPicker = ({ isOpen, onClose, onSelect, position = "top" }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: position === "top" ? 8 : -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ type: "spring", stiffness: 450, damping: 28 }}
        className={`absolute z-50 ${
          position === "top" ? "bottom-full mb-2" : "top-full mt-2"
        } left-2 sm:left-4 flex items-center gap-1 p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-full border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-black/10`}
      >
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              haptics.tick();
              onSelect(emoji);
              onClose();
            }}
            className="w-9 h-9 flex items-center justify-center text-xl rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-125 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

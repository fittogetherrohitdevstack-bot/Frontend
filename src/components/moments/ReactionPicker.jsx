import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../../motion/Haptics";

export const MOMENT_REACTIONS = [
  { emoji: "❤️", label: "Love" },
  { emoji: "😂", label: "Haha" },
  { emoji: "💪", label: "Strong" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "👏", label: "Clap" },
  { emoji: "😭", label: "Crying" },
];

export const ReactionPicker = ({
  isOpen,
  onClose,
  onSelectReaction,
  currentReaction = null,
  position = "top", // 'top' or 'bottom'
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.85, y: position === "top" ? -6 : 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: position === "top" ? -4 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
          className={`absolute left-0 z-40 bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_12px_32px_rgba(15,23,42,0.18)] rounded-full px-2.5 py-1.5 flex items-center gap-1 sm:gap-2 ${
            position === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {MOMENT_REACTIONS.map((item) => {
            const isSelected = currentReaction === item.emoji;

            return (
              <motion.button
                key={item.emoji}
                type="button"
                whileHover={{ scale: 1.35, y: -3 }}
                whileTap={{ scale: 0.85 }}
                onClick={(e) => {
                  e.stopPropagation();
                  haptics.tick();
                  onSelectReaction(item.emoji);
                  onClose();
                }}
                className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xl sm:text-2xl cursor-pointer transition-colors ${
                  isSelected ? "bg-lime-100 ring-2 ring-lime-400" : "hover:bg-slate-100"
                }`}
                title={item.label}
                aria-label={`React with ${item.label}`}
              >
                <span>{item.emoji}</span>
                {isSelected && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-lime-600" />
                )}
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

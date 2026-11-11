import React from "react";
import { motion } from "motion/react";
import { haptics } from "../../motion/Haptics";

/**
 * Chip
 * Interactive or static tag pill for Light Theme.
 */
export const Chip = ({
  children,
  variant = "default", // 'default' | 'lime' | 'violet' | 'cyan' | 'coral' | 'orange'
  active = false,
  interactive = false,
  onClick,
  className = "",
}) => {
  const handleClick = (e) => {
    if (interactive) haptics.tick();
    if (onClick) onClick(e);
  };

  const variants = {
    default: active
      ? "bg-lime-500 text-slate-950 font-bold border-lime-500 shadow-sm"
      : "bg-slate-100 text-slate-700 border-slate-200",
    lime: active
      ? "bg-lime-500 text-white border-lime-600 shadow-sm"
      : "bg-lime-50 text-lime-800 border-lime-200",
    violet: active
      ? "bg-purple-600 text-white border-purple-700 shadow-sm"
      : "bg-purple-50 text-purple-800 border-purple-200",
    cyan: active
      ? "bg-cyan-600 text-white border-cyan-700 shadow-sm"
      : "bg-cyan-50 text-cyan-800 border-cyan-200",
    coral: active
      ? "bg-rose-500 text-white border-rose-600 shadow-sm"
      : "bg-rose-50 text-rose-800 border-rose-200",
    orange: active
      ? "bg-orange-500 text-white border-orange-600 shadow-sm"
      : "bg-orange-50 text-orange-800 border-orange-200",
  };

  const Component = interactive ? motion.button : "span";
  const motionProps = interactive
    ? {
        whileTap: { scale: 0.94 },
        transition: { type: "spring", stiffness: 500, damping: 25 },
      }
    : {};

  return (
    <Component
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors select-none ${
        variants[variant] || variants.default
      } ${interactive ? "cursor-pointer" : ""} ${className}`}
      {...motionProps}
    >
      {children}
    </Component>
  );
};

export default Chip;

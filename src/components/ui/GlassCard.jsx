import React from "react";
import { motion } from "motion/react";

/**
 * GlassCard
 * Bento-grid crisp translucent surface for high-energy Light Theme.
 * Features 1px border highlight and athletic colored ambient glows.
 */
export const GlassCard = ({
  children,
  className = "",
  glow = "none", // 'none' | 'lime' | 'violet' | 'coral' | 'cyan' | 'orange'
  interactive = false,
  onClick,
  ...props
}) => {
  const glowClasses = {
    none: "",
    lime: "shadow-[0_10px_35px_-8px_rgba(132,204,22,0.25)] border-lime-300/80",
    violet: "shadow-[0_10px_35px_-8px_rgba(124,58,237,0.2)] border-purple-200/90",
    coral: "shadow-[0_10px_35px_-8px_rgba(225,29,72,0.2)] border-rose-200/90",
    cyan: "shadow-[0_10px_35px_-8px_rgba(6,182,212,0.22)] border-cyan-200/90",
    orange: "shadow-[0_10px_35px_-8px_rgba(234,88,12,0.22)] border-orange-200/90",
  };

  const Component = interactive ? motion.div : "div";
  const motionProps = interactive
    ? {
        whileTap: { scale: 0.98 },
        transition: { type: "spring", stiffness: 450, damping: 25 },
      }
    : {};

  return (
    <Component
      onClick={onClick}
      className={`relative rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05),inset_0_1px_0_0_rgba(255,255,255,0.9)] transition-all duration-300 ${
        glowClasses[glow] || ""
      } ${interactive ? "cursor-pointer hover:border-slate-300 hover:shadow-md active:border-slate-400" : ""} ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export default GlassCard;

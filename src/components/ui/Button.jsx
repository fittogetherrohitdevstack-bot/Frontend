import React from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { haptics } from "../../motion/Haptics";

/**
 * Button
 * Tactile, high-energy button with sheen sweep and press feedback.
 * Optimized for high-contrast, premium Light Theme.
 */
export const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) => {
  const handleClick = (e) => {
    if (disabled || isLoading) return;
    haptics.tick();
    if (onClick) onClick(e);
  };

  const baseStyles =
    "relative inline-flex items-center justify-center font-bold tracking-tight rounded-2xl overflow-hidden select-none cursor-pointer focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none group";

  const variants = {
    primary:
      "bg-gradient-to-r from-[#84CC16] via-[#65A30D] to-[#10B981] text-white shadow-[0_4px_20px_rgba(101,163,13,0.3)] hover:shadow-[0_6px_25px_rgba(101,163,13,0.45)] border border-lime-500/40",
    violet:
      "bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_25px_rgba(124,58,237,0.45)] border border-purple-500/30",
    cyan:
      "bg-gradient-to-r from-[#0284C7] to-[#06B6D4] text-white shadow-[0_4px_20px_rgba(2,132,199,0.3)] hover:shadow-[0_6px_25px_rgba(2,132,199,0.45)] border border-sky-500/30",
    secondary:
      "bg-slate-100 hover:bg-slate-200/90 text-slate-800 border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.06)]",
    outline:
      "border-2 border-lime-600/70 hover:bg-lime-50 text-lime-700 hover:border-lime-600 shadow-sm",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent",
    danger:
      "bg-gradient-to-r from-[#E11D48] to-[#BE123C] text-white shadow-[0_4px_20px_rgba(225,29,72,0.3)] border border-rose-500/30",
    eaten:
      "bg-lime-100 text-lime-800 border border-lime-300 hover:bg-lime-200/80 shadow-sm",
    skipped:
      "bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200/70",
  };

  const sizes = {
    sm: "min-h-[38px] px-3.5 text-xs gap-1.5",
    md: "min-h-[46px] px-5 text-sm gap-2",
    lg: "min-h-[52px] px-6 text-base gap-2.5",
    icon: "min-h-[44px] min-w-[44px] p-2.5",
  };

  return (
    <motion.button
      type={type}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {/* Sheen sweep animation on hover */}
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : null}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
};

export default Button;

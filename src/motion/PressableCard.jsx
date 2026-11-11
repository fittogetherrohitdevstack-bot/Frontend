import React from "react";
import { motion } from "motion/react";
import { triggerHaptic } from "./Haptics";
import { springs } from "./tokens";

export const PressableCard = ({
  children,
  onClick,
  className = "",
  pressScale = 0.97,
  haptic = "tick",
  disabled = false,
  ...props
}) => {
  const handleClick = (e) => {
    if (disabled) return;
    if (haptic) triggerHaptic(haptic);
    onClick?.(e);
  };

  return (
    <motion.div
      whileTap={disabled ? undefined : { scale: pressScale }}
      transition={springs.snappy}
      onClick={handleClick}
      className={`select-none cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

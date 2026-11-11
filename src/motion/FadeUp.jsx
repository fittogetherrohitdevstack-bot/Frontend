import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { springs, durations, easings } from "./tokens";

export const FadeUp = ({
  children,
  delay = 0,
  duration = durations.base,
  distance = 20,
  className = "",
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : distance,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: durations.fast }
        : {
            duration,
            delay,
            ease: easings.easeOutExpo,
          },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

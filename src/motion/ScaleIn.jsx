import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { springs } from "./tokens";

export const ScaleIn = ({
  children,
  delay = 0,
  initialScale = 0.92,
  className = "",
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    hidden: {
      opacity: 0,
      scale: shouldReduceMotion ? 1 : initialScale,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        ...springs.snappy,
        delay,
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

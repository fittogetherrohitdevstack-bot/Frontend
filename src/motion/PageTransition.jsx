import React from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * PageTransition
 * Direction-aware slide/fade page transitions.
 */
export const PageTransition = ({ children, className = "", direction = 1 }) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  const variants = {
    initial: (dir) => ({
      opacity: 0,
      y: 12,
      scale: 0.99,
    }),
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: (dir) => ({
      opacity: 0,
      y: -8,
      scale: 0.99,
      transition: {
        duration: 0.18,
        ease: "easeIn",
      },
    }),
  };

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;

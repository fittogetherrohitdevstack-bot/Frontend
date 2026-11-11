import React, { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useTransform, motion } from "motion/react";

/**
 * AnimatedNumber
 * Smoothly interpolates numeric values using Framer Motion springs.
 * Avoids sudden jumpy numbers on load or mutation.
 */
export const AnimatedNumber = ({
  value = 0,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
  duration = 0.8,
}) => {
  const numericValue = typeof value === "number" ? value : parseFloat(value) || 0;
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, { stiffness: 120, damping: 20 });
  const spanRef = useRef(null);

  useEffect(() => {
    motionVal.set(numericValue);
  }, [numericValue, motionVal]);

  useEffect(() => {
    const unsubscribe = springVal.on("change", (latest) => {
      if (spanRef.current) {
        const val = typeof latest === "number" && !isNaN(latest) ? latest : numericValue;
        spanRef.current.textContent = `${prefix}${val.toFixed(decimals)}${suffix}`;
      }
    });
    return () => unsubscribe();
  }, [springVal, decimals, prefix, suffix]);

  return (
    <span ref={spanRef} className={`tabular-nums font-mono ${className}`}>
      {prefix}
      {numericValue.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export default AnimatedNumber;

/**
 * Shared Motion Tokens & Springs
 */

export const springs = {
  snappy: { type: "spring", stiffness: 500, damping: 30, mass: 0.8 },
  smooth: { type: "spring", stiffness: 300, damping: 30 },
  bouncy: { type: "spring", stiffness: 400, damping: 18 },
  gentle: { type: "spring", stiffness: 180, damping: 24 },
};

export const easings = {
  easeOutExpo: [0.16, 1, 0.3, 1],
  easeInOutQuint: [0.83, 0, 0.17, 1],
  springy: [0.34, 1.56, 0.64, 1],
};

export const durations = {
  fast: 0.15,
  base: 0.25,
  slow: 0.5,
  relaxed: 0.8,
};

export const transitions = {
  snappy: { transition: springs.snappy },
  smooth: { transition: springs.smooth },
  fade: { duration: durations.base, ease: easings.easeOutExpo },
};

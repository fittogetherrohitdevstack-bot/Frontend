import React from "react";

/**
 * Shimmer
 * High-energy skeleton loader with animated sheen sweep for Light Theme.
 */
export const Shimmer = ({ className = "", rounded = "rounded-2xl" }) => {
  return (
    <div
      className={`relative overflow-hidden bg-slate-200/70 border border-slate-300/40 ${rounded} ${className}`}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent"
        style={{
          backgroundSize: "200% 100%",
        }}
      />
    </div>
  );
};

export default Shimmer;

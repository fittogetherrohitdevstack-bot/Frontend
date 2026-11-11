import React from "react";

export const Skeleton = ({ className = "", rounded = "rounded-2xl" }) => {
  return (
    <div
      className={`relative overflow-hidden bg-slate-200/70 border border-slate-300/40 ${rounded} ${className}`}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none"
      />
    </div>
  );
};

export default Skeleton;

import React from "react";
import { GlassCard } from "./GlassCard";

export const Card = ({ children, className = "", glow = "none", interactive = false, onClick, ...props }) => {
  return (
    <GlassCard
      glow={glow}
      interactive={interactive}
      onClick={onClick}
      className={className}
      {...props}
    >
      {children}
    </GlassCard>
  );
};

export default Card;

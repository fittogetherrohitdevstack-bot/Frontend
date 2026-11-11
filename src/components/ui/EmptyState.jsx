import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "./Button";

/**
 * EmptyState
 * Clean illustrated empty state for Light Theme.
 */
export const EmptyState = ({
  icon: Icon = Sparkles,
  title = "Nothing here yet",
  description = "Get started by taking your first action today.",
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`rounded-3xl bg-white/80 border border-slate-200/80 p-8 text-center flex flex-col items-center justify-center space-y-4 shadow-sm ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-lime-50 border border-lime-200 flex items-center justify-center text-lime-600 shadow-sm">
        <Icon className="w-7 h-7 stroke-[2.5]" />
      </div>
      <div className="max-w-xs space-y-1">
        <h4 className="text-base font-bold text-slate-900 tracking-tight">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

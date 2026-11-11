import React, { useState } from "react";
import { motion } from "motion/react";
import { AnimatedNumber } from "../../motion/AnimatedNumber";
import { Sheet } from "./Sheet";
import { Flame, Droplets, Dumbbell, Sparkles, ChevronRight, Info } from "lucide-react";
import { haptics } from "../../motion/Haptics";

/**
 * ProgressRing
 * Concentric triple SVG activity ring for high-energy Light Theme.
 * Outer: Calories (Athletic Lime/Emerald)
 * Middle: Protein (Vivid Violet)
 * Inner: Water (Cool Cyan)
 */
export const ProgressRing = ({
  calories = { current: 0, target: 2200 },
  protein = { current: 0, target: 140 },
  water = { current: 0, target: 3000 },
  carbs = { current: 0, target: 250 },
  fats = { current: 0, target: 60 },
  size = 280,
  strokeWidth = 14,
  gap = 6,
  className = "",
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  const calCur = typeof calories?.current === "number" ? calories.current : 0;
  const calTar = typeof calories?.target === "number" ? calories.target : 2200;
  const proCur = typeof protein?.current === "number" ? protein.current : 0;
  const proTar = typeof protein?.target === "number" ? protein.target : 140;
  const watCur = typeof water?.current === "number" ? water.current : 0;
  const watTar = typeof water?.target === "number" ? water.target : 3000;

  const calPercent = Math.min(100, Math.max(0, Math.round((calCur / (calTar || 1)) * 100)));
  const proPercent = Math.min(100, Math.max(0, Math.round((proCur / (proTar || 1)) * 100)));
  const watPercent = Math.min(100, Math.max(0, Math.round((watCur / (watTar || 1)) * 100)));

  const center = size / 2;
  const outerR = center - strokeWidth;
  const middleR = outerR - strokeWidth - gap;
  const innerR = middleR - strokeWidth - gap;

  const rings = [
    {
      r: outerR,
      percent: calPercent,
      color: "#84CC16",
      trackColor: "rgba(132, 204, 22, 0.15)",
      label: "Calories",
      current: calCur,
      target: calTar,
      unit: "kcal",
      icon: Flame,
      textColor: "text-lime-700",
      bgColor: "bg-lime-50",
      borderColor: "border-lime-200",
    },
    {
      r: middleR,
      percent: proPercent,
      color: "#7C3AED",
      trackColor: "rgba(124, 58, 237, 0.15)",
      label: "Protein",
      current: proCur,
      target: proTar,
      unit: "g",
      icon: Dumbbell,
      textColor: "text-purple-700",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      r: innerR,
      percent: watPercent,
      color: "#06B6D4",
      trackColor: "rgba(6, 182, 212, 0.15)",
      label: "Water",
      current: watCur,
      target: watTar,
      unit: "ml",
      icon: Droplets,
      textColor: "text-cyan-700",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
    },
  ];

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          haptics.tick();
          setSheetOpen(true);
        }}
        className={`relative flex items-center justify-center cursor-pointer select-none group mx-auto ${className}`}
        style={{ width: size, height: size }}
      >
        {/* Soft Ambient Radial Glow */}
        <div
          className="absolute inset-4 rounded-full blur-3xl opacity-40 pointer-events-none transition-opacity duration-500 group-hover:opacity-60"
          style={{
            background:
              "radial-gradient(circle, rgba(132,204,22,0.2) 0%, rgba(124,58,237,0.15) 50%, rgba(6,182,212,0.12) 100%)",
          }}
        />

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rotate-[-90deg] overflow-visible"
        >
          <defs>
            <linearGradient id="grad-calories" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#84CC16" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>

            <linearGradient id="grad-protein" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>

            <linearGradient id="grad-water" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
          </defs>

          {rings.map((ring, idx) => {
            const circumference = 2 * Math.PI * ring.r;
            const strokeDashoffset =
              circumference - (ring.percent / 100) * circumference;

            return (
              <g key={idx}>
                {/* Background Ring Track */}
                <circle
                  cx={center}
                  cy={center}
                  r={ring.r}
                  fill="none"
                  stroke={ring.trackColor}
                  strokeWidth={strokeWidth}
                />

                {/* Animated Foreground Ring */}
                <motion.circle
                  cx={center}
                  cy={center}
                  r={ring.r}
                  fill="none"
                  stroke={
                    idx === 0
                      ? "url(#grad-calories)"
                      : idx === 1
                      ? "url(#grad-protein)"
                      : "url(#grad-water)"
                  }
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{
                    duration: 1.2,
                    delay: 0.15 * idx,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* Center Numbers & Tap Hint */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-lime-700 flex items-center gap-1 mb-0.5">
            <Flame className="w-3.5 h-3.5 text-lime-600 fill-lime-500" /> Active Burn
          </span>
          <div className="flex items-baseline justify-center">
            <AnimatedNumber
              value={calCur}
              className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight"
            />
          </div>
          <span className="text-[11px] font-bold text-slate-500 mt-0.5">
            / {calTar} kcal
          </span>

          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-2 h-2 rounded-full bg-[#84CC16]" />
            <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
            <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
          </div>

          <span className="text-[9px] text-slate-400 font-bold mt-1 tracking-wider uppercase">
            Tap for breakdown
          </span>
        </div>
      </motion.div>

      {/* Triple Ring Detail Sheet */}
      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Today's Activity Breakdown"
        description="Concentric rings track your daily energy, macros & hydration"
      >
        <div className="space-y-3.5 pt-2">
          {rings.map((ring, i) => {
            const Icon = ring.icon;
            return (
              <div
                key={i}
                className={`p-4 rounded-2xl ${ring.bgColor} border ${ring.borderColor} flex items-center justify-between shadow-sm`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm"
                    style={{ color: ring.color }}
                  >
                    <Icon className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{ring.label}</h4>
                    <p className="text-xs text-slate-500">
                      Target: {ring.target} {ring.unit}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-extrabold text-slate-900">
                    {ring.current}{" "}
                    <span className="text-xs font-normal text-slate-500">{ring.unit}</span>
                  </div>
                  <span
                    className={`text-xs font-black inline-block px-2.5 py-0.5 rounded-full mt-0.5 ${ring.textColor} bg-white shadow-xs`}
                  >
                    {ring.percent}%
                  </span>
                </div>
              </div>
            );
          })}

          {/* Secondary macros (Carbs & Fats) */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                Carbs
              </span>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {carbs.current} <span className="text-xs text-slate-500">/ {carbs.target}g</span>
              </p>
              <div className="w-full h-2 rounded-full bg-amber-200/60 mt-2 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((carbs.current / (carbs.target || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                Fats
              </span>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {fats.current} <span className="text-xs text-slate-500">/ {fats.target}g</span>
              </p>
              <div className="w-full h-2 rounded-full bg-rose-200/60 mt-2 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((fats.current / (fats.target || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Sheet>
    </>
  );
};

export default ProgressRing;

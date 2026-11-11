import React, { useState, useMemo, useRef, useEffect } from "react";
import { useDrag, usePinch } from "@use-gesture/react";
import { POSE_CONFIG, POSE_ORDER } from "./PoseSilhouetteOverlay";
import { Card } from "../ui/Card";
import { haptics } from "../../motion/Haptics";
import {
  SlidersHorizontal,
  Columns2,
  ZoomIn,
  ZoomOut,
  MoveHorizontal,
  Calendar,
  Scale,
  ArrowRight,
  ImageOff,
} from "lucide-react";

const parseDateMs = (ymd) => {
  if (!ymd) return 0;
  const [y, m, d] = String(ymd).split("-").map(Number);
  if (!y || !m || !d) return 0;
  return Date.UTC(y, m - 1, d);
};

const formatDateShort = (ymd) => {
  if (!ymd) return "—";
  const ms = parseDateMs(ymd);
  if (!ms) return ymd;
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

export const PhotoCompareView = ({ sets = [], hideWeightNumbers = false }) => {
  // Sort chronologically (oldest first) for Before -> After comparison
  const chronoSets = useMemo(() => {
    return [...sets].sort((a, b) => {
      const diff = (a.cycleNumber || 0) - (b.cycleNumber || 0);
      if (diff !== 0) return diff;
      return String(a.date || "").localeCompare(String(b.date || ""));
    });
  }, [sets]);

  const [pose, setPose] = useState("front_relaxed");
  const [mode, setMode] = useState("slider"); // slider | side_by_side
  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");
  const [sliderPos, setSliderPos] = useState(50); // 0..100 %
  const [zoom, setZoom] = useState(1);

  const stageRef = useRef(null);

  // Initialize sensible defaults (oldest vs newest) when sets load/change
  useEffect(() => {
    if (chronoSets.length === 0) return;
    if (!beforeId || !chronoSets.some((s) => s._id === beforeId)) {
      setBeforeId(chronoSets[0]._id);
    }
    if (!afterId || !chronoSets.some((s) => s._id === afterId)) {
      setAfterId(chronoSets[chronoSets.length - 1]._id);
    }
  }, [chronoSets, beforeId, afterId]);

  const beforeSet = chronoSets.find((s) => s._id === beforeId) || chronoSets[0];
  const afterSet =
    chronoSets.find((s) => s._id === afterId) || chronoSets[chronoSets.length - 1];

  const beforePhoto = beforeSet?.photos?.[pose];
  const afterPhoto = afterSet?.photos?.[pose];

  const daysApart = useMemo(() => {
    if (!beforeSet?.date || !afterSet?.date) return null;
    const msA = parseDateMs(beforeSet.date);
    const msB = parseDateMs(afterSet.date);
    return Math.round(Math.abs(msB - msA) / 86400000);
  }, [beforeSet, afterSet]);

  const weightDelta = useMemo(() => {
    if (
      hideWeightNumbers ||
      typeof beforeSet?.weightKg !== "number" ||
      typeof afterSet?.weightKg !== "number"
    ) {
      return null;
    }
    return Math.round((afterSet.weightKg - beforeSet.weightKg) * 10) / 10;
  }, [beforeSet, afterSet, hideWeightNumbers]);

  // Interactive wipe slider gesture
  const bindHandleDrag = useDrag(
    ({ xy: [clientX], event }) => {
      event?.stopPropagation();
      const el = stageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width) return;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setSliderPos(Math.max(4, Math.min(96, pct)));
    },
    { pointer: { touch: true }, filterTaps: false }
  );

  // Pinch-to-zoom on compare viewport
  const bindPinch = usePinch(
    ({ offset: [scale] }) => {
      setZoom(Math.max(1, Math.min(2.5, Math.round(scale * 100) / 100)));
    },
    {
      scaleBounds: { min: 1, max: 2.5 },
      from: () => [zoom, 0],
    }
  );

  const handleSliderKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSliderPos((p) => Math.max(0, p - 5));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSliderPos((p) => Math.min(100, p + 5));
    } else if (e.key === "Home") {
      e.preventDefault();
      setSliderPos(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setSliderPos(100);
    }
  };

  if (chronoSets.length < 2) {
    return (
      <Card className="p-6 text-center space-y-2 border-dashed border-slate-200 bg-slate-50/70">
        <SlidersHorizontal className="w-8 h-8 text-slate-400 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">
          Side-by-side comparison unlocks after 2 check-ins
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Capture your second bi-weekly set in 14 days to compare changes cleanly across matching poses.
        </p>
      </Card>
    );
  }

  const poseCfg = POSE_CONFIG[pose] || POSE_CONFIG.front_relaxed;

  return (
    <Card className="p-4 sm:p-5 space-y-4">
      {/* Pose + Mode Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Comparison pose">
          {POSE_ORDER.map((poseKey) => {
            const cfg = POSE_CONFIG[poseKey];
            const active = pose === poseKey;
            return (
              <button
                key={poseKey}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  haptics.tick();
                  setPose(poseKey);
                }}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  active
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cfg.shortLabel}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setMode("slider");
            }}
            className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              mode === "slider"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Slider
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setMode("side_by_side");
            }}
            className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              mode === "side_by_side"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            Side by side
          </button>
        </div>
      </div>

      {/* Before / After Set Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <label className="block">
          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Before check-in
          </span>
          <select
            value={beforeSet?._id || ""}
            onChange={(e) => {
              haptics.tick();
              setBeforeId(e.target.value);
            }}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
          >
            {chronoSets.map((s) => (
              <option key={s._id} value={s._id}>
                Cycle #{s.cycleNumber} · {formatDateShort(s.date)}
                {!hideWeightNumbers && typeof s.weightKg === "number"
                  ? ` (${s.weightKg.toFixed(1)} kg)`
                  : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            After check-in
          </span>
          <select
            value={afterSet?._id || ""}
            onChange={(e) => {
              haptics.tick();
              setAfterId(e.target.value);
            }}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
          >
            {chronoSets.map((s) => (
              <option key={s._id} value={s._id}>
                Cycle #{s.cycleNumber} · {formatDateShort(s.date)}
                {!hideWeightNumbers && typeof s.weightKg === "number"
                  ? ` (${s.weightKg.toFixed(1)} kg)`
                  : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Summary Stats Pill Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            {daysApart !== null ? `${daysApart} days apart` : "Same check-in"}
          </span>
          {!hideWeightNumbers &&
            typeof beforeSet?.weightKg === "number" &&
            typeof afterSet?.weightKg === "number" && (
              <span className="inline-flex items-center gap-1 font-semibold text-slate-600 tabular-nums">
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                {beforeSet.weightKg.toFixed(1)} kg
                <ArrowRight className="w-3 h-3 text-slate-400" />
                {afterSet.weightKg.toFixed(1)} kg
                {weightDelta !== null && (
                  <span className="font-bold text-slate-800 ml-0.5">
                    ({weightDelta > 0 ? `+${weightDelta}` : weightDelta} kg)
                  </span>
                )}
              </span>
            )}
        </div>

        {/* Zoom selector */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(1, Math.round((z - 0.5) * 10) / 10))}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          {[1, 1.5, 2].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setZoom(lvl)}
              className={`min-w-[34px] h-7 px-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                Math.abs(zoom - lvl) < 0.15
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              {lvl}×
            </button>
          ))}
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.5) * 10) / 10))}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Comparison Viewport */}
      {!beforePhoto?.url || !afterPhoto?.url ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center space-y-1.5">
          <ImageOff className="w-7 h-7 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-700">
            Missing {poseCfg.label} photo in{" "}
            {!beforePhoto?.url && !afterPhoto?.url
              ? "both selected sets"
              : !beforePhoto?.url
              ? `Cycle #${beforeSet?.cycleNumber}`
              : `Cycle #${afterSet?.cycleNumber}`}
          </p>
          <p className="text-[11px] text-slate-500">
            Select a different pose tab or check-in set above to compare.
          </p>
        </div>
      ) : mode === "slider" ? (
        <div
          ref={stageRef}
          {...bindPinch()}
          className="relative w-full max-w-[440px] mx-auto aspect-[3/4] rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 select-none touch-none shadow-md"
        >
          {/* After (base full layer) */}
          <img
            src={afterPhoto.url}
            alt={`After — ${poseCfg.label}`}
            draggable={false}
            style={{ transform: `scale(${zoom})` }}
            className="absolute inset-0 w-full h-full object-contain transition-transform duration-100 ease-out"
          />

          {/* Before (top layer clipped by horizontal slider position) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            <img
              src={beforePhoto.url}
              alt={`Before — ${poseCfg.label}`}
              draggable={false}
              style={{ transform: `scale(${zoom})` }}
              className="w-full h-full object-contain transition-transform duration-100 ease-out"
            />
          </div>

          {/* Labels */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/75 text-white text-[11px] font-bold border border-white/15 pointer-events-none">
            Before · #{beforeSet.cycleNumber}
          </div>
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/75 text-lime-300 text-[11px] font-bold border border-white/15 pointer-events-none">
            After · #{afterSet.cycleNumber}
          </div>

          {/* Draggable vertical divider + handle */}
          <div
            {...bindHandleDrag()}
            role="slider"
            tabIndex={0}
            aria-label="Before and after photo comparison slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(sliderPos)}
            onKeyDown={handleSliderKeyDown}
            style={{ left: `${sliderPos}%` }}
            className="absolute inset-y-0 -translate-x-1/2 w-10 flex items-center justify-center cursor-ew-resize focus:outline-none group z-20"
          >
            <div className="w-0.5 h-full bg-white/90 shadow-[0_0_8px_rgba(0,0,0,0.6)]" />
            <div className="absolute w-10 h-10 rounded-full bg-white text-slate-900 shadow-lg border-2 border-slate-900/15 flex items-center justify-center group-focus-visible:ring-4 group-focus-visible:ring-lime-400">
              <MoveHorizontal className="w-4 h-4" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: `Before · #${beforeSet.cycleNumber}`, date: beforeSet.date, photo: beforePhoto },
            { label: `After · #${afterSet.cycleNumber}`, date: afterSet.date, photo: afterPhoto },
          ].map((panel) => (
            <div
              key={panel.label}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-950 border border-slate-200"
            >
              <img
                src={panel.photo.url}
                alt={`${panel.label} ${poseCfg.label}`}
                style={{ transform: `scale(${zoom})` }}
                className="w-full h-full object-contain transition-transform duration-100 ease-out"
              />
              <div className="absolute bottom-2 inset-x-2 px-2.5 py-1 rounded-lg bg-slate-950/75 backdrop-blur-xs text-white text-[11px] font-bold flex items-center justify-between">
                <span>{panel.label}</span>
                <span className="text-slate-300 font-normal">
                  {formatDateShort(panel.date)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

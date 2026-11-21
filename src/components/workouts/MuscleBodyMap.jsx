import React, { useState } from "react";
import { GlassCard } from "../ui/GlassCard";
import { Info, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/**
 * Interactive SVG Muscle Body Map
 * Displays front and back views with volume-based heat coloration.
 * Clearly disclaims that it represents logged training volume, not physiological biological recovery.
 */
export const MuscleBodyMap = ({ muscleMapData = [] }) => {
  const [view, setView] = useState("front"); // 'front' | 'back'
  const [selectedMuscle, setSelectedMuscle] = useState(null);

  // Index map data by muscle name
  const dataLookup = React.useMemo(() => {
    const map = {};
    muscleMapData.forEach((item) => {
      map[item.muscle] = item;
    });
    return map;
  }, [muscleMapData]);

  // Color calculation based on past 7 days sets
  const getMuscleColor = (muscleName) => {
    const data = dataLookup[muscleName];
    if (!data || data.past7DaysSets === 0) {
      return "#E2E8F0"; // slate-200 (untrained)
    }
    if (data.past7DaysSets <= 4) {
      return "#C084FC"; // purple-400 (light volume)
    }
    if (data.past7DaysSets <= 9) {
      return "#A855F7"; // purple-500 (moderate volume)
    }
    return "#84CC16"; // lime-500 (high volume / optimized)
  };

  const activeDetail = selectedMuscle ? dataLookup[selectedMuscle] : null;

  return (
    <div className="space-y-4">
      {/* View Switcher and Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
            Muscular Volume Heatmap (7 Days)
          </h3>
          <p className="text-xs text-slate-500">
            Interactive front & back anatomical map highlighting muscle group training distribution
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setView("front")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                view === "front"
                  ? "bg-white text-purple-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Front View
            </button>
            <button
              type="button"
              onClick={() => setView("back")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                view === "back"
                  ? "bg-white text-purple-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Back View
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <GlassCard className="p-4 sm:p-6 bg-white/95 border-slate-200 relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* SVG Canvas Area */}
          <div className="md:col-span-7 flex justify-center py-2 relative">
            <AnimatePresence mode="wait">
              {view === "front" ? (
                <motion.svg
                  key="front-view"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  viewBox="0 0 240 380"
                  className="w-56 h-88 sm:w-64 sm:h-96 drop-shadow-sm select-none"
                >
                  {/* Head & Neck */}
                  <circle cx="120" cy="35" r="22" fill="#E2E8F0" />
                  <rect x="112" y="55" width="16" height="15" rx="3" fill="#E2E8F0" />

                  {/* Shoulders (Left & Right) */}
                  <g
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => setSelectedMuscle("Shoulders")}
                  >
                    <path
                      d="M 80 70 C 85 62, 105 65, 105 78 C 98 85, 82 85, 80 70 Z"
                      fill={getMuscleColor("Shoulders")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M 160 70 C 155 62, 135 65, 135 78 C 142 85, 158 85, 160 70 Z"
                      fill={getMuscleColor("Shoulders")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* Chest (Pectorals) */}
                  <g
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => setSelectedMuscle("Chest")}
                  >
                    <path
                      d="M 88 78 C 105 74, 118 78, 118 108 C 105 110, 88 102, 88 78 Z"
                      fill={getMuscleColor("Chest")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M 152 78 C 135 74, 122 78, 122 108 C 135 110, 152 102, 152 78 Z"
                      fill={getMuscleColor("Chest")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* Biceps & Forearms (Arms Front) */}
                  <g
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => setSelectedMuscle("Biceps")}
                  >
                    {/* Left Bicep */}
                    <path
                      d="M 76 86 C 70 96, 68 116, 75 125 C 82 118, 83 96, 76 86 Z"
                      fill={getMuscleColor("Biceps")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                    {/* Right Bicep */}
                    <path
                      d="M 164 86 C 170 96, 172 116, 165 125 C 158 118, 157 96, 164 86 Z"
                      fill={getMuscleColor("Biceps")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* Forearms */}
                  <g
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => setSelectedMuscle("Forearms")}
                  >
                    {/* Left Forearm */}
                    <path
                      d="M 72 128 C 64 142, 60 165, 68 178 C 74 172, 78 145, 76 128 Z"
                      fill={getMuscleColor("Forearms")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                    {/* Right Forearm */}
                    <path
                      d="M 168 128 C 176 142, 180 165, 172 178 C 166 172, 162 145, 164 128 Z"
                      fill={getMuscleColor("Forearms")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* Hands */}
                  <circle cx="66" cy="188" r="6" fill="#CBD5E1" />
                  <circle cx="174" cy="188" r="6" fill="#CBD5E1" />

                  {/* Abdominals (Core) */}
                  <g
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => setSelectedMuscle("Abs")}
                  >
                    {/* Upper Abs */}
                    <rect
                      x="105"
                      y="112"
                      width="14"
                      height="12"
                      rx="3"
                      fill={getMuscleColor("Abs")}
                      stroke="#CBD5E1"
                      strokeWidth="1.2"
                    />
                    <rect
                      x="121"
                      y="112"
                      width="14"
                      height="12"
                      rx="3"
                      fill={getMuscleColor("Abs")}
                      stroke="#CBD5E1"
                      strokeWidth="1.2"
                    />
                    {/* Mid Abs */}
                    <rect
                      x="105"
                      y="126"
                      width="14"
                      height="12"
                      rx="3"
                      fill={getMuscleColor("Abs")}
                      stroke="#CBD5E1"
                      strokeWidth="1.2"
                    />
                    <rect
                      x="121"
                      y="126"
                      width="14"
                      height="12"
                      rx="3"
                      fill={getMuscleColor("Abs")}
                      stroke="#CBD5E1"
                      strokeWidth="1.2"
                    />
                    {/* Lower Abs */}
                    <rect
                      x="106"
                      y="140"
                      width="13"
                      height="14"
                      rx="3"
                      fill={getMuscleColor("Abs")}
                      stroke="#CBD5E1"
                      strokeWidth="1.2"
                    />
                    <rect
                      x="121"
                      y="140"
                      width="13"
                      height="14"
                      rx="3"
                      fill={getMuscleColor("Abs")}
                      stroke="#CBD5E1"
                      strokeWidth="1.2"
                    />
                  </g>

                  {/* Pelvis / Waist */}
                  <path d="M 100 156 L 140 156 L 132 178 L 108 178 Z" fill="#E2E8F0" />

                  {/* Quadriceps (Legs Front) */}
                  <g
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => setSelectedMuscle("Legs")}
                  >
                    {/* Left Quad */}
                    <path
                      d="M 106 180 C 114 185, 116 235, 110 255 C 98 250, 94 200, 106 180 Z"
                      fill={getMuscleColor("Legs")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                    {/* Right Quad */}
                    <path
                      d="M 134 180 C 126 185, 124 235, 130 255 C 142 250, 146 200, 134 180 Z"
                      fill={getMuscleColor("Legs")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* Knees */}
                  <circle cx="106" cy="262" r="5" fill="#CBD5E1" />
                  <circle cx="134" cy="262" r="5" fill="#CBD5E1" />

                  {/* Shins & Calves */}
                  <g
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => setSelectedMuscle("Legs")}
                  >
                    {/* Left Calf/Shin */}
                    <path
                      d="M 104 270 C 110 285, 110 325, 102 345 C 96 335, 96 285, 104 270 Z"
                      fill={getMuscleColor("Legs")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                    {/* Right Calf/Shin */}
                    <path
                      d="M 136 270 C 130 285, 130 325, 138 345 C 144 335, 144 285, 136 270 Z"
                      fill={getMuscleColor("Legs")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* Feet */}
                  <ellipse cx="98" cy="355" rx="9" ry="5" fill="#CBD5E1" />
                  <ellipse cx="142" cy="355" rx="9" ry="5" fill="#CBD5E1" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="back-view"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  viewBox="0 0 240 380"
                  className="w-56 h-88 sm:w-64 sm:h-96 drop-shadow-sm select-none"
                >
                  {/* Head & Neck (Back) */}
                  <circle cx="120" cy="35" r="22" fill="#E2E8F0" />
                  <rect x="112" y="55" width="16" height="15" rx="3" fill="#E2E8F0" />

                  {/* Upper Trapezius */}
                  <g
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => setSelectedMuscle("Back")}
                  >
                    <path
                      d="M 105 60 C 120 70, 135 60, 135 60 L 140 85 L 100 85 Z"
                      fill={getMuscleColor("Back")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* Rear Deltoids */}
                  <g
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => setSelectedMuscle("Shoulders")}
                  >
                    <path
                      d="M 80 70 C 85 62, 100 68, 100 84 C 92 88, 80 84, 80 70 Z"
                      fill={getMuscleColor("Shoulders")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M 160 70 C 155 62, 140 68, 140 84 C 148 88, 160 84, 160 70 Z"
                      fill={getMuscleColor("Shoulders")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* Lats and Mid-Back */}
                  <g
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => setSelectedMuscle("Back")}
                  >
                    <path
                      d="M 96 85 C 105 85, 118 88, 118 145 C 102 140, 88 120, 96 85 Z"
                      fill={getMuscleColor("Back")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M 144 85 C 135 85, 122 88, 122 145 C 138 140, 152 120, 144 85 Z"
                      fill={getMuscleColor("Back")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* Triceps (Back Arms) */}
                  <g
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => setSelectedMuscle("Triceps")}
                  >
                    {/* Left Tricep */}
                    <path
                      d="M 76 86 C 68 96, 66 116, 73 125 C 80 118, 81 96, 76 86 Z"
                      fill={getMuscleColor("Triceps")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                    {/* Right Tricep */}
                    <path
                      d="M 164 86 C 172 96, 174 116, 167 125 C 160 118, 159 96, 164 86 Z"
                      fill={getMuscleColor("Triceps")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* Forearms (Back) */}
                  <g
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => setSelectedMuscle("Forearms")}
                  >
                    <path
                      d="M 72 128 C 64 142, 60 165, 68 178 C 74 172, 78 145, 76 128 Z"
                      fill={getMuscleColor("Forearms")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M 168 128 C 176 142, 180 165, 172 178 C 166 172, 162 145, 164 128 Z"
                      fill={getMuscleColor("Forearms")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* Lower Back / Erector Spinae */}
                  <rect x="110" y="145" width="20" height="24" rx="3" fill="#E2E8F0" />

                  {/* Glutes (Back) */}
                  <g
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => setSelectedMuscle("Legs")}
                  >
                    <ellipse
                      cx="108"
                      cy="188"
                      rx="14"
                      ry="16"
                      fill={getMuscleColor("Legs")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                    <ellipse
                      cx="132"
                      cy="188"
                      rx="14"
                      ry="16"
                      fill={getMuscleColor("Legs")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* Hamstrings (Legs Back) */}
                  <g
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => setSelectedMuscle("Legs")}
                  >
                    {/* Left Hamstring */}
                    <path
                      d="M 106 206 C 114 212, 116 242, 108 258 C 98 252, 96 215, 106 206 Z"
                      fill={getMuscleColor("Legs")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                    {/* Right Hamstring */}
                    <path
                      d="M 134 206 C 126 212, 124 242, 132 258 C 142 252, 144 215, 134 206 Z"
                      fill={getMuscleColor("Legs")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* Calves (Gastrocnemius) */}
                  <g
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => setSelectedMuscle("Legs")}
                  >
                    {/* Left Calf */}
                    <path
                      d="M 104 270 C 112 285, 110 325, 102 345 C 94 335, 96 285, 104 270 Z"
                      fill={getMuscleColor("Legs")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                    {/* Right Calf */}
                    <path
                      d="M 136 270 C 128 285, 130 325, 138 345 C 146 335, 144 285, 136 270 Z"
                      fill={getMuscleColor("Legs")}
                      stroke="#CBD5E1"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* Feet */}
                  <ellipse cx="98" cy="355" rx="9" ry="5" fill="#CBD5E1" />
                  <ellipse cx="142" cy="355" rx="9" ry="5" fill="#CBD5E1" />
                </motion.svg>
              )}
            </AnimatePresence>
          </div>

          {/* Muscle Detail Sidebar */}
          <div className="md:col-span-5 space-y-4">
            {/* Color Legend */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                Volume Heatmap Legend
              </span>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3.5 h-3.5 rounded-full bg-lime-500 shrink-0" />
                  <span className="font-bold text-slate-800">10+ Sets / Optimized Volume</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3.5 h-3.5 rounded-full bg-purple-500 shrink-0" />
                  <span className="font-bold text-slate-800">5 - 9 Sets / Moderate Volume</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3.5 h-3.5 rounded-full bg-purple-300 shrink-0" />
                  <span className="font-bold text-slate-800">1 - 4 Sets / Light Volume</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-200 shrink-0" />
                  <span className="font-bold text-slate-500">0 Sets / Untrained This Week</span>
                </div>
              </div>
            </div>

            {/* Selected Muscle Card */}
            {activeDetail ? (
              <motion.div
                key={activeDetail.muscle}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 text-base">{activeDetail.muscle}</h4>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      activeDetail.past7DaysSets > 0
                        ? "bg-purple-200 text-purple-900"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {activeDetail.past7DaysSets > 0 ? "Trained This Week" : "Needs Attention"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                    <span className="text-[10px] uppercase font-black text-slate-400 block">7-Day Sets</span>
                    <span className="text-lg font-black text-purple-700">{activeDetail.past7DaysSets}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                    <span className="text-[10px] uppercase font-black text-slate-400 block">7-Day Volume</span>
                    <span className="text-lg font-black text-slate-800">{activeDetail.past7DaysVolume} kg</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 pt-1">
                  Last trained:{" "}
                  <strong className="text-slate-900">
                    {activeDetail.lastTrainedDate || "Not recorded in past 30 days"}
                  </strong>
                </div>
              </motion.div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center py-6">
                <p className="text-xs font-bold text-slate-600">
                  Tap any muscle group on the body map to inspect training volume and last trained date.
                </p>
              </div>
            )}

            {/* Scientific Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-[11px] leading-relaxed">
              <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>Note:</strong> Heatmap illustrates logged set volume from your workout sessions. It does
                not evaluate biological muscle fiber micro-damage or systemic physiological readiness.
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default MuscleBodyMap;

import React from "react";

export const POSE_CONFIG = {
  front_relaxed: {
    key: "front_relaxed",
    label: "Front relaxed",
    shortLabel: "Front",
    instruction: "Stand naturally facing the camera, arms relaxed at your sides, feet hip-width apart.",
    tips: "Eyes forward, even weight on both feet, don't flex or suck in.",
  },
  side_relaxed: {
    key: "side_relaxed",
    label: "Side relaxed",
    shortLabel: "Side",
    instruction: "Turn 90° so your left side faces the camera, posture tall and relaxed.",
    tips: "Arms relaxed straight down by your sides so your torso silhouette stays visible.",
  },
  back_relaxed: {
    key: "back_relaxed",
    label: "Back relaxed",
    shortLabel: "Back",
    instruction: "Face directly away from the camera, shoulders level, arms relaxed.",
    tips: "Use the 10-second self-timer and keep heels aligned in the frame guide.",
  },
};

export const POSE_ORDER = ["front_relaxed", "side_relaxed", "back_relaxed"];

/**
 * Semi-transparent SVG framing guide overlaid on the live camera preview
 * or pose capture frame so bi-weekly check-in shots match in scale and stance.
 */
export const PoseSilhouetteOverlay = ({
  pose = "front_relaxed",
  showInstruction = true,
  className = "",
}) => {
  const cfg = POSE_CONFIG[pose] || POSE_CONFIG.front_relaxed;

  return (
    <div
      className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-between p-3 ${className}`}
      aria-hidden="true"
    >
      {/* Top horizontal horizon alignment bar */}
      <div className="w-full flex items-center justify-center pt-1">
        <div className="w-20 h-0.5 rounded-full bg-white/35" />
      </div>

      {/* Centered human silhouette SVG */}
      <div className="relative w-full flex-1 flex items-center justify-center my-1 min-h-0">
        {pose === "front_relaxed" && (
          <svg
            viewBox="0 0 200 360"
            className="h-full max-h-[290px] w-auto drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]"
            fill="none"
          >
            {/* Head */}
            <ellipse
              cx="100"
              cy="44"
              rx="22"
              ry="27"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="2.2"
              strokeDasharray="6 4"
            />
            {/* Neck & shoulders & torso & arms & legs */}
            <path
              d="M88 69 L88 84 Q60 88 48 106 L38 196 Q37 206 46 207 Q54 207 57 196 L64 134 L66 196 L64 334 Q64 344 74 344 Q83 344 85 332 L96 226 L104 226 L115 332 Q117 344 126 344 Q136 344 136 334 L134 196 L136 134 L143 196 Q146 207 154 207 Q163 206 162 196 L152 106 Q140 88 112 84 L112 69"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="2.2"
              strokeDasharray="6 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Hip-width / center plumb line */}
            <line
              x1="100"
              y1="20"
              x2="100"
              y2="344"
              stroke="rgba(163,230,53,0.45)"
              strokeWidth="1.2"
              strokeDasharray="3 5"
            />
          </svg>
        )}

        {pose === "side_relaxed" && (
          <svg
            viewBox="0 0 200 360"
            className="h-full max-h-[290px] w-auto drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]"
            fill="none"
          >
            {/* Side head profile (facing left) */}
            <path
              d="M95 18 C78 18 72 34 74 47 L70 53 L75 56 C76 66 84 71 96 71 C111 71 120 59 120 43 C120 27 110 18 95 18 Z"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="2.2"
              strokeDasharray="6 4"
              strokeLinejoin="round"
            />
            {/* Upright side profile torso, relaxed arm, hips & leg */}
            <path
              d="M87 71 L86 86 C74 96 73 128 79 156 C82 172 78 192 82 214 L86 334 C86 343 94 345 102 345 L110 345 C115 345 117 338 114 331 L111 224 C118 194 120 156 114 114 C112 96 108 86 104 82 L103 71"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="2.2"
              strokeDasharray="6 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Relaxed arm hanging along side */}
            <path
              d="M95 96 C90 120 91 162 93 200 C94 207 101 207 102 199 C103 162 104 122 102 96"
              stroke="rgba(163,230,53,0.65)"
              strokeWidth="1.8"
              strokeDasharray="5 4"
              strokeLinecap="round"
            />
            {/* Direction indicator */}
            <path
              d="M54 44 L42 44 M47 39 L42 44 L47 49"
              stroke="rgba(163,230,53,0.75)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {pose === "back_relaxed" && (
          <svg
            viewBox="0 0 200 360"
            className="h-full max-h-[290px] w-auto drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]"
            fill="none"
          >
            {/* Back of head */}
            <ellipse
              cx="100"
              cy="43"
              rx="22"
              ry="26"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="2.2"
              strokeDasharray="6 4"
            />
            {/* Hairline / rear collar cue */}
            <path
              d="M84 55 Q100 63 116 55"
              stroke="rgba(163,230,53,0.65)"
              strokeWidth="1.8"
              strokeDasharray="4 3"
              strokeLinecap="round"
            />
            {/* Broad upper back, relaxed arms & legs */}
            <path
              d="M89 69 L89 83 Q58 88 46 106 L37 196 Q36 206 45 207 Q53 207 56 196 L64 134 L68 198 L65 334 Q65 344 75 344 Q84 344 86 332 L96 226 L104 226 L114 332 Q116 344 125 344 Q135 344 135 334 L132 198 L136 134 L144 196 Q147 207 155 207 Q164 206 163 196 L154 106 Q142 88 111 83 L111 69"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="2.2"
              strokeDasharray="6 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Shoulder blades subtle cue */}
            <path
              d="M78 106 Q86 124 83 142 M122 106 Q114 124 117 142"
              stroke="rgba(163,230,53,0.45)"
              strokeWidth="1.5"
              strokeDasharray="3 4"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {/* Bottom framing instruction pill */}
      {showInstruction && (
        <div className="w-full max-w-[320px] rounded-xl bg-slate-950/70 backdrop-blur-sm border border-white/15 px-3 py-2 text-center">
          <p className="text-[11px] font-bold text-lime-300 uppercase tracking-wider">
            {cfg.label}
          </p>
          <p className="text-[11px] text-white/90 leading-snug mt-0.5">{cfg.instruction}</p>
        </div>
      )}
    </div>
  );
};

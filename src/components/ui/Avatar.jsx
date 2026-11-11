import React, { useState, useEffect } from "react";
import { getPresetAvatar } from "../../utils/avatars";

/**
 * Avatar
 * Ringed avatar supporting uploaded photos, built-in athletic preset avatars (`avatar:<id>`),
 * and automatic fallback to crisp user initials.
 */
export const Avatar = ({
  src,
  alt = "User",
  name = "User",
  size = "md",
  ring = true,
  ringColor = "lime", // 'lime' | 'violet' | 'coral' | 'cyan'
  className = "",
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-xl",
  };

  const presetIconSizeClasses = {
    xs: "w-3.5 h-3.5",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
    xl: "w-9 h-9",
  };

  const ringClasses = {
    lime: "ring-2 ring-lime-500 shadow-[0_0_10px_rgba(132,204,22,0.25)]",
    violet: "ring-2 ring-purple-500 shadow-[0_0_10px_rgba(124,58,237,0.25)]",
    coral: "ring-2 ring-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.25)]",
    cyan: "ring-2 ring-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.25)]",
  };

  const preset = getPresetAvatar(src);
  const showImage = Boolean(src && !preset && !imgFailed);

  const initials = name
    ? name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "FT";

  const PresetIcon = preset?.Icon;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden font-extrabold shrink-0 select-none border ${
        preset
          ? `${preset.bgClass} ${preset.iconClass} border-white/60`
          : "bg-slate-100 text-slate-800 border-slate-200"
      } ${sizeClasses[size] || sizeClasses.md} ${
        ring ? ringClasses[ringColor] || ringClasses.lime : ""
      } ${className}`}
    >
      {preset && PresetIcon ? (
        <PresetIcon
          className={presetIconSizeClasses[size] || presetIconSizeClasses.md}
          strokeWidth={2.2}
          aria-label={preset.label}
        />
      ) : showImage ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

export default Avatar;

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Dumbbell,
  User,
  Users,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";

/**
 * Reusable ExerciseMedia Component
 * Automatically resolves media priority:
 * 1. MP4 Video (with Male/Female toggle, loop, muted autoplay, controls)
 * 2. Animated GIF (lazy loaded with skeleton & fallback)
 * 3. Start/Peak WebP Illustrations (side-by-side or toggleable)
 * 4. Text/Anatomical Placeholder
 */
export const ExerciseMedia = ({
  exercise,
  autoPlay = false,
  className = "",
  showControls = true,
  aspectRatio = "aspect-video",
}) => {
  const hasMaleAndFemale = Boolean(exercise?.videoUrl && exercise?.videoUrlFemale);
  const defaultGender = exercise?.videoUrl ? "male" : (exercise?.videoUrlFemale ? "female" : "male");
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [activeGender, setActiveGender] = useState(defaultGender); // 'male' | 'female'
  const [imageTab, setImageTab] = useState("start"); // 'start' | 'peak'
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const videoRef = useRef(null);

  if (!exercise) return null;

  const {
    mediaType = "none",
    videoUrl,
    videoUrlFemale,
    gifUrl,
    thumbnailUrl,
    images = [],
    name,
    attribution,
  } = exercise;

  // Determine current active video URL based on selected gender
  const currentVideoUrl =
    activeGender === "female"
      ? (videoUrlFemale || videoUrl)
      : (videoUrl || videoUrlFemale);

  const hasVideo = Boolean((videoUrl || videoUrlFemale) && !hasError);

  const togglePlay = (e) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Reset loading state when source changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [currentVideoUrl, gifUrl, exercise._id]);

  // 1. TIER 1: MP4 VIDEO
  if (hasVideo) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl bg-slate-950 flex items-center justify-center ${aspectRatio} ${className} group select-none`}
      >
        <video
          ref={videoRef}
          key={currentVideoUrl}
          src={currentVideoUrl}
          poster={thumbnailUrl || undefined}
          loop
          muted={isMuted}
          playsInline
          autoPlay={autoPlay}
          preload="metadata"
          onLoadedData={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-purple-500 animate-spin" />
          </div>
        )}

        {/* Video Overlay Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            HD Video Demo
          </span>

          {/* Gender Switcher if both male and female are available */}
          {hasMaleAndFemale && (
            <div className="inline-flex rounded-lg bg-black/70 backdrop-blur-md p-0.5 pointer-events-auto border border-white/15">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveGender("male");
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  activeGender === "male"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveGender("female");
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  activeGender === "female"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Female
              </button>
            </div>
          )}
        </div>

        {/* Play / Pause Center Flash Overlay */}
        {!isPlaying && !isLoading && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-opacity"
          >
            <div className="w-12 h-12 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
              <Play className="w-5 h-5 fill-slate-900 ml-0.5" />
            </div>
          </div>
        )}

        {/* Bottom Controls Bar */}
        {showControls && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs z-10">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <span className="text-[10px] text-slate-300 font-medium truncate max-w-[200px]">
              {exercise.name}
            </span>

            <button
              type="button"
              onClick={toggleMute}
              className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. TIER 2: ANIMATED GIF
  if (gifUrl && !hasError) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl bg-white border border-slate-200 flex items-center justify-center ${aspectRatio} ${className} group`}
      >
        <img
          src={gifUrl}
          alt={`${name} animated demonstration`}
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          className="w-full h-full object-contain"
        />

        {/* Loading placeholder */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse">
            <Dumbbell className="w-6 h-6 text-slate-300 animate-bounce" />
          </div>
        )}

        {/* Top GIF badge */}
        <div className="absolute top-2.5 left-2.5 pointer-events-none z-10">
          <span className="px-2 py-0.5 rounded-md bg-purple-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
            ⚡ Animated Demo
          </span>
        </div>

        {/* Attribution watermark */}
        {attribution && (
          <div className="absolute bottom-1 right-2 pointer-events-none text-[9px] text-slate-400/80 bg-white/70 px-1 rounded">
            {attribution}
          </div>
        )}
      </div>
    );
  }

  // 3. TIER 3: START / PEAK ILLUSTRATIONS (RepDB / yuhonas)
  if (images && images.length > 0) {
    const hasMultiple = images.length > 1;
    const currentImg = hasMultiple ? (imageTab === "start" ? images[0] : images[1]) : images[0];

    return (
      <div
        className={`relative overflow-hidden rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center ${aspectRatio} ${className}`}
      >
        <img
          src={currentImg}
          alt={`${name} illustration (${imageTab})`}
          loading="lazy"
          className="w-full h-full object-contain p-2"
        />

        {/* Top Badge */}
        <div className="absolute top-2.5 left-2.5 pointer-events-none z-10">
          <span className="px-2 py-0.5 rounded-md bg-slate-800/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
            Movement Diagram
          </span>
        </div>

        {/* Start / Peak position switcher */}
        {hasMultiple && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 inline-flex rounded-xl bg-black/60 backdrop-blur-md p-1 border border-white/10 z-10">
            <button
              type="button"
              onClick={() => setImageTab("start")}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                imageTab === "start"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Start Position
            </button>
            <button
              type="button"
              onClick={() => setImageTab("peak")}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                imageTab === "peak"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Peak Position
            </button>
          </div>
        )}
      </div>
    );
  }

  // Fallback: Static Thumbnail if available
  if (thumbnailUrl && !hasError) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center ${aspectRatio} ${className}`}
      >
        <img
          src={thumbnailUrl}
          alt={name}
          loading="lazy"
          className="w-full h-full object-contain"
        />
        <div className="absolute top-2.5 left-2.5 pointer-events-none">
          <span className="px-2 py-0.5 rounded-md bg-slate-700/80 text-white text-[10px] font-bold uppercase">
            Poster
          </span>
        </div>
      </div>
    );
  }

  // 4. TIER 4: PLACEHOLDER (Text / Muscle Icon)
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br from-slate-100 to-purple-50 border border-slate-200 flex flex-col items-center justify-center p-6 text-center ${aspectRatio} ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2 shadow-xs">
        <Dumbbell className="w-6 h-6 stroke-[2]" />
      </div>
      <span className="text-xs font-black text-slate-800">{exercise.name}</span>
      <span className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">
        {exercise.primaryMuscle} • {exercise.equipment}
      </span>
    </div>
  );
};

export default ExerciseMedia;

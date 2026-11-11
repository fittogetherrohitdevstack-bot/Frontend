import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { photoSetApi } from "../../api/endpoints";
import { Sheet } from "../ui/Sheet";
import { Button } from "../ui/Button";
import { haptics } from "../../motion/Haptics";
import { compressAndStripExif } from "../../utils/imageCompression";
import {
  POSE_CONFIG,
  POSE_ORDER,
  PoseSilhouetteOverlay,
} from "./PoseSilhouetteOverlay";
import {
  Camera,
  RotateCcw,
  RefreshCw,
  Timer,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Lightbulb,
  X,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  WifiOff,
  Loader2,
} from "lucide-react";

const TIPS_STORAGE_KEY = "ft_photo_consistency_tips_dismissed";

export const PhotoCaptureWizard = ({
  open,
  onOpenChange,
  initialPose = "front_relaxed",
  cycleNumber,
  targetDate,
  existingSet = null,
  storageConfigured = true,
}) => {
  const queryClient = useQueryClient();

  const [activePose, setActivePose] = useState(initialPose || "front_relaxed");
  const [tipsDismissed, setTipsDismissed] = useState(() => {
    try {
      return localStorage.getItem(TIPS_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  // Track which poses exist right now (starts from existingSet, updates immediately on upload)
  const [capturedPoses, setCapturedPoses] = useState({});
  const [note, setNote] = useState("");

  // Camera state
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [facingMode, setFacingMode] = useState("environment");
  const [cameraStatus, setCameraStatus] = useState("idle"); // idle | starting | ready | unavailable
  const [cameraError, setCameraError] = useState("");
  const [countdown, setCountdown] = useState(null); // null | 10..0
  const [showOverlay, setShowOverlay] = useState(true);

  // Preview & upload state
  const [stagedFile, setStagedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");

  const stopCameraStream = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setCountdown(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore track stop failures
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const clearPreview = useCallback(() => {
    setStagedFile(null);
    setUploadError("");
    setUploadProgress(0);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
  }, []);

  // Sync initial pose & existing poses when sheet opens
  useEffect(() => {
    if (!open) {
      stopCameraStream();
      clearPreview();
      return;
    }

    const existingPhotos = existingSet?.photos || {};
    const map = {};
    for (const poseKey of POSE_ORDER) {
      if (existingPhotos?.[poseKey]?.url) {
        map[poseKey] = existingPhotos[poseKey].url;
      }
    }
    setCapturedPoses(map);
    setNote(existingSet?.note || "");

    if (initialPose && POSE_ORDER.includes(initialPose)) {
      setActivePose(initialPose);
    } else {
      const firstMissing = POSE_ORDER.find((p) => !map[p]);
      setActivePose(firstMissing || "front_relaxed");
    }
  }, [open, initialPose, existingSet, stopCameraStream, clearPreview]);

  // Start live camera when sheet is open and we are not previewing a captured shot
  const startCamera = useCallback(async () => {
    if (!open || stagedFile) return;

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraStatus("unavailable");
      setCameraError(
        "Live camera preview isn't available in this browser context. Use device camera or gallery below."
      );
      return;
    }

    stopCameraStream();
    setCameraStatus("starting");
    setCameraError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 1600 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraStatus("ready");
    } catch (err) {
      stopCameraStream();
      setCameraStatus("unavailable");
      const msg =
        err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError"
          ? "Camera permission wasn't granted. You can still use your device camera app or choose a photo."
          : "No live camera feed detected. Use your device camera or choose from gallery below.";
      setCameraError(msg);
    }
  }, [open, stagedFile, facingMode, stopCameraStream]);

  useEffect(() => {
    if (open && !stagedFile) {
      startCamera();
    }
    return () => {
      stopCameraStream();
    };
  }, [open, stagedFile, facingMode, startCamera, stopCameraStream]);

  // Cleanup preview object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      stopCameraStream();
    };
  }, [previewUrl, stopCameraStream]);

  const handleDismissTips = () => {
    haptics.tick();
    setTipsDismissed(true);
    try {
      localStorage.setItem(TIPS_STORAGE_KEY, "1");
    } catch {
      // ignore storage quota errors
    }
  };

  const handleShowTips = () => {
    haptics.tick();
    setTipsDismissed(false);
    try {
      localStorage.removeItem(TIPS_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const stageProcessedFile = async (rawFile) => {
    if (!rawFile) return;
    setIsCompressing(true);
    setUploadError("");
    try {
      const cleanFile = await compressAndStripExif(rawFile);
      stopCameraStream();
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(cleanFile);
      });
      setStagedFile(cleanFile);
    } catch (err) {
      toast.error(err?.message || "Could not prepare photo. Please try another image.");
    } finally {
      setIsCompressing(false);
    }
  };

  const snapFromLiveVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      toast.error("Camera frame isn't ready yet.");
      return;
    }

    haptics.tick();
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );
    if (!blob) {
      toast.error("Could not capture camera frame.");
      return;
    }

    const rawFile = new File([blob], `${activePose}-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
    await stageProcessedFile(rawFile);
  }, [activePose]);

  const startSelfTimer = () => {
    if (cameraStatus !== "ready") return;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      setCountdown(null);
      return;
    }

    haptics.tick();
    let remaining = 10;
    setCountdown(remaining);

    timerIntervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        setCountdown(null);
        snapFromLiveVideo();
      } else {
        if (remaining <= 3) haptics.tick();
        setCountdown(remaining);
      }
    }, 1000);
  };

  const handleFilePicked = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await stageProcessedFile(file);
  };

  const handleUpload = async () => {
    if (!stagedFile || isUploading) return;

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setUploadError("You appear to be offline. Your compressed photo is kept ready — tap Retry when connected.");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    setUploadProgress(5);

    try {
      const formData = new FormData();
      formData.append("photo", stagedFile);
      formData.append("pose", activePose);
      if (cycleNumber) formData.append("cycleNumber", String(cycleNumber));
      if (targetDate) formData.append("date", targetDate);
      if (note.trim()) formData.append("note", note.trim());

      const res = await photoSetApi.uploadPosePhoto(formData, (progressEvent) => {
        if (progressEvent?.total) {
          const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(Math.min(99, Math.max(10, pct)));
        }
      });

      setUploadProgress(100);
      haptics.success();

      const payload = res?.data?.data || res?.data || res || {};
      const updatedSet = payload?.set;
      const updatedMap = { ...capturedPoses };
      for (const poseKey of POSE_ORDER) {
        if (updatedSet?.photos?.[poseKey]?.url) {
          updatedMap[poseKey] = updatedSet.photos[poseKey].url;
        }
      }
      updatedMap[activePose] =
        updatedSet?.photos?.[activePose]?.url || previewUrl || "saved";
      setCapturedPoses(updatedMap);

      queryClient.invalidateQueries({ queryKey: ["photo-sets"] });
      queryClient.invalidateQueries({ queryKey: ["photo-set-current"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-target"] });
      queryClient.invalidateQueries({ queryKey: ["reminders-due"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });

      if (payload?.justCompletedSet) {
        toast.success(
          "All 3 poses saved privately (+20 pts)! Your bi-weekly check-in is complete."
        );
        clearPreview();
        onOpenChange(false);
        return;
      }

      const cfg = POSE_CONFIG[activePose];
      toast.success(`${cfg.label} saved privately`);
      clearPreview();

      // Advance to the next missing pose automatically if any remain
      const nextMissing = POSE_ORDER.find(
        (p) => p !== activePose && !updatedMap[p]
      );
      if (nextMissing) {
        setActivePose(nextMissing);
      }
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      if (status === 503) {
        setUploadError(
          serverMsg ||
            "Photo storage isn't configured on the server yet. Reminders and tracking still work normally."
        );
      } else {
        setUploadError(
          serverMsg ||
            "Upload couldn't finish. Your photo is still staged locally — tap Retry upload to try again."
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetakeLocal = () => {
    haptics.tick();
    // Note: old server photo for this pose stays intact until a new upload succeeds
    clearPreview();
  };

  const activeCfg = POSE_CONFIG[activePose] || POSE_CONFIG.front_relaxed;
  const completedCount = POSE_ORDER.filter((p) => Boolean(capturedPoses[p])).length;

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          stopCameraStream();
          clearPreview();
        }
        onOpenChange(nextOpen);
      }}
      title="Bi-Weekly Progress Check-In"
      description="Front relaxed · Side relaxed · Back relaxed — private to you by default"
      className="max-h-[95dvh]"
    >
      <div className="space-y-4 pb-4" role="region" aria-label="Guided pose capture wizard">
        {/* Stepper pills across the 3 standard poses */}
        <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Check-in poses">
          {POSE_ORDER.map((poseKey, index) => {
            const cfg = POSE_CONFIG[poseKey];
            const isActive = poseKey === activePose;
            const isSaved = Boolean(capturedPoses[poseKey]);
            return (
              <button
                key={poseKey}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  haptics.tick();
                  if (stagedFile) clearPreview();
                  setActivePose(poseKey);
                }}
                className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : isSaved
                    ? "bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="min-w-0">
                  <span
                    className={`block text-[10px] font-bold uppercase tracking-wider ${
                      isActive
                        ? "text-lime-300"
                        : isSaved
                        ? "text-emerald-600"
                        : "text-slate-400"
                    }`}
                  >
                    Step {index + 1}
                  </span>
                  <span className="block text-xs font-extrabold truncate">
                    {cfg.shortLabel}
                  </span>
                </div>
                {isSaved && (
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-lime-400" : "text-emerald-600"
                    }`}
                    aria-label="Captured"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Storage unavailable notice if backend returned disabled */}
        {!storageConfigured && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-bold">Photo cloud storage isn't configured yet</p>
              <p className="mt-0.5 text-amber-700">
                Add Cloudinary credentials on the server to upload new photos. Your cycle schedule and reminders still work normally.
              </p>
            </div>
          </div>
        )}

        {/* Consistency Tips (one-time dismissible) */}
        {!tipsDismissed ? (
          <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/70 px-3.5 py-3 text-xs text-indigo-950">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-indigo-900">
                    Tips for fair 2-week comparisons
                  </p>
                  <ul className="mt-1 space-y-0.5 text-[11px] text-indigo-800 list-disc pl-4">
                    <li>Same morning time (fasted) &amp; same bright indoor spot</li>
                    <li>Prop phone at chest/waist height ~1.5–2 m away</li>
                    <li>Relax naturally — no flexing or sucking in</li>
                  </ul>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismissTips}
                aria-label="Dismiss lighting tips"
                className="min-w-[36px] min-h-[36px] -mt-1 -mr-1 rounded-lg hover:bg-indigo-100 text-indigo-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              Private by default · EXIF/GPS stripped before upload
            </span>
            <button
              type="button"
              onClick={handleShowTips}
              className="font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2 cursor-pointer"
            >
              Show tips
            </button>
          </div>
        )}

        {/* Main Viewport: Either Staged Preview OR Live Camera / Fallback Dropzone */}
        <div className="relative w-full aspect-[3/4] max-h-[420px] mx-auto rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner flex items-center justify-center">
          {stagedFile && previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt={`${activeCfg.label} preview`}
                className="w-full h-full object-contain bg-slate-950"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/75 text-white text-[11px] font-bold backdrop-blur-sm border border-white/15">
                {activeCfg.label} · {Math.round(stagedFile.size / 1024)} KB (EXIF stripped)
              </div>
            </>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover ${
                  cameraStatus === "ready" ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* Semi-transparent pose guide overlay */}
              {showOverlay && (
                <PoseSilhouetteOverlay
                  pose={activePose}
                  showInstruction={countdown === null}
                />
              )}

              {/* Countdown Overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 text-white">
                  <span className="text-7xl font-black tabular-nums tracking-tight drop-shadow-lg">
                    {countdown}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest mt-1 text-lime-300">
                    Step into frame…
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="mt-4 min-h-[44px]"
                    onClick={startSelfTimer}
                  >
                    Cancel timer
                  </Button>
                </div>
              )}

              {/* Unavailable camera fallback message */}
              {cameraStatus === "unavailable" && (
                <div className="absolute inset-x-4 top-4 z-10 rounded-xl bg-slate-950/80 border border-white/15 px-3.5 py-2.5 text-center text-white">
                  <p className="text-xs font-semibold">{cameraError}</p>
                </div>
              )}

              {cameraStatus === "starting" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-semibold">Starting camera…</span>
                </div>
              )}

              {/* Top camera utility controls */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    haptics.tick();
                    setShowOverlay((v) => !v);
                  }}
                  className="min-h-[40px] px-2.5 rounded-xl bg-slate-950/65 text-white text-[11px] font-bold border border-white/15 backdrop-blur-sm hover:bg-slate-950/80 cursor-pointer"
                >
                  {showOverlay ? "Hide guide" : "Show guide"}
                </button>
                {cameraStatus === "ready" && (
                  <button
                    type="button"
                    aria-label="Switch front or back camera"
                    onClick={() => {
                      haptics.tick();
                      setFacingMode((m) => (m === "user" ? "environment" : "user"));
                    }}
                    className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-950/65 text-white border border-white/15 backdrop-blur-sm hover:bg-slate-950/80 flex items-center justify-center cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          )}

          {isCompressing && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-30">
              <Loader2 className="w-6 h-6 animate-spin text-lime-400" />
              <span className="text-xs font-bold">Optimizing &amp; stripping EXIF…</span>
            </div>
          )}
        </div>

        {/* Pose posture note */}
        <p className="text-xs text-slate-600 text-center px-2">
          <span className="font-bold text-slate-800">{activeCfg.label}:</span>{" "}
          {activeCfg.tips}
        </p>

        {/* Action controls depending on stage */}
        {stagedFile ? (
          <div className="space-y-3">
            {/* Upload progress bar */}
            {isUploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>Uploading privately…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-lime-500 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload error with explicit retry */}
            {uploadError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 flex items-start gap-2">
                <WifiOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Optional set note */}
            <div>
              <label
                htmlFor="photo-checkin-note"
                className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
              >
                Optional check-in note
              </label>
              <input
                id="photo-checkin-note"
                type="text"
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Morning fasted, window lighting"
                className="w-full min-h-[46px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={handleRetakeLocal}
                className="min-h-[48px] font-bold"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Retake
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={isUploading}
                onClick={handleUpload}
                className="min-h-[48px] font-bold"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Saving…
                  </>
                ) : uploadError ? (
                  <>
                    <Upload className="w-4 h-4 mr-1.5" />
                    Retry upload
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Use photo
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Live camera capture row */}
            {cameraStatus === "ready" && (
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  disabled={countdown !== null || isCompressing}
                  onClick={startSelfTimer}
                  className="min-h-[48px] font-bold"
                >
                  <Timer className="w-4 h-4 mr-1.5 text-indigo-600" />
                  10s Self-Timer
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={countdown !== null || isCompressing}
                  onClick={snapFromLiveVideo}
                  className="min-h-[48px] font-bold"
                >
                  <Camera className="w-4 h-4 mr-1.5" />
                  Snap {activeCfg.shortLabel}
                </Button>
              </div>
            )}

            {/* Native camera & gallery pickers (always accessible fallback) */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  haptics.tick();
                  cameraInputRef.current?.click();
                }}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Camera className="w-4 h-4 text-slate-600" />
                Device camera
              </button>
              <button
                type="button"
                onClick={() => {
                  haptics.tick();
                  galleryInputRef.current?.click();
                }}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-slate-600" />
                Choose photo
              </button>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFilePicked}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleFilePicked}
              className="hidden"
            />

            {/* Allow leaving cleanly even with partial check-in */}
            <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
              <span>
                {completedCount}/3 poses captured in this check-in
              </span>
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  onOpenChange(false);
                }}
                className="min-h-[44px] px-2.5 font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
              >
                Done for now
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
};

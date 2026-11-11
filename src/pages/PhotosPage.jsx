import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi, photoSetApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Sheet } from "../components/ui/Sheet";
import { FadeUp } from "../motion";
import { haptics } from "../motion/Haptics";
import { POSE_CONFIG, POSE_ORDER } from "../components/photos/PoseSilhouetteOverlay";
import { PhotoCaptureWizard } from "../components/photos/PhotoCaptureWizard";
import { PhotoCompareView } from "../components/photos/PhotoCompareView";
import {
  Camera,
  Calendar,
  Shield,
  Lock,
  Users,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  SlidersHorizontal,
  Images,
  Scale,
  Plus,
  X,
  Bell,
} from "lucide-react";

const LazyProgressImage = ({ src, alt, onClick }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-zoom-in group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.03] ${
          loaded ? "opacity-100 blur-0" : "opacity-0 blur-xs"
        }`}
      />
    </button>
  );
};

const formatDateLabel = (ymd) => {
  if (!ymd) return "—";
  const [y, m, d] = String(ymd).split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

const getCycleBadgeMeta = (status) => {
  switch (status) {
    case "done":
    case "completed":
      return {
        label: "Complete",
        classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
        Icon: CheckCircle2,
      };
    case "due":
      return {
        label: "Due now",
        classes: "bg-indigo-50 text-indigo-700 border-indigo-200",
        Icon: Clock,
      };
    case "overdue":
      return {
        label: "Overdue",
        classes: "bg-amber-50 text-amber-800 border-amber-200",
        Icon: AlertCircle,
      };
    default:
      return {
        label: "Scheduled",
        classes: "bg-slate-100 text-slate-700 border-slate-200",
        Icon: Calendar,
      };
  }
};

export const PhotosPage = () => {
  const queryClient = useQueryClient();
  const { profile, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const photoEnabled = Boolean(profile?.featureFlags?.photoCheckins);
  const hideWeightNumbers = Boolean(profile?.hideWeightNumbers);

  const [activeTab, setActiveTab] = useState("timeline"); // timeline | compare
  const [wizardState, setWizardState] = useState({
    open: false,
    pose: "front_relaxed",
    cycleNumber: undefined,
    targetDate: undefined,
    existingSet: null,
  });

  // Confirmation sheets (never inline risky actions silently)
  const [shareConfirmSet, setShareConfirmSet] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'set'|'pose', setId, pose, cycleNumber }
  const [anchorSheetOpen, setAnchorSheetOpen] = useState(false);
  const [anchorInput, setAnchorInput] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null); // { url, label }

  // Close lightbox cleanly on Escape
  useEffect(() => {
    if (!lightboxImage) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxImage(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxImage]);

  const currentQuery = useQuery({
    queryKey: ["photo-set-current"],
    queryFn: async () => {
      const res = await photoSetApi.getCurrent();
      return res.data?.data;
    },
    enabled: photoEnabled,
  });

  const setsQuery = useQuery({
    queryKey: ["photo-sets"],
    queryFn: async () => {
      const res = await photoSetApi.listSets();
      return res.data?.data;
    },
    enabled: photoEnabled,
  });

  const currentInfo = currentQuery.data || {};
  const sets = useMemo(() => setsQuery.data?.sets || [], [setsQuery.data]);
  const storageConfigured =
    currentInfo?.configured ?? setsQuery.data?.configured ?? true;

  // Handle `?capture=1` deep link from notifications / "Due today" strip
  useEffect(() => {
    if (!photoEnabled) return;
    if (searchParams.get("capture") === "1" && currentQuery.isSuccess) {
      const existing = currentInfo?.set || null;
      const missingPose =
        POSE_ORDER.find((p) => !existing?.photos?.[p]?.url) || "front_relaxed";
      setWizardState({
        open: true,
        pose: missingPose,
        cycleNumber: currentInfo?.cycleNumber,
        targetDate: currentInfo?.todayLocalDate,
        existingSet: existing,
      });
      const next = new URLSearchParams(searchParams);
      next.delete("capture");
      setSearchParams(next, { replace: true });
    }
  }, [photoEnabled, currentQuery.isSuccess, currentInfo, searchParams, setSearchParams]);

  // Enable photoCheckins opt-in mutation
  const enableFeatureMutation = useMutation({
    mutationFn: () => authApi.updateFeatures({ photoCheckins: true }),
    onSuccess: async () => {
      haptics.success();
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["photo-set-current"] });
      queryClient.invalidateQueries({ queryKey: ["photo-sets"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-target"] });
      toast.success("Bi-weekly progress photos enabled!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Could not update feature settings");
    },
  });

  // Update visibility mutation
  const visibilityMutation = useMutation({
    mutationFn: ({ setId, visibility }) =>
      photoSetApi.updateVisibility(setId, visibility),
    onSuccess: (_, vars) => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: ["photo-sets"] });
      queryClient.invalidateQueries({ queryKey: ["photo-set-current"] });
      queryClient.invalidateQueries({ queryKey: ["group-shared-photos"] });
      setShareConfirmSet(null);
      toast.success(
        vars.visibility === "group"
          ? "Check-in shared with your active squad"
          : "Check-in returned to Private only"
      );
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Could not update visibility");
    },
  });

  // Delete pose or entire set mutation
  const deleteMutation = useMutation({
    mutationFn: async (target) => {
      if (target.type === "pose") {
        return photoSetApi.deletePosePhoto(target.setId, target.pose);
      }
      return photoSetApi.deleteSet(target.setId);
    },
    onSuccess: () => {
      haptics.tick();
      queryClient.invalidateQueries({ queryKey: ["photo-sets"] });
      queryClient.invalidateQueries({ queryKey: ["photo-set-current"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-target"] });
      queryClient.invalidateQueries({ queryKey: ["reminders-due"] });
      setDeleteConfirm(null);
      toast.success("Removed cleanly");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Could not delete item");
    },
  });

  // Anchor date update mutation
  const anchorMutation = useMutation({
    mutationFn: (anchorDate) => photoSetApi.updateAnchor(anchorDate),
    onSuccess: () => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: ["photo-set-current"] });
      queryClient.invalidateQueries({ queryKey: ["photo-sets"] });
      queryClient.invalidateQueries({ queryKey: ["reminder-settings"] });
      queryClient.invalidateQueries({ queryKey: ["reminders-due"] });
      setAnchorSheetOpen(false);
      toast.success("Bi-weekly cycle anchor updated (past photos preserved)");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Could not update cycle anchor");
    },
  });

  const openCaptureForCurrent = (poseOverride) => {
    haptics.tick();
    const existing = currentInfo?.set || null;
    const pose =
      poseOverride ||
      POSE_ORDER.find((p) => !existing?.photos?.[p]?.url) ||
      "front_relaxed";
    setWizardState({
      open: true,
      pose,
      cycleNumber: currentInfo?.cycleNumber,
      targetDate: currentInfo?.todayLocalDate,
      existingSet: existing,
    });
  };

  if (!photoEnabled) {
    return (
      <FadeUp>
        <div className="max-w-xl mx-auto px-4 py-8">
          <Card className="p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-lime-100 text-lime-700 mx-auto flex items-center justify-center shadow-xs">
              <Camera className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Bi-Weekly Progress Photos
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Visible change takes weeks, not days. Checking in every{" "}
                <span className="font-bold text-slate-800">14 days</span> with 3 relaxed
                poses (Front, Side, Back) highlights real trends without daily noise.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-left space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800">Private by default:</strong> Stored
                  behind signed authenticated URLs, never shared unless you explicitly tap{" "}
                  <em>Share with squad</em>.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800">EXIF &amp; GPS stripped:</strong>{" "}
                  Photos are compressed and re-encoded on your device before leaving it.
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              disabled={enableFeatureMutation.isPending}
              onClick={() => enableFeatureMutation.mutate()}
              className="w-full min-h-[48px] text-sm font-bold"
            >
              {enableFeatureMutation.isPending
                ? "Enabling…"
                : "Enable Bi-Weekly Progress Photos"}
            </Button>
          </Card>
        </div>
      </FadeUp>
    );
  }

  const badgeMeta = getCycleBadgeMeta(currentInfo?.status);
  const BadgeIcon = badgeMeta.Icon;

  return (
    <FadeUp>
      <div className="max-w-4xl mx-auto px-4 py-5 space-y-5 pb-24">
        {/* Top Hero / Cycle Status Card */}
        <Card className="p-5 sm:p-6 bg-gradient-to-br from-white via-white to-lime-50/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Cycle #{currentInfo?.cycleNumber || 1} · Every 14 days
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeMeta.classes}`}
                >
                  <BadgeIcon className="w-3.5 h-3.5" />
                  {badgeMeta.label}
                </span>
              </div>

              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Bi-Weekly Progress Photos
              </h1>

              <p className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  This cycle:{" "}
                  <strong className="text-slate-900">
                    {currentInfo?.completedCount ?? 0}/3 poses
                  </strong>
                </span>
                {currentInfo?.nextDueDate && (
                  <span>
                    Next check-in:{" "}
                    <strong className="text-slate-900">
                      {formatDateLabel(currentInfo.nextDueDate)}
                    </strong>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <Lock className="w-3 h-3" /> Private default
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  haptics.tick();
                  setAnchorInput(
                    currentInfo?.anchorDateLocal ||
                      setsQuery.data?.anchorDateLocal ||
                      ""
                  );
                  setAnchorSheetOpen(true);
                }}
                className="min-h-[44px] text-xs font-bold"
              >
                <Calendar className="w-4 h-4 mr-1.5 text-slate-600" />
                Cycle Anchor
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => openCaptureForCurrent()}
                className="min-h-[44px] text-xs sm:text-sm font-bold"
              >
                <Camera className="w-4 h-4 mr-1.5" />
                {currentInfo?.completedCount > 0 && !currentInfo?.isComplete
                  ? `Finish Check-In (${currentInfo.completedCount}/3)`
                  : currentInfo?.isComplete
                  ? "Update Current Set"
                  : "Capture Check-In"}
              </Button>
            </div>
          </div>

          {/* Graceful warning if Cloudinary env variables are blank */}
          {!storageConfigured && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Cloudinary isn't configured yet</p>
                <p className="text-amber-800 mt-0.5">
                  Photo uploads are paused until server storage credentials are set. Your cycle schedule and in-app reminders continue working normally.
                </p>
              </div>
              <Link
                to="/settings/reminders"
                className="shrink-0 font-bold text-amber-900 underline underline-offset-2 inline-flex items-center gap-1"
              >
                <Bell className="w-3.5 h-3.5" />
                Reminders
              </Link>
            </div>
          )}
        </Card>

        {/* Sub-view Switcher: Timeline vs Compare */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200/70">
            <button
              type="button"
              onClick={() => {
                haptics.tick();
                setActiveTab("timeline");
              }}
              className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === "timeline"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Images className="w-4 h-4" />
              Timeline ({sets.length})
            </button>
            <button
              type="button"
              onClick={() => {
                haptics.tick();
                setActiveTab("compare");
              }}
              className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === "compare"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Compare
            </button>
          </div>

          <Link
            to="/settings/reminders"
            className="min-h-[40px] px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-indigo-600" />
            Reminder schedule
          </Link>
        </div>

        {/* Content Body */}
        {activeTab === "compare" ? (
          <PhotoCompareView sets={sets} hideWeightNumbers={hideWeightNumbers} />
        ) : setsQuery.isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="p-5 animate-pulse space-y-3">
                <div className="h-4 w-44 rounded bg-slate-200" />
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="aspect-[3/4] rounded-xl bg-slate-200" />
                  <div className="aspect-[3/4] rounded-xl bg-slate-200" />
                  <div className="aspect-[3/4] rounded-xl bg-slate-200" />
                </div>
              </Card>
            ))}
          </div>
        ) : sets.length === 0 ? (
          <Card className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
              <Camera className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">
                No check-in photos yet
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Take your first Front, Side, and Back relaxed set today. Future cycles line
                up cleanly every 14 days.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => openCaptureForCurrent("front_relaxed")}
              className="min-h-[48px] px-6 font-bold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Start Cycle #{currentInfo?.cycleNumber || 1}
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {sets.map((set) => {
              const isGroupShared = set.visibility === "group";
              const isCurrentCycle = set.cycleNumber === currentInfo?.cycleNumber;
              return (
                <Card key={set._id} className="p-4 sm:p-5 space-y-4">
                  {/* Set header */}
                  <div className="flex flex-wrap items-start justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-extrabold text-slate-900">
                          Cycle #{set.cycleNumber}
                        </h2>
                        <span className="text-xs font-semibold text-slate-500">
                          {formatDateLabel(set.date)}
                        </span>
                        {!hideWeightNumbers && typeof set.weightKg === "number" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold tabular-nums">
                            <Scale className="w-3 h-3 text-slate-500" />
                            {set.weightKg.toFixed(1)} kg
                          </span>
                        )}
                      </div>
                      {set.note && (
                        <p className="text-xs text-slate-600">{set.note}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          isGroupShared
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {isGroupShared ? (
                          <>
                            <Users className="w-3 h-3" /> Squad shared
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" /> Private
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* 3-Pose Strip */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
                    {POSE_ORDER.map((poseKey) => {
                      const cfg = POSE_CONFIG[poseKey];
                      const poseData = set.photos?.[poseKey];
                      const hasPhoto = Boolean(poseData?.url);
                      return (
                        <div key={poseKey} className="space-y-1.5">
                          <div className="flex items-center justify-between px-0.5">
                            <span className="text-[11px] font-bold text-slate-700 truncate">
                              {cfg.shortLabel}
                            </span>
                            {hasPhoto && (
                              <span className="text-[10px] font-semibold text-emerald-600">
                                Saved
                              </span>
                            )}
                          </div>

                          {hasPhoto ? (
                            <LazyProgressImage
                              src={poseData.url}
                              alt={`Cycle ${set.cycleNumber} ${cfg.label}`}
                              onClick={() =>
                                setLightboxImage({
                                  url: poseData.url,
                                  label: `Cycle #${set.cycleNumber} · ${cfg.label} (${formatDateLabel(
                                    set.date
                                  )})`,
                                })
                              }
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                haptics.tick();
                                setWizardState({
                                  open: true,
                                  pose: poseKey,
                                  cycleNumber: set.cycleNumber,
                                  targetDate: set.date,
                                  existingSet: set,
                                });
                              }}
                              className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 flex flex-col items-center justify-center p-2 text-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Camera className="w-5 h-5 text-slate-400" />
                              <span className="text-[11px] font-bold text-slate-600 leading-tight">
                                Add {cfg.shortLabel}
                              </span>
                            </button>
                          )}

                          {/* Per-pose retake / delete buttons */}
                          {hasPhoto && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  haptics.tick();
                                  setWizardState({
                                    open: true,
                                    pose: poseKey,
                                    cycleNumber: set.cycleNumber,
                                    targetDate: set.date,
                                    existingSet: set,
                                  });
                                }}
                                className="flex-1 min-h-[36px] px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 inline-flex items-center justify-center gap-1 cursor-pointer transition-colors"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Retake
                              </button>
                              <button
                                type="button"
                                aria-label={`Delete ${cfg.label}`}
                                onClick={() => {
                                  haptics.tick();
                                  setDeleteConfirm({
                                    type: "pose",
                                    setId: set._id,
                                    pose: poseKey,
                                    poseLabel: cfg.label,
                                    cycleNumber: set.cycleNumber,
                                  });
                                }}
                                className="min-w-[36px] min-h-[36px] rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Set Footer Actions */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isGroupShared ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={visibilityMutation.isPending}
                          onClick={() =>
                            visibilityMutation.mutate({
                              setId: set._id,
                              visibility: "private",
                            })
                          }
                          className="min-h-[40px] text-xs font-bold"
                        >
                          <Lock className="w-3.5 h-3.5 mr-1.5" />
                          Make private again
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={visibilityMutation.isPending}
                          onClick={() => {
                            haptics.tick();
                            setShareConfirmSet(set);
                          }}
                          className="min-h-[40px] text-xs font-bold"
                        >
                          <Users className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                          Share with squad
                        </Button>
                      )}

                      {isCurrentCycle && !set.isComplete && (
                        <Button
                          type="button"
                          size="sm"
                          variant="primary"
                          onClick={() => openCaptureForCurrent()}
                          className="min-h-[40px] text-xs font-bold"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Complete set
                        </Button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        haptics.tick();
                        setDeleteConfirm({
                          type: "set",
                          setId: set._id,
                          cycleNumber: set.cycleNumber,
                        });
                      }}
                      className="min-h-[40px] px-3 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete set
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Guided Capture Wizard Bottom Sheet */}
      <PhotoCaptureWizard
        open={wizardState.open}
        onOpenChange={(isOpen) =>
          setWizardState((prev) => ({ ...prev, open: isOpen }))
        }
        initialPose={wizardState.pose}
        cycleNumber={wizardState.cycleNumber}
        targetDate={wizardState.targetDate}
        existingSet={wizardState.existingSet}
        storageConfigured={storageConfigured}
      />

      {/* Explicit Group Sharing Confirmation Sheet */}
      <Sheet
        open={Boolean(shareConfirmSet)}
        onOpenChange={(open) => !open && setShareConfirmSet(null)}
        title="Share Check-In With Your Squad?"
        description="Privacy confirmation — your photos remain private until you confirm"
      >
        <div className="space-y-4 pb-2">
          <div className="rounded-2xl bg-indigo-50/80 border border-indigo-200 p-4 text-xs text-indigo-950 space-y-1.5">
            <p className="font-bold">
              Only Cycle #{shareConfirmSet?.cycleNumber} will become visible to members of your active group.
            </p>
            <p className="text-indigo-800">
              Other check-in dates stay private, and you can tap{" "}
              <strong>Make private again</strong> on this card at any time to revoke access.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShareConfirmSet(null)}
              className="min-h-[48px] font-bold"
            >
              Keep Private
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={visibilityMutation.isPending}
              onClick={() =>
                visibilityMutation.mutate({
                  setId: shareConfirmSet._id,
                  visibility: "group",
                })
              }
              className="min-h-[48px] font-bold"
            >
              {visibilityMutation.isPending ? "Sharing…" : "Yes, Share Check-In"}
            </Button>
          </div>
        </div>
      </Sheet>

      {/* Delete Pose / Set Confirmation Sheet */}
      <Sheet
        open={Boolean(deleteConfirm)}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title={
          deleteConfirm?.type === "pose"
            ? `Delete ${deleteConfirm?.poseLabel}?`
            : `Delete Cycle #${deleteConfirm?.cycleNumber} Set?`
        }
        description="This removes the stored photo cleanly and cannot be undone."
      >
        <div className="space-y-4 pb-2">
          <p className="text-xs text-slate-600">
            {deleteConfirm?.type === "pose"
              ? `Remove the ${deleteConfirm?.poseLabel} photo from Cycle #${deleteConfirm?.cycleNumber}? Other poses in this set will stay intact.`
              : `Delete all photos saved under Cycle #${deleteConfirm?.cycleNumber}?`}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="min-h-[48px] font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteConfirm)}
              className="min-h-[48px] font-bold bg-rose-600 hover:bg-rose-700 text-white border-rose-600"
            >
              {deleteMutation.isPending ? "Deleting…" : "Confirm Delete"}
            </Button>
          </div>
        </div>
      </Sheet>

      {/* Cycle Anchor Date Picker Sheet */}
      <Sheet
        open={anchorSheetOpen}
        onOpenChange={setAnchorSheetOpen}
        title="Bi-Weekly Cycle Anchor Date"
        description="Controls which Sundays or days start your 14-day check-in cadence"
      >
        <form
          className="space-y-4 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!anchorInput) return;
            anchorMutation.mutate(anchorInput);
          }}
        >
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
            Changing your cycle start date updates upcoming due dates and reminders.{" "}
            <strong className="text-slate-800">
              All existing check-in photos stay untouched in your timeline.
            </strong>
          </div>
          <div>
            <label
              htmlFor="photo-anchor-date"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Anchor start date
            </label>
            <input
              id="photo-anchor-date"
              type="date"
              required
              value={anchorInput}
              onChange={(e) => setAnchorInput(e.target.value)}
              className="w-full min-h-[46px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAnchorSheetOpen(false)}
              className="min-h-[48px] font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={anchorMutation.isPending}
              className="min-h-[48px] font-bold"
            >
              {anchorMutation.isPending ? "Saving…" : "Save Anchor"}
            </Button>
          </div>
        </form>
      </Sheet>

      {/* Lightbox Fullscreen Preview */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxImage.label}
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full flex flex-col items-center gap-3"
          >
            <div className="w-full flex items-center justify-between text-white">
              <span className="text-sm font-bold">{lightboxImage.label}</span>
              <button
                type="button"
                aria-label="Close lightbox"
                onClick={() => setLightboxImage(null)}
                className="min-w-[44px] min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.label}
              className="max-h-[78dvh] w-auto rounded-2xl object-contain shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </FadeUp>
  );
};

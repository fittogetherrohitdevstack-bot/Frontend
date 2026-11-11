import React, { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { Sheet } from "../ui/Sheet";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { haptics } from "../../motion/Haptics";
import { PRESET_AVATARS, getPresetAvatar } from "../../utils/avatars";
import { compressAvatarImage } from "../../utils/imageCompression";
import {
  Camera,
  Image as ImageIcon,
  Check,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react";

/**
 * Bottom sheet to upload/update a custom profile photo OR pick a built-in athletic avatar.
 */
export const AvatarPickerSheet = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const { user, profile, updateProfileData } = useAuth();

  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [isPreparing, setIsPreparing] = useState(false);

  const syncUserEverywhere = (updatedUser) => {
    if (updatedUser) {
      updateProfileData(updatedUser, profile);
    }
    queryClient.invalidateQueries({ queryKey: ["group-members"] });
    queryClient.invalidateQueries({ queryKey: ["group-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    queryClient.invalidateQueries({ queryKey: ["challenges"] });
    queryClient.invalidateQueries({ queryKey: ["group-shared-photos"] });
  };

  const uploadMutation = useMutation({
    mutationFn: (payload) => authApi.uploadAvatar(payload),
    onSuccess: (res) => {
      haptics.goal();
      const updatedUser = res.data?.data?.user;
      syncUserEverywhere(updatedUser);
      toast.success("Profile picture updated!");
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          "Could not save photo right now. You can pick a built-in avatar anytime."
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => authApi.removeAvatar(),
    onSuccess: (res) => {
      haptics.tick();
      const updatedUser = res.data?.data?.user;
      syncUserEverywhere(updatedUser);
      toast.success("Reverted to initials avatar");
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Could not remove photo");
    },
  });

  const handlePhotoSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsPreparing(true);
    try {
      const croppedFile = await compressAvatarImage(file);
      const formData = new FormData();
      formData.append("photo", croppedFile);
      uploadMutation.mutate(formData);
    } catch (err) {
      toast.error(err?.message || "Could not prepare photo");
    } finally {
      setIsPreparing(false);
    }
  };

  const handlePickPreset = (presetId) => {
    haptics.tick();
    uploadMutation.mutate({ avatarId: presetId });
  };

  const currentPreset = getPresetAvatar(user?.profileImage);
  const isBusy =
    isPreparing || uploadMutation.isPending || removeMutation.isPending;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Profile Photo & Avatar"
      description="Upload a photo or pick a built-in FitTogether avatar"
    >
      <div className="space-y-5 pb-3">
        {/* Live Preview Row */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-4">
          <Avatar
            src={user?.profileImage}
            name={user?.name || "User"}
            size="xl"
            ringColor="lime"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-extrabold text-slate-900 truncate">
              {user?.name || "FitTogether Athlete"}
            </p>
            <p className="text-xs text-slate-500">
              {currentPreset
                ? `Using "${currentPreset.label}" avatar`
                : user?.profileImage
                ? "Using custom profile photo"
                : "Using default initials — add a photo or pick an avatar below"}
            </p>
          </div>
        </div>

        {/* Upload Photo Actions */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Upload Personal Photo
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => {
                haptics.tick();
                cameraInputRef.current?.click();
              }}
              className="min-h-[48px] text-xs font-bold"
            >
              {isBusy ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 mr-1.5 text-lime-600" />
              )}
              Take Photo
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={isBusy}
              onClick={() => {
                haptics.tick();
                galleryInputRef.current?.click();
              }}
              className="min-h-[48px] text-xs font-bold"
            >
              {isBusy ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4 mr-1.5" />
              )}
              Choose Photo
            </Button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handlePhotoSelected}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelected}
            className="hidden"
          />
        </div>

        {/* Curated Preset Avatars Grid */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Or Pick a Built-In Avatar
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Instant · No photo needed
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {PRESET_AVATARS.map((item) => {
              const Icon = item.Icon;
              const isSelected = currentPreset?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isBusy}
                  onClick={() => handlePickPreset(item.id)}
                  className={`relative min-h-[76px] p-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-lime-50 border-lime-500 ring-2 ring-lime-400/50 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs ${item.bgClass} ${item.iconClass}`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                  </span>
                  <span className="text-[11px] font-bold text-slate-700 leading-none">
                    {item.label}
                  </span>
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-lime-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reset to Initials */}
        {user?.profileImage && (
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isBusy}
              onClick={() => removeMutation.mutate()}
              className="min-h-[44px] text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Remove &amp; Use Initials
            </Button>
          </div>
        )}
      </div>
    </Sheet>
  );
};

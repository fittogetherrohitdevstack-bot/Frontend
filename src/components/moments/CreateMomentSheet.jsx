import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Image as ImageIcon,
  X,
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { momentApi } from "../../api/endpoints";
import { compressAndStripExif } from "../../utils/imageCompression";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "gym", label: "Gym", emoji: "💪", color: "from-purple-500/10 to-indigo-500/10" },
  { id: "cheat_meal", label: "Cheat Meal", emoji: "🍕", color: "from-amber-500/10 to-orange-500/10" },
  { id: "funny", label: "Funny", emoji: "😂", color: "from-yellow-500/10 to-amber-500/10" },
  { id: "achievement", label: "Achievement", emoji: "🏆", color: "from-lime-500/10 to-emerald-500/10" },
  { id: "squad", label: "Squad", emoji: "👥", color: "from-sky-500/10 to-blue-500/10" },
  { id: "daily", label: "Daily Life", emoji: "🌿", color: "from-emerald-500/10 to-teal-500/10" },
];

const CAPTION_IDEAS = [
  "Crushed leg day with the squad today! 🏋️‍♂️",
  "Cheat meal hits different after 5 consecutive workouts 🍕",
  "That moment when the pre-workout finally kicks in 😂",
  "New personal record unlocked today! 🏆",
  "Sunday morning outdoor training session ☀️",
  "Consistency > Motivation. Week 4 complete! 🔥",
];

export const CreateMomentSheet = ({ isOpen, onClose, groupId }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [selectedFiles, setSelectedFiles] = useState([]); // array of { file, previewUrl }
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("gym");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  const resetForm = () => {
    selectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setSelectedFiles([]);
    setCaption("");
    setCategory("gym");
    setUploadProgress(0);
    setIsProcessingImages(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileSelect = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    if (selectedFiles.length + rawFiles.length > 6) {
      toast.error("You can select up to 6 photos per moment.");
      return;
    }

    setIsProcessingImages(true);
    haptics.tick();

    try {
      const processed = [];
      for (const raw of rawFiles) {
        // Compress & strip EXIF/GPS client-side
        const cleanFile = await compressAndStripExif(raw);
        const previewUrl = URL.createObjectURL(cleanFile);
        processed.push({ file: cleanFile, previewUrl });
      }

      setSelectedFiles((prev) => [...prev, ...processed]);
    } catch (err) {
      console.error("Image processing error", err);
      toast.error(err.message || "Failed to process photo");
    } finally {
      setIsProcessingImages(false);
      // Reset input value so re-selecting same file triggers onChange
      if (e.target) e.target.value = "";
    }
  };

  const handleRemovePhoto = (index) => {
    haptics.tick();
    setSelectedFiles((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      selectedFiles.forEach((item) => {
        formData.append("photos", item.file);
      });
      formData.append("caption", caption.trim());
      formData.append("category", category);

      const res = await momentApi.create(groupId, formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });
      return res.data?.data;
    },
    onSuccess: () => {
      haptics.goal();
      toast.success("Moment shared with your squad! 🔥", {
        description: "Your squadmates can now see and react to your photo.",
      });
      queryClient.invalidateQueries({ queryKey: ["squad-moments", groupId] });
      handleClose();
    },
    onError: (err) => {
      console.error("Create moment error", err);
      toast.error(err.response?.data?.message || "Failed to publish moment");
      setUploadProgress(0);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error("Please add at least one photo.");
      return;
    }
    haptics.selection();
    createMutation.mutate();
  };

  const handleApplyIdea = (idea) => {
    haptics.tick();
    setCaption(idea);
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Composer Sheet */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 320 }}
          className="relative w-full sm:max-w-xl bg-white border border-slate-200/90 rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92dvh] h-[90dvh] flex flex-col overflow-hidden"
        >
          {/* Mobile Top Drag Indicator */}
          <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center font-bold">
                <Camera className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Share a Moment
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Visible only to your squad
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form with Scrollable Body and Docked Mobile Footer */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Hidden File Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Photo Selection / Preview Area */}
            {selectedFiles.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center space-y-3 bg-slate-50/70 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center mx-auto shadow-xs">
                  <ImageIcon className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">
                    Add photos from today
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gym selfie, cheat meal, or squad win (up to 6 photos)
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isProcessingImages}
                    className="min-h-[42px] px-4 rounded-xl bg-slate-900 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImages}
                    className="min-h-[42px] px-4 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-slate-50 active:scale-95 transition-transform cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span>Choose Gallery</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
                  <span>Selected Photos ({selectedFiles.length}/6)</span>
                  {selectedFiles.length < 6 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-lime-700 hover:text-lime-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add more</span>
                    </button>
                  )}
                </div>

                {/* Photo Grid Preview */}
                <div className="grid grid-cols-3 gap-2">
                  {selectedFiles.map((item, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-xs"
                    >
                      <img
                        src={item.previewUrl}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                        aria-label="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute bottom-1 left-1.5 text-[9px] font-black text-white/90 bg-slate-950/60 px-1.5 py-0.5 rounded-md">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}

                  {selectedFiles.length < 6 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-lime-400 bg-slate-50/70 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <Plus className="w-5 h-5 text-slate-400" />
                      <span className="text-[10px] font-bold">Add</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Category Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                Category
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        haptics.tick();
                        setCategory(cat.id);
                      }}
                      className={`min-h-[40px] px-2 py-1.5 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 text-lime-400 border-slate-900 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200/90 hover:bg-white"
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Caption Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <label className="text-slate-700 font-black uppercase tracking-wider text-[11px]">
                  Caption
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {caption.length}/1000
                </span>
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="What happened today? Drop a funny moment or workout win..."
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime-400 resize-none transition-colors"
              />

              {/* Quick Idea Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                  Ideas:
                </span>
                {CAPTION_IDEAS.map((idea, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyIdea(idea)}
                    className="shrink-0 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                  >
                    {idea.slice(0, 28)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Progress Bar */}
            {createMutation.isPending && (
              <div className="space-y-1.5 p-3 rounded-2xl bg-lime-50 border border-lime-200">
                <div className="flex items-center justify-between text-xs font-extrabold text-lime-900">
                  <span>Uploading to Squad Moments...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-lime-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-lime-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

              </div>

              {/* Docked Mobile-First Bottom Actions */}
              <div className="px-5 py-3.5 pb-8 sm:pb-3.5 border-t border-slate-100 bg-white/95 backdrop-blur-md flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={createMutation.isPending}
                  className="flex-1 min-h-[48px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={selectedFiles.length === 0 || createMutation.isPending || isProcessingImages}
                  className="flex-2 min-h-[48px] rounded-2xl bg-lime-500 hover:bg-lime-400 text-slate-950 text-xs font-black tracking-wide shadow-md shadow-lime-500/25 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Share Moment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>,
      document.body
    );
};

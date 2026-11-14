import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { momentApi } from "../../api/endpoints";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "gym", label: "Gym", emoji: "💪" },
  { id: "cheat_meal", label: "Cheat Meal", emoji: "🍕" },
  { id: "funny", label: "Funny", emoji: "😂" },
  { id: "achievement", label: "Achievement", emoji: "🏆" },
  { id: "squad", label: "Squad", emoji: "👥" },
  { id: "daily", label: "Daily Life", emoji: "🌿" },
];

export const EditMomentModal = ({
  isOpen,
  onClose,
  groupId,
  moment,
}) => {
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState(moment?.caption || "");
  const [category, setCategory] = useState(moment?.category || "gym");

  const editMutation = useMutation({
    mutationFn: () => momentApi.update(groupId, moment._id, { caption, category }),
    onSuccess: () => {
      haptics.goal();
      toast.success("Moment updated!");
      queryClient.invalidateQueries({ queryKey: ["squad-moments", groupId] });
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update moment");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    haptics.selection();
    editMutation.mutate();
  };

  if (!isOpen || !moment || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 320 }}
          className="relative w-full sm:max-w-md bg-white border border-slate-200/90 rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Edit Moment
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Category */}
            <div className="space-y-1.5">
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
                      className={`min-h-[38px] px-2 py-1 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
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

            {/* Caption */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={1000}
                rows={3}
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime-400 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 pb-6 sm:pb-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editMutation.isPending}
                className="flex-1 min-h-[44px] rounded-2xl bg-lime-500 hover:bg-lime-400 text-slate-950 text-xs font-black shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {editMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

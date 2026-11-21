import React from "react";
import { Button } from "../ui/Button";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../../motion/Haptics";

export const DeleteWorkoutConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  isDeleting = false,
  workoutName = "this workout",
  workoutDate = "",
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4"
      >
        <div className="flex items-center justify-between pb-1">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="font-black text-slate-900 text-base">Delete Completed Workout?</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Are you sure you want to delete <span className="font-bold text-slate-900">"{workoutName}"</span>
            {workoutDate ? ` from ${workoutDate}` : ""}?
          </p>
          <div className="mt-3 p-3 rounded-2xl bg-rose-50/80 border border-rose-200/80 text-[11px] text-rose-800 font-medium leading-relaxed">
            ⚠️ This will permanently remove the session from your history, volume metrics, and personal records. This action cannot be undone.
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1 font-bold text-xs min-h-[44px]"
          >
            Keep Workout
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={isDeleting}
            onClick={() => {
              haptics.tick();
              onConfirm();
            }}
            className="flex-1 font-bold text-xs min-h-[44px] bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteWorkoutConfirmDialog;

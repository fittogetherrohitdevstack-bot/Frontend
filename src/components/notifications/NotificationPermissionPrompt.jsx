import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Sparkles, X } from "lucide-react";
import { Button } from "../ui/Button";
import { useNotifications } from "../../hooks/useNotifications";
import { haptics } from "../../motion/Haptics";

const PROMPT_DISMISSED_KEY = "fittogether_notif_prompt_dismissed";

export const NotificationPermissionPrompt = () => {
  const { permissionStatus, requestPermission } = useNotifications();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isDismissed = sessionStorage.getItem(PROMPT_DISMISSED_KEY);
    if (!isDismissed && (permissionStatus === "default" || permissionStatus === "prompt")) {
      setDismissed(false);
    } else {
      setDismissed(true);
    }
  }, [permissionStatus]);

  if (dismissed || permissionStatus === "granted" || permissionStatus === "denied") {
    return null;
  }

  const handleEnable = async () => {
    haptics.impact();
    await requestPermission();
    setDismissed(true);
  };

  const handleDismiss = () => {
    haptics.tick();
    sessionStorage.setItem(PROMPT_DISMISSED_KEY, "true");
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 pointer-events-auto"
      >
        <div className="bg-slate-900/95 backdrop-blur-xl border border-lime-400/30 text-white rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 relative overflow-hidden">
          {/* Subtle Glow Accent */}
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-lime-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-lime-500 text-slate-950 flex items-center justify-center font-black shadow-lg shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                  Stay in Sync with Your Squad
                  <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                </h4>
                <p className="text-xs text-slate-300 font-medium leading-snug mt-0.5">
                  Get notified when teammates post moments, log meals, or hit hydration goals.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="lime"
              size="sm"
              onClick={handleEnable}
              className="flex-1 text-xs font-black min-h-[42px] shadow-md cursor-pointer"
            >
              Enable Squad Alerts
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-xs font-bold text-slate-400 hover:text-white min-h-[42px] cursor-pointer"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationPermissionPrompt;

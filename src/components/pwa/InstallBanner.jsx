import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, X, Smartphone, Share } from "lucide-react";

const DISMISS_KEY = "ft_pwa_banner_dismissed_v1";

export const InstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      const ts = Number(localStorage.getItem(DISMISS_KEY) || 0);
      return ts > 0 && Date.now() - ts < 7 * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (dismissed) return;

    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Show lightweight hint on iOS Safari mobile
    const ua = window.navigator.userAgent || "";
    const isIos = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
    if (isIos && isSafari) {
      setShowIosHint(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosHint(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice?.outcome === "accepted") {
      handleDismiss();
    } else {
      setDeferredPrompt(null);
    }
  };

  const visible = !dismissed && (Boolean(deferredPrompt) || showIosHint);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="fixed bottom-20 md:bottom-5 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-sm z-40"
        >
          <div className="rounded-2xl bg-slate-900 text-white p-3.5 shadow-xl shadow-slate-900/25 border border-slate-700/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-500/20 border border-lime-400/40 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-lime-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold tracking-tight text-white">
                Install FitTogether App
              </p>
              {deferredPrompt ? (
                <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                  1-tap streak check-ins &amp; instant squad nudges.
                </p>
              ) : (
                <p className="text-[11px] text-slate-300 leading-snug mt-0.5 flex items-center gap-1 flex-wrap">
                  Tap <Share className="w-3 h-3 inline text-cyan-300" /> then{" "}
                  <strong className="text-white">Add to Home Screen</strong>
                </p>
              )}
            </div>
            {deferredPrompt && (
              <button
                type="button"
                onClick={handleInstall}
                className="min-h-[36px] px-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Install
              </button>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss install banner"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { haptics } from "../../motion/Haptics";

export const ImageViewerModal = ({
  isOpen,
  onClose,
  images = [],
  initialIndex = 0,
  author = null,
  caption = "",
  category = "",
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, currentIndex, images.length]);

  if (!isOpen || images.length === 0 || typeof document === "undefined") return null;

  const currentImage = images[currentIndex] || images[0];
  const imageUrl = typeof currentImage === "string" ? currentImage : currentImage.url;

  const handlePrev = () => {
    haptics.tick();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    haptics.tick();
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl select-none">
        {/* Top Header Controls */}
        <div className="absolute top-0 left-0 right-0 z-50 p-4 sm:p-6 flex items-center justify-between text-white safe-top">
          <div className="flex items-center gap-3">
            {author && (
              <div className="flex items-center gap-2.5">
                <Avatar
                  src={author.profileImage}
                  name={author.name || "Member"}
                  size="sm"
                  ringColor="lime"
                />
                <div>
                  <h4 className="text-sm font-extrabold text-white leading-tight">
                    {author.name || "Squad Member"}
                  </h4>
                  {images.length > 1 && (
                    <span className="text-xs text-slate-400 font-bold">
                      {currentIndex + 1} of {images.length}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              download="squad-moment.jpg"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Open full size / Download"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close photo viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Image Canvas */}
        <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-8">
          <motion.img
            key={currentIndex}
            src={imageUrl}
            alt={caption || "Squad Moment Photo"}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl pointer-events-auto"
          />

          {/* Left / Right Nav Arrows for Galleries */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-transform active:scale-90 cursor-pointer"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-transform active:scale-90 cursor-pointer"
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Bottom Caption Overlay */}
        {(caption || images.length > 1) && (
          <div className="absolute bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent text-white safe-bottom">
            <div className="max-w-2xl mx-auto space-y-2">
              {/* Pagination Dots */}
              {images.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pb-1">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        haptics.tick();
                        setCurrentIndex(idx);
                      }}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        currentIndex === idx ? "w-6 bg-lime-400" : "w-1.5 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              )}
              {caption && (
                <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed max-h-24 overflow-y-auto">
                  {caption}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>,
    document.body
  );
};

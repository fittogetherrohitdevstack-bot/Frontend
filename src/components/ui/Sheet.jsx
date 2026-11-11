import React from "react";
import { Drawer } from "vaul";
import { X } from "lucide-react";
import { haptics } from "../../motion/Haptics";

/**
 * Sheet
 * Premium Vaul drawer for Light Theme with drag gesture, physics snap points, and frosted styling.
 */
export const Sheet = ({
  open: propOpen,
  isOpen,
  onOpenChange,
  onClose,
  title,
  description,
  children,
  trigger,
  className = "",
  snapPoints,
  activeSnapPoint,
  setActiveSnapPoint,
}) => {
  const isDrawerOpen = propOpen !== undefined ? propOpen : Boolean(isOpen);

  return (
    <Drawer.Root
      open={isDrawerOpen}
      onOpenChange={(openState) => {
        if (openState) haptics.tick();
        if (onOpenChange) onOpenChange(openState);
        if (!openState && onClose) onClose();
      }}
      snapPoints={snapPoints}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={setActiveSnapPoint}
    >
      {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300" />
        <Drawer.Content
          className={`fixed bottom-0 left-0 right-0 z-50 max-h-[92dvh] flex flex-col rounded-t-[32px] bg-white/95 backdrop-blur-2xl border-t border-x border-slate-200/90 shadow-[0_-10px_40px_rgba(15,23,42,0.12)] outline-none text-slate-900 ${className}`}
        >
          {/* Grab Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-300 my-3" />

          {/* Header */}
          {(title || description) && (
            <div className="flex items-start justify-between px-6 pb-4 pt-1 border-b border-slate-100">
              <div>
                {title && (
                  <Drawer.Title className="text-lg font-bold text-slate-900 tracking-tight">
                    {title}
                  </Drawer.Title>
                )}
                {description && (
                  <Drawer.Description className="text-xs text-slate-500 mt-0.5">
                    {description}
                  </Drawer.Description>
                )}
              </div>
              <Drawer.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </Drawer.Close>
            </div>
          )}

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 max-w-2xl w-full mx-auto">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default Sheet;

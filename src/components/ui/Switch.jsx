import React from "react";
import * as RadixSwitch from "@radix-ui/react-switch";
import { motion } from "motion/react";
import { haptics } from "../../motion/Haptics";

/**
 * Switch
 * Accessible Radix Switch styled for high-contrast Light Theme.
 */
export const Switch = ({ checked, onCheckedChange, disabled = false, className = "", id }) => {
  return (
    <RadixSwitch.Root
      id={id}
      checked={checked}
      disabled={disabled}
      onCheckedChange={(val) => {
        haptics.tick();
        if (onCheckedChange) onCheckedChange(val);
      }}
      className={`w-12 h-7 rounded-full relative p-0.5 outline-none transition-colors duration-250 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-inner ${
        checked ? "bg-[#84CC16]" : "bg-slate-200 hover:bg-slate-300"
      } ${className}`}
    >
      <RadixSwitch.Thumb asChild>
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`block w-6 h-6 rounded-full bg-white shadow-md pointer-events-none ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </RadixSwitch.Thumb>
    </RadixSwitch.Root>
  );
};

export default Switch;

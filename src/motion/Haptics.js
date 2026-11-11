/**
 * Safe Haptic Feedback Helper
 */

export const triggerHaptic = (pattern = "selection") => {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;

  const enabled = localStorage.getItem("ft_haptics_enabled") !== "false";
  if (!enabled) return;

  try {
    switch (pattern) {
      case "selection":
      case "tick":
        navigator.vibrate(8);
        break;
      case "success":
      case "eaten":
        navigator.vibrate([15, 40, 25]);
        break;
      case "milestone":
      case "goal":
        navigator.vibrate([30, 60, 40, 60, 50]);
        break;
      case "warning":
        navigator.vibrate([40, 50, 40]);
        break;
      default:
        navigator.vibrate(10);
    }
  } catch (err) {
    // Ignore unsupported browser contexts
  }
};

export const haptics = {
  tick: () => triggerHaptic("tick"),
  selection: () => triggerHaptic("selection"),
  eaten: () => triggerHaptic("eaten"),
  goal: () => triggerHaptic("goal"),
  warning: () => triggerHaptic("warning"),
};

export default haptics;

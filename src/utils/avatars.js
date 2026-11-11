import {
  Sparkles,
  Flame,
  Zap,
  Dumbbell,
  Leaf,
  Waves,
  Mountain,
  Sun,
  Heart,
  Crown,
  Compass,
  Moon,
} from "lucide-react";

export const PRESET_AVATARS = [
  {
    id: "spark",
    label: "Energy",
    bgClass: "bg-gradient-to-br from-lime-400 to-emerald-500",
    iconClass: "text-slate-950",
    Icon: Sparkles,
  },
  {
    id: "flame",
    label: "Streak",
    bgClass: "bg-gradient-to-br from-orange-400 to-rose-500",
    iconClass: "text-white",
    Icon: Flame,
  },
  {
    id: "bolt",
    label: "Pace",
    bgClass: "bg-gradient-to-br from-amber-300 to-orange-500",
    iconClass: "text-slate-950",
    Icon: Zap,
  },
  {
    id: "dumbbell",
    label: "Strength",
    bgClass: "bg-gradient-to-br from-violet-500 to-indigo-600",
    iconClass: "text-white",
    Icon: Dumbbell,
  },
  {
    id: "leaf",
    label: "Clean Fuel",
    bgClass: "bg-gradient-to-br from-emerald-400 to-teal-600",
    iconClass: "text-white",
    Icon: Leaf,
  },
  {
    id: "wave",
    label: "Hydrate",
    bgClass: "bg-gradient-to-br from-cyan-400 to-sky-600",
    iconClass: "text-white",
    Icon: Waves,
  },
  {
    id: "mountain",
    label: "Climb",
    bgClass: "bg-gradient-to-br from-slate-600 to-slate-900",
    iconClass: "text-lime-300",
    Icon: Mountain,
  },
  {
    id: "sun",
    label: "Morning",
    bgClass: "bg-gradient-to-br from-yellow-400 to-amber-500",
    iconClass: "text-slate-950",
    Icon: Sun,
  },
  {
    id: "heart",
    label: "Cardio",
    bgClass: "bg-gradient-to-br from-rose-400 to-pink-600",
    iconClass: "text-white",
    Icon: Heart,
  },
  {
    id: "crown",
    label: "Leader",
    bgClass: "bg-gradient-to-br from-amber-400 to-yellow-600",
    iconClass: "text-slate-950",
    Icon: Crown,
  },
  {
    id: "compass",
    label: "Focus",
    bgClass: "bg-gradient-to-br from-indigo-400 to-blue-600",
    iconClass: "text-white",
    Icon: Compass,
  },
  {
    id: "moon",
    label: "Recovery",
    bgClass: "bg-gradient-to-br from-purple-600 to-slate-900",
    iconClass: "text-indigo-200",
    Icon: Moon,
  },
];

export const getPresetAvatar = (src) => {
  if (typeof src !== "string" || !src.startsWith("avatar:")) return null;
  const id = src.slice("avatar:".length).trim();
  return PRESET_AVATARS.find((item) => item.id === id) || null;
};

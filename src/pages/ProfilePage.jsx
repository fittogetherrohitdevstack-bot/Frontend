import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/endpoints";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { AvatarPickerSheet } from "../components/profile/AvatarPickerSheet";
import { Switch } from "../components/ui/Switch";
import {
  User,
  Shield,
  Target,
  LogOut,
  Info,
  Check,
  Lock,
  Globe,
  Sliders,
  Flame,
  Droplets,
  Sparkles,
  Zap,
  Bell,
  Camera,
  EyeOff,
} from "lucide-react";
import { motion } from "motion/react";
import { haptics } from "../motion/Haptics";
import { toast } from "sonner";

export const ProfilePage = () => {
  const queryClient = useQueryClient();
  const { user, profile, logout, updateProfileData, refreshUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarSheetOpen, setIsAvatarSheetOpen] = useState(false);
  const [savingFeatureKey, setSavingFeatureKey] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const handleFeatureToggle = async (key, nextValue) => {
    haptics.tick();
    setSavingFeatureKey(key);
    try {
      await authApi.updateFeatures({ [key]: nextValue });
      await Promise.all([
        refreshUser(),
        queryClient.invalidateQueries({ queryKey: ["weekly-target"] }),
        queryClient.invalidateQueries({ queryKey: ["weekly-targets-history"] }),
        queryClient.invalidateQueries({ queryKey: ["weight-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["my-dashboard-summary"] }),
      ]);
      toast.success("Preference updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update preference");
    } finally {
      setSavingFeatureKey(null);
    }
  };

  const [form, setForm] = useState({
    name: user?.name || "",
    timezone: user?.timezone || "Asia/Kolkata",
    age: profile?.age || 25,
    gender: profile?.gender || "male",
    height: profile?.height || 175,
    currentWeight: profile?.currentWeight || 70,
    targetWeight: profile?.targetWeight || 68,
    fitnessGoal: profile?.fitnessGoal || "maintenance",
    targets: {
      calories: profile?.targets?.calories || 2200,
      protein: profile?.targets?.protein || 140,
      carbs: profile?.targets?.carbs || 250,
      fats: profile?.targets?.fats || 60,
      waterMl: profile?.targets?.waterMl || 3000,
    },
    privacy: {
      weight: profile?.privacy?.weight || "private",
      measurements: profile?.privacy?.measurements || "private",
      photos: profile?.privacy?.photos || "private",
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    haptics.selection();
    setIsSaving(true);
    setSuccessMsg("");

    try {
      const res = await authApi.updateProfile(form);
      if (res.data?.success) {
        haptics.goal();
        updateProfileData(res.data.data.user, res.data.data.profile);
        toast.success("Profile & targets updated successfully! 🎉");
        setSuccessMsg("Profile and targets saved!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Profile save error", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner Hero */}
      <GlassCard className="p-5 sm:p-7 relative overflow-hidden bg-white/95 border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                haptics.tick();
                setIsAvatarSheetOpen(true);
              }}
              aria-label="Edit profile photo or avatar"
              className="relative group rounded-full min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 cursor-pointer shrink-0"
            >
              <Avatar
                src={user?.profileImage}
                name={user?.name || "User"}
                size="xl"
                ringColor="lime"
              />
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-slate-900 text-white border-2 border-white shadow-sm flex items-center justify-center group-hover:bg-slate-800 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
              </span>
            </button>

            <div className="space-y-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight truncate">
                {user?.name}
              </h1>
              <p className="text-xs text-slate-500 font-medium truncate">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="inline-block text-[10px] text-lime-800 font-black bg-lime-100 px-2 py-0.5 rounded-full border border-lime-300">
                  {user?.timezone || "Asia/Kolkata"}
                </span>
                <span className="inline-block text-[10px] text-purple-800 font-bold bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200 capitalize">
                  {form.fitnessGoal?.replace("_", " ")}
                </span>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    haptics.tick();
                    setIsAvatarSheetOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Camera className="w-3 h-3" />
                  Edit Photo / Avatar
                </button>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => {
              haptics.tick();
              if (window.confirm("Are you sure you want to sign out?")) {
                logout();
              }
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-bold self-start sm:self-auto cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-1.5" /> Sign Out
          </Button>
        </div>
      </GlassCard>

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-lime-50 border border-lime-300 text-lime-900 text-xs font-bold flex items-center gap-2 shadow-xs"
        >
          <Check className="w-4 h-4 text-lime-600 stroke-[3]" /> {successMsg}
        </motion.div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Daily Calorie & Macro Targets */}
        <GlassCard className="p-5 sm:p-6 bg-white/95 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-lime-100 text-lime-700 flex items-center justify-center">
              <Target className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Daily Nutrition Targets
              </h2>
              <p className="text-xs text-slate-500">Your custom macro and hydration blueprint</p>
            </div>
          </div>

          {/* Scientific Disclaimer Note */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-lime-600 shrink-0 mt-0.5" />
            <p className="leading-snug">
              <strong className="text-slate-900 font-bold">Informational Disclaimer:</strong> Calorie and macronutrient targets are
              scientific estimates based on the Mifflin-St Jeor equation and do not constitute
              clinical or medical advice. Consult a healthcare provider before starting any extreme
              diet.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Calories (kcal)
              </label>
              <input
                type="number"
                value={form.targets.calories}
                onChange={(e) =>
                  setForm({
                    ...form,
                    targets: { ...form.targets, calories: Number(e.target.value) },
                  })
                }
                className="w-full min-h-[46px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-lime-700 font-black text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Protein (g)</label>
              <input
                type="number"
                value={form.targets.protein}
                onChange={(e) =>
                  setForm({
                    ...form,
                    targets: { ...form.targets, protein: Number(e.target.value) },
                  })
                }
                className="w-full min-h-[46px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-purple-700 font-black text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Carbs (g)</label>
              <input
                type="number"
                value={form.targets.carbs}
                onChange={(e) =>
                  setForm({
                    ...form,
                    targets: { ...form.targets, carbs: Number(e.target.value) },
                  })
                }
                className="w-full min-h-[46px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-amber-600 font-black text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fats (g)</label>
              <input
                type="number"
                value={form.targets.fats}
                onChange={(e) =>
                  setForm({
                    ...form,
                    targets: { ...form.targets, fats: Number(e.target.value) },
                  })
                }
                className="w-full min-h-[46px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-rose-600 font-black text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">Water (ml)</label>
              <input
                type="number"
                value={form.targets.waterMl}
                onChange={(e) =>
                  setForm({
                    ...form,
                    targets: { ...form.targets, waterMl: Number(e.target.value) },
                  })
                }
                className="w-full min-h-[46px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-cyan-600 font-black text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          </div>
        </GlassCard>

        {/* Privacy Settings Controls */}
        <GlassCard className="p-5 sm:p-6 bg-white/95 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Lock className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Squad Privacy Controls
              </h2>
              <p className="text-xs text-slate-500">
                Choose what squad mates can see. Body weight and metrics are{" "}
                <strong className="text-slate-800">private by default</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Body Weight</span>
                <span className="text-[11px] text-slate-500 capitalize">{form.privacy.weight}</span>
              </div>
              <select
                value={form.privacy.weight}
                onChange={(e) =>
                  setForm({ ...form, privacy: { ...form.privacy, weight: e.target.value } })
                }
                className="text-xs font-bold bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400"
              >
                <option value="private">Private</option>
                <option value="group">Share with Squad</option>
              </select>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Measurements</span>
                <span className="text-[11px] text-slate-500 capitalize">
                  {form.privacy.measurements}
                </span>
              </div>
              <select
                value={form.privacy.measurements}
                onChange={(e) =>
                  setForm({ ...form, privacy: { ...form.privacy, measurements: e.target.value } })
                }
                className="text-xs font-bold bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400"
              >
                <option value="private">Private</option>
                <option value="group">Share with Squad</option>
              </select>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Progress Photos</span>
                <span className="text-[11px] text-slate-500 capitalize">{form.privacy.photos}</span>
              </div>
              <select
                value={form.privacy.photos}
                onChange={(e) =>
                  setForm({ ...form, privacy: { ...form.privacy, photos: e.target.value } })
                }
                className="text-xs font-bold bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400"
              >
                <option value="private">Private</option>
                <option value="group">Share with Squad</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Feature Flags & Privacy Controls */}
        <GlassCard className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Progress Cadence & Privacy
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Opt in or out of optional check-ins anytime. Weight, tape and photos stay private by default.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                key: "weeklyTargets",
                title: "Weekly Targets & Pace",
                desc: "Track weekly average weight change, steady guardrails and 12-week history.",
                Icon: Target,
                iconBg: "bg-indigo-50 text-indigo-600",
                checked: Boolean(profile?.featureFlags?.weeklyTargets),
              },
              {
                key: "reminders",
                title: "Smart Check-In Reminders",
                desc: "Gentle daily weigh-in, weekly measurement and bi-weekly photo reminders with quiet hours.",
                Icon: Bell,
                iconBg: "bg-amber-50 text-amber-600",
                checked: Boolean(profile?.featureFlags?.reminders),
              },
              {
                key: "photoCheckins",
                title: "Bi-Weekly Progress Photos",
                desc: "Private 14-day guided check-in (front, side, back relaxed) stored only for you.",
                Icon: Camera,
                iconBg: "bg-violet-50 text-violet-600",
                checked: Boolean(profile?.featureFlags?.photoCheckins),
              },
              {
                key: "hideWeightNumbers",
                title: "Hide Weight Numbers",
                desc: "Mask body weight values across Dashboard, Weight Log, Weekly Targets and Progress.",
                Icon: EyeOff,
                iconBg: "bg-slate-100 text-slate-700",
                checked: Boolean(profile?.hideWeightNumbers),
              },
            ].map((item) => {
              const RowIcon = item.Icon;
              return (
                <div
                  key={item.key}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${item.iconBg}`}
                    >
                      <RowIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <label
                        htmlFor={`feature-${item.key}`}
                        className="text-sm font-bold text-gray-900 block cursor-pointer"
                      >
                        {item.title}
                      </label>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {item.desc}
                      </p>
                      {item.key === "reminders" && (
                        <Link
                          to="/settings/reminders"
                          className="inline-flex items-center gap-1 mt-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                        >
                          Configure reminder schedule →
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Switch
                      id={`feature-${item.key}`}
                      checked={item.checked}
                      disabled={savingFeatureKey === item.key}
                      onCheckedChange={(val) => handleFeatureToggle(item.key, val)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Physical Stats */}
        <GlassCard className="p-5 sm:p-6 bg-white/95 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Sliders className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Physical Information
              </h2>
              <p className="text-xs text-slate-500">Your body baseline and goals</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Height (cm)</label>
              <input
                type="number"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
                className="w-full min-h-[46px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                value={form.currentWeight}
                onChange={(e) => setForm({ ...form, currentWeight: Number(e.target.value) })}
                className="w-full min-h-[46px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Weight (kg)</label>
              <input
                type="number"
                value={form.targetWeight}
                onChange={(e) => setForm({ ...form, targetWeight: Number(e.target.value) })}
                className="w-full min-h-[46px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Goal</label>
              <select
                value={form.fitnessGoal}
                onChange={(e) => setForm({ ...form, fitnessGoal: e.target.value })}
                className="w-full min-h-[46px] px-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
              >
                <option value="fat_loss">Fat Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="maintenance">Maintenance</option>
                <option value="strength">Strength</option>
              </select>
            </div>
          </div>
        </GlassCard>

        <Button
          type="submit"
          isLoading={isSaving}
          className="w-full min-h-[50px] shadow-lg text-sm font-extrabold"
        >
          Save Profile & Targets
        </Button>
      </form>

      <AvatarPickerSheet
        open={isAvatarSheetOpen}
        onOpenChange={setIsAvatarSheetOpen}
      />
    </div>
  );
};

export default ProfilePage;


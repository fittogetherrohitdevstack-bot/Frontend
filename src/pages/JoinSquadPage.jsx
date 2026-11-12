import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { groupApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { useGroup } from "../context/GroupContext";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { haptics } from "../motion/Haptics";
import { Users, Flame, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export const JoinSquadPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, register, login } = useAuth();
  const { refreshGroups } = useGroup();

  const [mode, setMode] = useState("signup"); // signup | login
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const normalizedCode = (code || "").trim().toUpperCase();

  const { data: preview, isLoading, isError } = useQuery({
    queryKey: ["invite-preview", normalizedCode],
    queryFn: async () => {
      const res = await groupApi.getInvitePreview(normalizedCode);
      return res.data?.data?.squad;
    },
    enabled: !!normalizedCode,
    retry: false,
  });

  const handleJoinLoggedIn = async () => {
    setSubmitting(true);
    try {
      await groupApi.join({ inviteCode: normalizedCode });
      await refreshGroups();
      queryClient.invalidateQueries({ queryKey: ["my-groups"] });
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      haptics.goal();
      toast.success(`Welcome to ${preview?.name || "the squad"}! 🔥`);
      navigate("/group");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not join squad");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAuth = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          inviteCode: normalizedCode,
          needsOnboarding: true,
        });
        toast.success(`Joined ${preview?.name || "squad"}! Quick 3-step setup next 🚀`);
      } else {
        await login({ email: email.trim(), password });
        await groupApi.join({ inviteCode: normalizedCode }).catch(() => {});
        toast.success("Logged in & joined squad!");
      }
      await refreshGroups();
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not complete signup");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-5">
        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-slate-900 items-center justify-center p-2 shadow-lg mb-2">
            <img src="/apple-touch-icon.png" alt="FitTogether" className="w-full h-full object-contain" />
          </div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-lime-700">
            Squad Invite
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-3xl" />
        ) : isError || !preview ? (
          <GlassCard className="p-6 text-center bg-white space-y-4">
            <h1 className="text-xl font-black text-slate-900">Invite Link Invalid or Expired</h1>
            <p className="text-xs text-slate-500">
              Ask your friend for a fresh invite link or enter the latest code in FitTogether.
            </p>
            <Link to="/">
              <Button variant="primary" className="w-full min-h-[44px]">
                Go to FitTogether
              </Button>
            </Link>
          </GlassCard>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard glow="lime" className="p-6 bg-white/95 border-slate-200 shadow-xl space-y-5">
              {/* Squad Invite Header */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-lime-400 text-slate-950">
                    Code: {preview.inviteCode}
                  </span>
                  {preview.currentStreak > 0 && (
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                      <Flame className="w-4 h-4 fill-amber-400" />
                      {preview.currentStreak}d Squad Streak
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-black tracking-tight">{preview.name}</h1>
                {preview.description && (
                  <p className="text-xs text-slate-300">{preview.description}</p>
                )}
                <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5 pt-1">
                  <Users className="w-3.5 h-3.5 text-lime-400" />
                  {preview.memberCount} / {preview.maxMembers} active members
                </p>
              </div>

              {isAuthenticated ? (
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    className="w-full min-h-[46px]"
                    isLoading={submitting}
                    disabled={preview.isFull}
                    onClick={handleJoinLoggedIn}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    {preview.isFull ? "Squad is Full" : `Join ${preview.name}`}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleQuickAuth} className="space-y-3.5">
                  <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className={`min-h-[38px] rounded-lg text-xs font-extrabold cursor-pointer ${
                        mode === "signup" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                      }`}
                    >
                      Quick Sign Up
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className={`min-h-[38px] rounded-lg text-xs font-extrabold cursor-pointer ${
                        mode === "login" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                      }`}
                    >
                      Already Have Account
                    </button>
                  </div>

                  {mode === "signup" && (
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl border border-slate-200 text-base text-slate-900 font-medium"
                    />
                  )}

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl border border-slate-200 text-base text-slate-900 font-medium"
                  />

                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (6+ characters)"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl border border-slate-200 text-base text-slate-900 font-medium"
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full min-h-[46px]"
                    isLoading={submitting}
                    disabled={preview.isFull}
                  >
                    {preview.isFull
                      ? "Squad is Full"
                      : mode === "signup"
                      ? "Join Squad in 1 Step"
                      : "Log In & Join Squad"}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>

                  <p className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-lime-600" />
                    Your weight stays private by default.
                  </p>
                </form>
              )}
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
};

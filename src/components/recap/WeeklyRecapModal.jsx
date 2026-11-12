import React, { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toPng } from "html-to-image";
import { motion } from "motion/react";
import { toast } from "sonner";
import { recapApi } from "../../api/endpoints";
import { Sheet } from "../ui/Sheet";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import { haptics } from "../../motion/Haptics";
import {
  Flame,
  Droplets,
  CalendarCheck,
  Zap,
  Trophy,
  Share2,
  Download,
  Scale,
  PartyPopper,
  Users,
} from "lucide-react";

const PUBLIC_HOST =
  (import.meta.env.VITE_PUBLIC_APP_URL || "https://fit.rohitdevstack.online").replace(
    /^https?:\/\//,
    ""
  );

export const WeeklyRecapModal = ({ isOpen, onClose }) => {
  const cardRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["weekly-recap"],
    queryFn: async () => {
      const res = await recapApi.getWeeklyRecap();
      return res.data?.data?.recap;
    },
    enabled: isOpen,
    staleTime: 30000,
  });

  const stats = data?.stats || {};
  const forfeit = stats?.forfeitAlert;
  const joinUrl = stats?.squadInviteCode
    ? `${PUBLIC_HOST}/join/${stats.squadInviteCode}`
    : PUBLIC_HOST;

  const generateStoryImageDataUrl = async () => {
    if (!cardRef.current) return null;
    // Portrait card 360x640 * pixelRatio 3 = exact 1080x1920 story dimensions
    return await toPng(cardRef.current, {
      pixelRatio: 3,
      width: 360,
      height: 640,
      cacheBust: true,
    });
  };

  const handleShareOrDownload = async (mode = "share") => {
    haptics.selection();
    setExporting(true);
    try {
      const dataUrl = await generateStoryImageDataUrl();
      if (!dataUrl) throw new Error("Card not ready");

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File(
        [blob],
        `FitTogether-Recap-${data?.weekStart || "weekly"}.png`,
        { type: "image/png" }
      );

      if (
        mode === "share" &&
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: "My FitTogether Weekly Recap 🔥",
          text: `Keeping my streak alive (${stats.streak || 0}d)! Join my squad on https://${joinUrl}`,
          files: [file],
        });
        toast.success("Story shared!");
        return;
      }

      // Download fallback
      const link = document.createElement("a");
      link.download = `FitTogether-Recap-${data?.weekStart || "weekly"}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("1080x1920 story card downloaded!");
    } catch (err) {
      if (err?.name !== "AbortError") {
        toast.error("Could not export story card. Try downloading again.");
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Weekly Recap Story Card">
      <div className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-[520px] w-[290px] mx-auto rounded-3xl" />
        ) : (
          <div className="flex justify-center">
            {/* Fixed 9:16 canvas container (360x640 scaled cleanly on small viewports) */}
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-w-full">
              <div
                ref={cardRef}
                style={{ width: 360, height: 640 }}
                className="relative flex flex-col justify-between p-6 text-white bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 select-none overflow-hidden"
              >
                {/* Decorative ambient glow orbs */}
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-lime-400/25 blur-3xl pointer-events-none" />
                <div className="absolute bottom-12 -left-16 w-52 h-52 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

                {/* Top Branding */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-lime-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
                      FT
                    </div>
                    <div>
                      <p className="text-xs font-black tracking-tight text-white">FitTogether</p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {data?.weekStart} – {data?.weekEnd}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-black uppercase tracking-wider text-lime-300">
                    Weekly Recap
                  </span>
                </div>

                {/* Center Hero Metrics */}
                <div className="relative z-10 space-y-4 my-auto py-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">
                      {stats.squadName || "Solo Streak Athlete"}
                    </p>
                    <h2 className="text-2xl font-black tracking-tight mt-0.5 leading-tight">
                      {stats.userName || "Squad Athlete"}
                    </h2>
                  </div>

                  {/* Big Streak Hero */}
                  <motion.div
                    initial={{ scale: 0.96, opacity: 0.85 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/25 to-orange-500/20 border border-amber-400/35 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg">
                        <Flame className="w-6 h-6 fill-slate-950" />
                      </div>
                      <div>
                        <p className="text-2xl font-black leading-none text-white">
                          {stats.streak || 0} Days
                        </p>
                        <p className="text-[11px] font-bold text-amber-200 mt-1">
                          Personal Streak 🔥
                        </p>
                      </div>
                    </div>
                    {stats.squadStreak > 0 && (
                      <div className="text-right">
                        <p className="text-lg font-black text-lime-300 leading-none">
                          {stats.squadStreak}d
                        </p>
                        <p className="text-[10px] font-bold text-slate-300 mt-1">
                          Squad Flame
                        </p>
                      </div>
                    )}
                  </motion.div>

                  {/* 2x2 Stats Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-2xl bg-white/8 border border-white/12">
                      <div className="flex items-center gap-1.5 text-cyan-300 text-[10px] font-extrabold uppercase">
                        <Droplets className="w-3.5 h-3.5" />
                        Water
                      </div>
                      <p className="text-lg font-black text-white mt-1">
                        {((stats.waterTotalMl || 0) / 1000).toFixed(1)} L
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/8 border border-white/12">
                      <div className="flex items-center gap-1.5 text-lime-300 text-[10px] font-extrabold uppercase">
                        <CalendarCheck className="w-3.5 h-3.5" />
                        Days Logged
                      </div>
                      <p className="text-lg font-black text-white mt-1">
                        {stats.daysLogged || 0} / 7
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/8 border border-white/12">
                      <div className="flex items-center gap-1.5 text-purple-300 text-[10px] font-extrabold uppercase">
                        <Zap className="w-3.5 h-3.5" />
                        XP Earned
                      </div>
                      <p className="text-lg font-black text-white mt-1">
                        +{stats.xpEarned || 0} XP
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/8 border border-white/12">
                      <div className="flex items-center gap-1.5 text-amber-300 text-[10px] font-extrabold uppercase">
                        <Trophy className="w-3.5 h-3.5" />
                        Squad Rank
                      </div>
                      <p className="text-lg font-black text-white mt-1">
                        {stats.squadRank ? `#${stats.squadRank} of ${stats.squadSize}` : "Solo"}
                      </p>
                    </div>
                  </div>

                  {/* Opt-in Weight Change Pill */}
                  {stats.weightChangeAllowed && stats.weightChangeKg !== null && (
                    <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-slate-200">
                        <Scale className="w-3.5 h-3.5 text-cyan-300" />
                        Weekly Weight Shift
                      </span>
                      <span className="text-lime-300 font-black">
                        {stats.weightChangeKg > 0 ? `+${stats.weightChangeKg}` : stats.weightChangeKg} kg
                      </span>
                    </div>
                  )}

                  {/* Phase 8 Optional Fun Stakes Forfeit */}
                  {forfeit?.enabled && forfeit?.forfeitText && (
                    <div className="px-3.5 py-2.5 rounded-2xl bg-rose-500/20 border border-rose-400/35 text-xs">
                      <p className="text-[10px] font-black uppercase tracking-wider text-rose-200 flex items-center gap-1">
                        <PartyPopper className="w-3.5 h-3.5" />
                        Playful Squad Stake
                      </p>
                      <p className="text-white font-bold mt-0.5 leading-snug">
                        {forfeit.lowestMemberName} ({forfeit.lowestMemberPoints} XP): &ldquo;{forfeit.forfeitText}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Join Callout */}
                <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-black text-lime-300 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Join my squad
                    </p>
                    <p className="text-[10px] text-slate-300 font-semibold mt-0.5 truncate max-w-[240px]">
                      {joinUrl}
                    </p>
                  </div>
                  {stats.squadInviteCode && (
                    <span className="px-2.5 py-1 rounded-lg bg-lime-400 text-slate-950 font-black text-[11px] tracking-wider">
                      {stats.squadInviteCode}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <Button
            variant="secondary"
            size="md"
            disabled={isLoading || exporting}
            isLoading={exporting}
            onClick={() => handleShareOrDownload("download")}
            className="min-h-[44px]"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Save PNG
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={isLoading || exporting}
            isLoading={exporting}
            onClick={() => handleShareOrDownload("share")}
            className="min-h-[44px]"
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            Share Story
          </Button>
        </div>
      </div>
    </Sheet>
  );
};

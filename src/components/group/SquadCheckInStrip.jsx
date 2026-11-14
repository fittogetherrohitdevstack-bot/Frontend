import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { toast } from "sonner";
import { groupApi } from "../../api/endpoints";
import { Avatar } from "../ui/Avatar";
import { GlassCard } from "../ui/GlassCard";
import { Skeleton } from "../ui/Skeleton";
import { MemberProfileSheet } from "./MemberProfileSheet";
import { haptics } from "../../motion/Haptics";
import { Check, Clock, BellRing, Flame, VolumeX } from "lucide-react";

export const SquadCheckInStrip = ({ groupId, currentUserId }) => {
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["squad-today-status", groupId],
    queryFn: async () => {
      const res = await groupApi.getTodayStatus(groupId);
      return res.data?.data;
    },
    enabled: !!groupId,
    refetchInterval: 30000, // Live 30s polling
  });

  const nudgeMutation = useMutation({
    mutationFn: ({ targetUserId }) => groupApi.nudgeMember(groupId, targetUserId),
    onSuccess: (res) => {
      haptics.goal();
      toast.success(res.data?.message || "Friendly nudge sent! 👋");
      queryClient.invalidateQueries({ queryKey: ["squad-today-status", groupId] });
    },
    onError: (err) => {
      haptics.warning();
      toast.error(err.response?.data?.message || "Could not send nudge right now");
    },
  });

  if (isLoading && !data) {
    return <Skeleton className="h-28 w-full rounded-3xl" />;
  }

  const members = data?.members || [];
  if (!members.length) return null;

  return (
    <GlassCard className="p-3.5 sm:p-4 bg-white/95 border-slate-200/90 shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight truncate">
            Who’s Checked In Today?
          </h3>
        </div>
        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
          {data.loggedCount}/{data.totalMembers} Logged
        </span>
      </div>

      {/* Horizontal mobile-first strip */}
      <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {members.map((m) => {
          const isSelf = String(m.userId) === String(currentUserId);
          return (
            <motion.div
              key={m.userId}
              layout
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                haptics.selection();
                setSelectedMember(m);
              }}
              role="button"
              tabIndex={0}
              className={`shrink-0 w-28 sm:w-32 p-2.5 rounded-2xl border flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer hover:shadow-sm hover:border-slate-300 ${
                m.loggedToday
                  ? "bg-lime-50/70 border-lime-300/80"
                  : "bg-amber-50/60 border-amber-200"
              }`}
            >
              <div className="relative">
                <Avatar src={m.profileImage} name={m.name} size="md" />
                <span
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-2xs ${
                    m.loggedToday ? "bg-lime-600 text-white" : "bg-amber-400 text-slate-950"
                  }`}
                >
                  {m.loggedToday ? (
                    <Check className="w-3 h-3 stroke-[3]" />
                  ) : (
                    <Clock className="w-2.5 h-2.5 stroke-[2.5]" />
                  )}
                </span>
              </div>

              <div className="w-full min-w-0">
                <p className="text-xs font-extrabold text-slate-900 truncate">
                  {isSelf ? "You" : m.name?.split(" ")[0]}
                </p>
                <p className="text-[10px] font-bold text-slate-500 flex items-center justify-center gap-0.5">
                  <Flame className="w-3 h-3 text-orange-500 fill-orange-400" />
                  {m.currentStreak || 0}d
                </p>
              </div>

              {m.loggedToday ? (
                <span className="mt-auto text-[10px] font-extrabold text-lime-700 bg-lime-100/90 px-2 py-1 rounded-xl w-full">
                  Done ✅
                </span>
              ) : isSelf ? (
                <span className="mt-auto text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-1 rounded-xl w-full">
                  Pending
                </span>
              ) : !m.allowNudges ? (
                <span className="mt-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-xl w-full inline-flex items-center justify-center gap-1">
                  <VolumeX className="w-2.5 h-2.5" /> Muted
                </span>
              ) : m.nudgedByMeToday ? (
                <span className="mt-auto text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-1 rounded-xl w-full">
                  Nudged 👋
                </span>
              ) : !m.canNudge ? (
                <span className="mt-auto text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-xl w-full">
                  Max Today
                </span>
              ) : (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  disabled={nudgeMutation.isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    nudgeMutation.mutate({ targetUserId: m.userId });
                  }}
                  className="mt-auto min-h-[34px] w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-300 text-[11px] font-black inline-flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <BellRing className="w-3 h-3" />
                  Nudge
                </motion.button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Member Profile Sheet */}
      <MemberProfileSheet
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        groupId={groupId}
        member={selectedMember}
        currentUserId={currentUserId}
      />
    </GlassCard>
  );
};

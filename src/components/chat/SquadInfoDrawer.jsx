import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Users, Flame, Shield, ShieldCheck, Copy, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { chatApi } from "../../api/endpoints";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";

export const SquadInfoDrawer = ({ isOpen, onClose, squadId }) => {
  const [copied, setCopied] = React.useState(false);

  const { data: squadData, isLoading } = useQuery({
    queryKey: ["squad-chat-info", squadId],
    queryFn: async () => {
      if (!squadId) return null;
      const res = await chatApi.getSquadInfo(squadId);
      return res.data?.data;
    },
    enabled: Boolean(isOpen && squadId),
  });

  const handleCopyInvite = () => {
    if (!squadData?.inviteCode) return;
    haptics.tick();
    navigator.clipboard.writeText(squadData.inviteCode);
    setCopied(true);
    toast.success("Squad invite code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
      />

      {/* Drawer Body */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Squad Details</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="w-8 h-8 rounded-full border-3 border-lime-500 border-t-transparent animate-spin" />
            </div>
          ) : squadData ? (
            <>
              {/* Squad Hero Banner */}
              <div className="flex flex-col items-center text-center p-5 rounded-3xl bg-gradient-to-b from-slate-50 to-slate-100/60 dark:from-slate-800/60 dark:to-slate-800/20 border border-slate-200/80 dark:border-slate-700/60">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-lime-400 via-emerald-500 to-teal-600 p-0.5 shadow-lg shadow-emerald-500/20 mb-3">
                  <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center font-black text-white text-xl">
                    {squadData.name?.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {squadData.name}
                </h4>
                {squadData.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    {squadData.description}
                  </p>
                )}

                {/* Badges / Stats Row */}
                <div className="flex items-center gap-3 mt-4">
                  {squadData.currentStreak > 0 && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-black">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{squadData.currentStreak} Day Streak</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-lime-500/10 border border-lime-500/25 text-lime-700 dark:text-lime-300 text-xs font-black">
                    <Users className="w-3.5 h-3.5" />
                    <span>{squadData.totalMembers} Members</span>
                  </div>
                </div>
              </div>

              {/* Invite Code Section */}
              {squadData.inviteCode && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Invite Code
                    </span>
                    <p className="text-sm font-mono font-black text-slate-800 dark:text-slate-200">
                      {squadData.inviteCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyInvite}
                    className="p-2 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {/* Members List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Squad Roster ({squadData.members?.length || 0})
                  </h5>
                  {squadData.onlineCount > 0 && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {squadData.onlineCount} Online
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {(squadData.members || []).map((m) => (
                    <div
                      key={m._id}
                      className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-9 h-9 shrink-0">
                          {m.profileImage ? (
                            <img
                              src={m.profileImage}
                              alt={m.name}
                              className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-lime-400 to-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                              {m.name?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          {m.isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {m.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {m.currentStreak > 0 ? `🔥 ${m.currentStreak}d streak` : "Active member"}
                          </p>
                        </div>
                      </div>

                      {/* Role Badge */}
                      {m.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-black shrink-0">
                          <ShieldCheck className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 shrink-0">Member</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

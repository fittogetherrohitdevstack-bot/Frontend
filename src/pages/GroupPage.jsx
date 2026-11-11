import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupApi, photoSetApi } from "../api/endpoints";
import { useGroup } from "../context/GroupContext";
import { useAuth } from "../context/AuthContext";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { Sheet } from "../components/ui/Sheet";
import { Avatar } from "../components/ui/Avatar";
import {
  Users,
  Copy,
  Check,
  Plus,
  RefreshCw,
  LogOut,
  Shield,
  Trash2,
  Share2,
  Sparkles,
  ArrowRight,
  Camera,
  Lock,
} from "lucide-react";
import { motion } from "motion/react";
import { haptics } from "../motion/Haptics";
import { toast } from "sonner";

export const GroupPage = () => {
  const queryClient = useQueryClient();
  const { activeGroup, refreshGroups } = useGroup();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  const { data: membersData, isLoading } = useQuery({
    queryKey: ["group-members", activeGroup?._id],
    queryFn: async () => {
      if (!activeGroup?._id) return [];
      const res = await groupApi.getMembers(activeGroup._id);
      return res.data?.data?.members || [];
    },
    enabled: !!activeGroup?._id,
  });

  const { data: sharedPhotoSets } = useQuery({
    queryKey: ["group-shared-photos", activeGroup?._id],
    queryFn: async () => {
      if (!activeGroup?._id) return [];
      const res = await photoSetApi.getGroupShared(activeGroup._id);
      return res.data?.data?.sharedSets || [];
    },
    enabled: !!activeGroup?._id,
  });

  const copyInviteCode = () => {
    if (activeGroup?.inviteCode) {
      haptics.tick();
      navigator.clipboard.writeText(activeGroup.inviteCode);
      setCopied(true);
      toast.success("Invite code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const joinGroupMutation = useMutation({
    mutationFn: (code) => groupApi.join({ inviteCode: code }),
    onSuccess: () => {
      haptics.goal();
      toast.success("Joined group successfully! 🎉");
      refreshGroups();
      setShowJoinModal(false);
      setInviteCodeInput("");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to join group");
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: (data) => groupApi.create(data),
    onSuccess: () => {
      haptics.goal();
      toast.success("Group created! Share the code with your friends.");
      refreshGroups();
      setShowCreateModal(false);
      setNewGroupName("");
      setNewGroupDesc("");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create group");
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => groupApi.regenerateInvite(activeGroup._id),
    onSuccess: () => {
      haptics.tick();
      toast.success("New invite code generated!");
      refreshGroups();
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => groupApi.leave(activeGroup._id),
    onSuccess: () => {
      haptics.tick();
      toast.info("Left group");
      refreshGroups();
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => groupApi.removeMember(activeGroup._id, userId),
    onSuccess: () => {
      haptics.tick();
      toast.success("Member removed");
      queryClient.invalidateQueries({ queryKey: ["group-members", activeGroup?._id] });
    },
  });

  const isAdmin = membersData?.find((m) => m.userId === user?._id)?.role === "admin";

  if (!activeGroup) {
    return (
      <GlassCard className="text-center py-12 px-6 max-w-md mx-auto bg-white/95 border-slate-200 mt-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <div className="w-16 h-16 rounded-3xl bg-lime-100 border border-lime-300 text-lime-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Users className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">No Fitness Squad Joined</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1.5 mb-6 leading-relaxed">
          Fitness is more fun with friends! Join an existing squad with an invite code or create your own community.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-2.5">
          <Button onClick={() => setShowJoinModal(true)} className="shadow-md">
            Join Squad
          </Button>
          <Button variant="secondary" onClick={() => setShowCreateModal(true)}>
            Create Squad
          </Button>
        </div>

        {/* Join Group Modal */}
        <Sheet
          open={showJoinModal}
          onOpenChange={setShowJoinModal}
          title="Join a Fitness Squad"
          description="Enter the invite code shared by your friend"
        >
          <div className="space-y-4 pt-2">
            <input
              type="text"
              placeholder="e.g. SQUAD123"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
              className="w-full min-h-[46px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-black tracking-wider text-base focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white text-center uppercase"
            />
            <Button
              className="w-full min-h-[46px] shadow-md"
              isLoading={joinGroupMutation.isPending}
              onClick={() => joinGroupMutation.mutate(inviteCodeInput)}
            >
              Join Squad
            </Button>
          </div>
        </Sheet>

        {/* Create Group Modal */}
        <Sheet
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          title="Create New Fitness Squad"
          description="Name your squad and invite your friends to compete"
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Squad Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Iron Legion, Morning Runners"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full min-h-[46px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Squad Motto / Description
              </label>
              <input
                type="text"
                placeholder="Short motto or goal"
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                className="w-full min-h-[46px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
              />
            </div>
            <Button
              className="w-full min-h-[46px] shadow-md"
              isLoading={createGroupMutation.isPending}
              onClick={() =>
                createGroupMutation.mutate({ name: newGroupName, description: newGroupDesc })
              }
            >
              Create Squad & Get Code
            </Button>
          </div>
        </Sheet>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Group Card & Invite Code */}
      <GlassCard className="p-5 sm:p-7 relative overflow-hidden bg-white/95 border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-100 text-lime-800 text-xs font-black uppercase tracking-wider border border-lime-300">
                <Users className="w-3.5 h-3.5 stroke-[2.5]" />
                Fitness Squad
              </span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                  <Shield className="w-3 h-3 text-amber-600 stroke-[2.5]" /> Squad Leader
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {activeGroup.name}
            </h1>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              {activeGroup.description || "Stay consistent together. Everyone tracks their own plan."}
            </p>
          </div>

          {/* Invite Code Box */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 shrink-0 shadow-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block tracking-wider">
                Squad Invite Code
              </span>
              <span className="text-base font-mono font-black text-slate-900 tracking-wider">
                {activeGroup.inviteCode}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="secondary" onClick={copyInviteCode} className="text-xs font-bold">
                {copied ? <Check className="w-3.5 h-3.5 text-lime-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              {isAdmin && (
                <button
                  type="button"
                  title="Regenerate invite code"
                  onClick={() => {
                    haptics.tick();
                    regenerateMutation.mutate();
                  }}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Members List */}
      <GlassCard className="p-5 sm:p-6 bg-white/95 border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Squad Members ({membersData?.length || 0} / {activeGroup.maxMembers || 15})
            </h2>
            <p className="text-xs text-slate-500">Track mutual consistency and encourage each other</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                haptics.tick();
                setShowJoinModal(true);
              }}
              className="text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5 mr-1 stroke-[3]" /> Join Squad
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                haptics.tick();
                setShowCreateModal(true);
              }}
              className="text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5 mr-1 stroke-[3]" /> New Squad
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-2.5">
            {(membersData || []).map((m) => {
              const isSelf = m.userId === user?._id;
              return (
                <div
                  key={m.userId}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isSelf
                      ? "bg-lime-50/50 border-lime-300/80 shadow-xs"
                      : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={m.profileImage || m.profile?.avatar}
                      name={m.name}
                      size="md"
                      ringColor={isSelf ? "lime" : "violet"}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-sm">{m.name}</span>
                        {isSelf && (
                          <span className="text-[10px] font-black text-lime-800 bg-lime-100 border border-lime-300 px-1.5 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                        {m.role === "admin" && (
                          <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" /> Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Goal:{" "}
                        <span className="text-slate-800 font-bold capitalize">
                          {m.profile?.fitnessGoal?.replace("_", " ") || "Fitness"}
                        </span>
                        {m.profile?.weight ? ` • ${m.profile.weight} kg` : ""}
                      </p>
                    </div>
                  </div>

                  {isAdmin && !isSelf && (
                    <button
                      type="button"
                      title="Remove Member"
                      onClick={() => {
                        haptics.tick();
                        if (window.confirm(`Remove ${m.name} from squad?`)) {
                          removeMemberMutation.mutate(m.userId);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              if (window.confirm("Are you sure you want to leave this squad?")) {
                leaveMutation.mutate();
              }
            }}
            className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Leave Squad
          </button>
        </div>
      </GlassCard>

      {/* Explicitly Shared Squad Progress Check-Ins (only renders if members explicitly shared) */}
      {(sharedPhotoSets || []).length > 0 && (
        <GlassCard className="p-5 sm:p-6 bg-white/95 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Shared Squad Check-Ins
                </h2>
                <p className="text-xs text-slate-500">
                  Only bi-weekly check-ins members explicitly opted to share
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <Lock className="w-3 h-3" /> Opt-in only
            </span>
          </div>

          <div className="space-y-4">
            {sharedPhotoSets.map((set) => {
              const memberName = set.ownerName || set.user?.name || "Squad Member";
              const memberAvatar = set.ownerAvatar || set.user?.avatar || "";
              return (
                <div
                  key={set._id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar src={memberAvatar} name={memberName} size="sm" />
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">
                          {memberName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Cycle #{set.cycleNumber} · {set.date}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {["front_relaxed", "side_relaxed", "back_relaxed"].map((poseKey) => {
                      const pose = set.photos?.[poseKey];
                      return pose?.url ? (
                        <div
                          key={poseKey}
                          className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-900 border border-slate-200"
                        >
                          <img
                            src={pose.url}
                            alt={`${memberName} ${poseKey}`}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          key={poseKey}
                          className="aspect-[3/4] rounded-xl border border-dashed border-slate-200 bg-white/60 flex items-center justify-center text-[10px] font-semibold text-slate-400"
                        >
                          No shot
                        </div>
                      );
                    })}
                  </div>
                  {set.note && <p className="text-xs text-slate-600">{set.note}</p>}
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Join Group Modal */}
      <Sheet
        open={showJoinModal}
        onOpenChange={setShowJoinModal}
        title="Join a Fitness Squad"
        description="Enter the 8-character invite code shared by your friend"
      >
        <div className="space-y-4 pt-2">
          <input
            type="text"
            placeholder="e.g. SQUAD123"
            value={inviteCodeInput}
            onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
            className="w-full min-h-[46px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-black tracking-wider text-base focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white text-center uppercase"
          />
          <Button
            className="w-full min-h-[46px] shadow-md"
            isLoading={joinGroupMutation.isPending}
            onClick={() => joinGroupMutation.mutate(inviteCodeInput)}
          >
            Join Squad
          </Button>
        </div>
      </Sheet>

      {/* Create Group Modal */}
      <Sheet
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Create New Fitness Squad"
        description="Name your squad and invite your friends to stay consistent together"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Squad Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Iron Legion, Weekend Warriors"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full min-h-[46px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Description / Motto
            </label>
            <input
              type="text"
              placeholder="Short group description / motto"
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              className="w-full min-h-[46px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
            />
          </div>
          <Button
            className="w-full min-h-[46px] shadow-md"
            isLoading={createGroupMutation.isPending}
            onClick={() =>
              createGroupMutation.mutate({ name: newGroupName, description: newGroupDesc })
            }
          >
            Create Squad & Generate Code
          </Button>
        </div>
      </Sheet>
    </div>
  );
};

export default GroupPage;


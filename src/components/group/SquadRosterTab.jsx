import React, { useState } from "react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { Skeleton } from "../ui/Skeleton";
import { Sheet } from "../ui/Sheet";
import { MemberProfileSheet } from "./MemberProfileSheet";
import { haptics } from "../../motion/Haptics";
import {
  Shield,
  Trash2,
  LogOut,
  Plus,
  Share2,
  Copy,
  Check,
  RefreshCw,
  ChevronRight,
  Flame,
} from "lucide-react";

export const SquadRosterTab = ({
  activeGroup,
  members = [],
  isLoading,
  isAdmin,
  currentUserId,
  copied,
  onCopyInvite,
  onShareInvite,
  onRegenerateInvite,
  isRegenerating,
  onOpenJoinModal,
  onOpenCreateModal,
  onRemoveMember,
  isRemovingMember,
  onLeaveGroup,
  isLeavingGroup,
}) => {
  const [confirmRemoveTarget, setConfirmRemoveTarget] = useState(null);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  return (
    <div className="space-y-4">
      {/* Members Roster Card */}
      <GlassCard className="p-4 sm:p-6 bg-white/95 border-slate-200/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Squad Roster ({members.length} / {activeGroup?.maxMembers || 15})
            </h2>
            <p className="text-xs text-slate-500">
              Active teammates holding each other accountable
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                haptics.tick();
                onOpenJoinModal?.();
              }}
              className="min-h-[44px] text-xs font-bold w-full sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5 mr-1 stroke-[2.8]" /> Join Squad
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                haptics.tick();
                onOpenCreateModal?.();
              }}
              className="min-h-[44px] text-xs font-bold w-full sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5 mr-1 stroke-[2.8]" /> New Squad
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-2.5">
            {members.map((m) => {
              const isSelf = String(m.userId) === String(currentUserId);
              const streak = m.currentStreak ?? 0;
              return (
                <div
                  key={m.userId}
                  onClick={() => {
                    haptics.selection();
                    setSelectedMember(m);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedMember(m);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer hover:shadow-md hover:border-slate-300 active:scale-[0.99] group ${
                    isSelf
                      ? "bg-lime-50/55 border-lime-300/80 shadow-xs"
                      : "bg-slate-50/75 border-slate-200/80"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={m.profileImage || m.profile?.avatar}
                      name={m.name}
                      size="md"
                      ringColor={isSelf ? "lime" : "violet"}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-sm truncate group-hover:text-emerald-900 transition-colors">
                          {m.name}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] font-black text-lime-800 bg-lime-100 border border-lime-300 px-1.5 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                        {m.role === "admin" && (
                          <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-300 inline-flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" /> Leader
                          </span>
                        )}
                        {streak > 0 && (
                          <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> {streak}d
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        Goal:{" "}
                        <span className="text-slate-800 font-bold capitalize">
                          {m.profile?.fitnessGoal?.replace("_", " ") || "Fitness"}
                        </span>
                        {m.profile?.weight ? ` · ${m.profile.weight} kg` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isAdmin && !isSelf && (
                      <button
                        type="button"
                        aria-label={`Remove ${m.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          haptics.tick();
                          setConfirmRemoveTarget(m);
                        }}
                        className="min-w-[40px] min-h-[40px] rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="w-8 h-8 rounded-full bg-white/70 border border-slate-200/60 flex items-center justify-center text-slate-400 group-hover:text-slate-700 group-hover:border-slate-300 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Invite Management & Leave Squad Card */}
      <GlassCard className="p-4 sm:p-5 bg-white/95 border-slate-200/90 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Invite Teammates
            </span>
            <p className="text-sm font-mono font-black text-slate-900 tracking-widest mt-0.5">
              {activeGroup?.inviteCode}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={onCopyInvite}
              className="min-h-[44px] text-xs font-bold flex-1 sm:flex-initial"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-lime-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={onShareInvite}
              className="min-h-[44px] text-xs font-bold flex-1 sm:flex-initial"
            >
              <Share2 className="w-3.5 h-3.5" /> Share Invite
            </Button>
            {isAdmin && (
              <button
                type="button"
                aria-label="Regenerate invite code"
                disabled={isRegenerating}
                onClick={() => {
                  haptics.tick();
                  onRegenerateInvite?.();
                }}
                className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Regenerate invite code"
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
              </button>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setConfirmLeaveOpen(true);
            }}
            className="min-h-[44px] w-full sm:w-auto px-4 rounded-xl border border-rose-200/80 sm:border-transparent bg-rose-50/40 sm:bg-transparent text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 inline-flex items-center justify-center gap-1.5 font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Leave Squad
          </button>
        </div>
      </GlassCard>

      {/* Confirm Remove Member Sheet */}
      <Sheet
        open={!!confirmRemoveTarget}
        onOpenChange={(open) => !open && setConfirmRemoveTarget(null)}
        title={`Remove ${confirmRemoveTarget?.name || "Member"}?`}
        description="They can still rejoin later using an invite code."
      >
        <div className="grid grid-cols-2 gap-2.5 pt-2 pb-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmRemoveTarget(null)}
            className="min-h-[48px] font-bold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={isRemovingMember}
            onClick={() => {
              if (!confirmRemoveTarget) return;
              onRemoveMember?.(confirmRemoveTarget.userId, () => setConfirmRemoveTarget(null));
            }}
            className="min-h-[48px] font-bold"
          >
            Remove
          </Button>
        </div>
      </Sheet>

      {/* Confirm Leave Squad Sheet */}
      <Sheet
        open={confirmLeaveOpen}
        onOpenChange={setConfirmLeaveOpen}
        title="Leave this squad?"
        description="Your personal logs remain intact, and you can rejoin anytime with an invite code."
      >
        <div className="grid grid-cols-2 gap-2.5 pt-2 pb-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmLeaveOpen(false)}
            className="min-h-[48px] font-bold"
          >
            Stay in Squad
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={isLeavingGroup}
            onClick={() => {
              onLeaveGroup?.(() => setConfirmLeaveOpen(false));
            }}
            className="min-h-[48px] font-bold"
          >
            Leave Squad
          </Button>
        </div>
      </Sheet>

      {/* Member Detailed Profile Sheet (Daily achievements, badges, stats & privacy-gated metrics) */}
      <MemberProfileSheet
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        groupId={activeGroup?._id}
        member={selectedMember}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default SquadRosterTab;

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupApi, photoSetApi } from "../api/endpoints";
import { useGroup } from "../context/GroupContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Sheet } from "../components/ui/Sheet";
import { AnimatedNumber } from "../motion/AnimatedNumber";
import { SquadLeaderboardTab } from "../components/group/SquadLeaderboardTab";
import { SquadActivityTab } from "../components/group/SquadActivityTab";
import { SquadChallengesTab } from "../components/group/SquadChallengesTab";
import { SquadRosterTab } from "../components/group/SquadRosterTab";
import {
  Users,
  Copy,
  Check,
  RefreshCw,
  Shield,
  Share2,
  Trophy,
  Flame,
  Award,
  Radio,
  Plus,
} from "lucide-react";
import { haptics } from "../motion/Haptics";
import { toast } from "sonner";

const GROUP_TABS = [
  { id: "arena", label: "Arena", icon: Trophy },
  { id: "activities", label: "Activities", icon: Flame },
  { id: "challenges", label: "Challenges", icon: Award },
  { id: "roster", label: "Roster", icon: Users },
];

export const GroupPage = () => {
  const queryClient = useQueryClient();
  const { groups, activeGroup, selectGroup, refreshGroups } = useGroup();
  const { user } = useAuth();
  const { recentEvents = [] } = useSocket() || {};

  const [activeTab, setActiveTab] = useState("arena");
  const [period, setPeriod] = useState("week");
  const [copied, setCopied] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  const groupId = activeGroup?._id;

  // 1. Live Squad Dashboard (today's member progress + team consistency %)
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["group-dashboard", groupId],
    queryFn: async () => {
      const res = await groupApi.getDashboard(groupId);
      return res.data?.data;
    },
    enabled: !!groupId,
    refetchInterval: 20000,
  });

  // 2. Competitive Leaderboard (active period tab)
  const { data: leaderboardData = [], isLoading: isLeaderboardLoading } = useQuery({
    queryKey: ["group-leaderboard", groupId, period],
    queryFn: async () => {
      const res = await groupApi.getLeaderboard(groupId, period);
      return res.data?.data?.leaderboard || [];
    },
    enabled: !!groupId,
  });

  // 3. Weekly Leaderboard for Hero Rank & Score KPIs
  const { data: weeklyBoard = [] } = useQuery({
    queryKey: ["group-leaderboard", groupId, "week"],
    queryFn: async () => {
      const res = await groupApi.getLeaderboard(groupId, "week");
      return res.data?.data?.leaderboard || [];
    },
    enabled: !!groupId && period !== "week",
  });

  // 4. Members list with goals & role metadata
  const { data: membersData = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      const res = await groupApi.getMembers(groupId);
      return res.data?.data?.members || [];
    },
    enabled: !!groupId,
  });

  // 5. Squad Challenges
  const { data: challenges = [], isLoading: isChallengesLoading } = useQuery({
    queryKey: ["group-challenges", groupId],
    queryFn: async () => {
      const res = await groupApi.getChallenges(groupId);
      return res.data?.data?.challenges || [];
    },
    enabled: !!groupId,
  });

  // 6. Opt-in Shared Progress Check-In Photos
  const { data: sharedPhotoSets = [] } = useQuery({
    queryKey: ["group-shared-photos", groupId],
    queryFn: async () => {
      const res = await photoSetApi.getGroupShared(groupId);
      return res.data?.data?.sharedSets || [];
    },
    enabled: !!groupId,
  });

  const copyInviteCode = () => {
    if (!activeGroup?.inviteCode) return;
    haptics.tick();
    navigator.clipboard.writeText(activeGroup.inviteCode);
    setCopied(true);
    toast.success("Invite code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareInvite = async () => {
    if (!activeGroup?.inviteCode) return;
    haptics.tick();
    const shareText = `Join my FitTogether squad "${activeGroup.name}" and compete with us! Use invite code: ${activeGroup.inviteCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${activeGroup.name} on FitTogether`,
          text: shareText,
          url: window.location.origin,
        });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    navigator.clipboard.writeText(shareText);
    toast.success("Squad invite copied — paste to share with friends!");
  };

  const joinGroupMutation = useMutation({
    mutationFn: (code) => groupApi.join({ inviteCode: code }),
    onSuccess: () => {
      haptics.goal();
      toast.success("Joined squad! Time to climb the leaderboard 🏆");
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
      toast.success("Squad created! Share your code to start competing.");
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
    mutationFn: () => groupApi.regenerateInvite(groupId),
    onSuccess: () => {
      haptics.tick();
      toast.success("New invite code generated!");
      refreshGroups();
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => groupApi.leave(groupId),
    onSuccess: () => {
      haptics.tick();
      toast.info("Left squad");
      refreshGroups();
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => groupApi.removeMember(groupId, userId),
    onSuccess: () => {
      haptics.tick();
      toast.success("Member removed");
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-dashboard", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-leaderboard", groupId] });
    },
  });

  const isAdmin =
    membersData.find((m) => String(m.userId) === String(user?._id))?.role === "admin";

  const weeklyRankings = period === "week" ? leaderboardData : weeklyBoard;
  const myWeeklyStats = weeklyRankings.find(
    (m) => String(m.userId) === String(user?._id)
  );

  const dashboardMembers = dashboardData?.members || [];
  const activeCountToday = useMemo(
    () =>
      dashboardMembers.filter(
        (m) =>
          m.today?.workoutCompleted ||
          (m.today?.eatenMeals || 0) > 0 ||
          (m.today?.totalWaterMl || 0) > 0
      ).length,
    [dashboardMembers]
  );

  const activeChallengesCount = challenges.length;
  const memberCount = membersData.length || dashboardMembers.length || 0;

  const sharedModals = (
    <>
      <Sheet
        open={showJoinModal}
        onOpenChange={setShowJoinModal}
        title="Join a Fitness Squad"
        description="Enter the invite code shared by your teammate"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!inviteCodeInput.trim()) return;
            joinGroupMutation.mutate(inviteCodeInput.trim());
          }}
          className="space-y-4 pt-2 pb-2"
        >
          <input
            type="text"
            required
            placeholder="e.g. SQUAD123"
            value={inviteCodeInput}
            onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
            className="w-full min-h-[48px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-black tracking-widest text-base focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white text-center uppercase"
          />
          <Button
            type="submit"
            className="w-full min-h-[48px] shadow-md font-extrabold"
            isLoading={joinGroupMutation.isPending}
          >
            Join &amp; Start Competing
          </Button>
        </form>
      </Sheet>

      <Sheet
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Create New Fitness Squad"
        description="Name your squad and invite friends to compete together"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newGroupName.trim()) return;
            createGroupMutation.mutate({
              name: newGroupName.trim(),
              description: newGroupDesc.trim(),
            });
          }}
          className="space-y-4 pt-2 pb-2"
        >
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
              className="w-full min-h-[46px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Squad Motto / Goal
            </label>
            <input
              type="text"
              placeholder="Short motto or goal"
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              className="w-full min-h-[46px] px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-base focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white"
            />
          </div>
          <Button
            type="submit"
            className="w-full min-h-[48px] shadow-md font-extrabold"
            isLoading={createGroupMutation.isPending}
          >
            Create Squad &amp; Get Code
          </Button>
        </form>
      </Sheet>
    </>
  );

  // Empty Onboarding State
  if (!activeGroup) {
    return (
      <div className="max-w-xl mx-auto py-3 sm:py-6">
        <GlassCard className="p-5 sm:p-8 text-center bg-gradient-to-b from-white via-white to-lime-50/50 border-slate-200 shadow-[0_10px_35px_rgba(15,23,42,0.06)] space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 text-lime-400 flex items-center justify-center mx-auto shadow-lg">
            <Trophy className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-100 text-lime-800 text-[11px] font-black uppercase tracking-wider border border-lime-300">
              Squad Competition Arena
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Train Harder With a Squad
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Join friends with an invite code or launch your own squad to unlock live leaderboards, daily pulse feeds, and head-to-head challenges.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-left">
            {[
              { icon: Trophy, title: "Live Podium", sub: "Weekly points", color: "bg-amber-50 text-amber-700 border-amber-200" },
              { icon: Flame, title: "Daily Pulse", sub: "Real-time feed", color: "bg-lime-50 text-lime-800 border-lime-200" },
              { icon: Award, title: "Challenges", sub: "Goal battles", color: "bg-purple-50 text-purple-800 border-purple-200" },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className={`p-2.5 sm:p-3 rounded-2xl border ${feat.color} space-y-1`}
                >
                  <Icon className="w-4 h-4" />
                  <p className="text-xs font-extrabold text-slate-900 leading-tight">{feat.title}</p>
                  <p className="text-[10px] font-semibold opacity-80">{feat.sub}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-2.5 pt-1">
            <Button
              onClick={() => {
                haptics.tick();
                setShowJoinModal(true);
              }}
              className="w-full sm:flex-1 min-h-[48px] shadow-md font-extrabold"
            >
              Join With Code
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                haptics.tick();
                setShowCreateModal(true);
              }}
              className="w-full sm:flex-1 min-h-[48px] font-extrabold"
            >
              Create New Squad
            </Button>
          </div>
        </GlassCard>

        {sharedModals}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-4xl mx-auto">
      {/* Multi-Squad Switcher Bar (shown if user is in multiple squads) */}
      {groups.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {groups.map((g) => {
            const isSelected = g._id === activeGroup._id;
            return (
              <button
                key={g._id}
                type="button"
                onClick={() => {
                  haptics.tick();
                  selectGroup(g);
                }}
                className={`shrink-0 min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-slate-900 text-lime-400 border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {g.name}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              setShowJoinModal(true);
            }}
            className="shrink-0 min-h-[40px] px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 bg-white border border-dashed border-slate-300 hover:border-lime-400 inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Join
          </button>
        </div>
      )}

      {/* 1. COMPETITIVE HERO COMMAND CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white p-4 sm:p-6 border border-slate-800 shadow-[0_14px_40px_rgba(15,23,42,0.18)] space-y-4">
        {/* Ambient Athletic Glow */}
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-lime-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-16 w-48 h-48 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lime-400/15 text-lime-300 text-[10px] font-black uppercase tracking-wider border border-lime-400/30">
                <Radio className="w-3 h-3 animate-pulse" />
                {activeCountToday}/{memberCount} Active Today
              </span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                  <Shield className="w-3 h-3" /> Squad Leader
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 text-slate-300 text-[10px] font-bold border border-white/10">
                {memberCount}/{activeGroup.maxMembers || 15} Members
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {activeGroup.name}
              </h1>
              <p className="text-xs text-slate-300 max-w-lg leading-relaxed mt-0.5">
                {activeGroup.description ||
                  "Compete daily on meals, workouts & hydration. Consistency wins the crown."}
              </p>
            </div>
          </div>

          {/* Invite Code & Share Strip */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 shrink-0">
            <div className="min-w-0 pl-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 block">
                Invite Code
              </span>
              <span className="text-sm sm:text-base font-mono font-black text-lime-300 tracking-wider">
                {activeGroup.inviteCode}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                aria-label="Copy invite code"
                onClick={copyInviteCode}
                className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-lime-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
              </button>

              <button
                type="button"
                aria-label="Share squad invite"
                onClick={handleShareInvite}
                className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-extrabold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Invite</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  aria-label="Regenerate invite code"
                  onClick={() => {
                    haptics.tick();
                    regenerateMutation.mutate();
                  }}
                  disabled={regenerateMutation.isPending}
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                  title="Regenerate invite code"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regenerateMutation.isPending ? "animate-spin" : ""}`} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3-Column Competitive KPI Strip */}
        <div className="relative z-10 grid grid-cols-3 gap-2 pt-1">
          <div className="rounded-2xl bg-white/10 border border-white/15 px-3 py-2.5 text-center backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
              Your Rank
            </span>
            <p className="text-lg sm:text-xl font-black text-amber-300 tabular-nums mt-0.5">
              {myWeeklyStats?.rank ? `#${myWeeklyStats.rank}` : "—"}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 border border-white/15 px-3 py-2.5 text-center backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
              Team Today
            </span>
            <p className="text-lg sm:text-xl font-black text-lime-300 tabular-nums mt-0.5">
              <AnimatedNumber value={dashboardData?.groupConsistency || 0} />%
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 border border-white/15 px-3 py-2.5 text-center backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
              Week Pts
            </span>
            <p className="text-lg sm:text-xl font-black text-white tabular-nums mt-0.5">
              <AnimatedNumber value={myWeeklyStats?.totalPoints || 0} />
            </p>
          </div>
        </div>
      </div>

      {/* 2. MOBILE-FIRST 4-TAB NAVIGATION BAR */}
      <div
        role="tablist"
        aria-label="Squad Hub Sections"
        className="grid grid-cols-4 gap-1 bg-white/95 p-1.5 rounded-2xl border border-slate-200/90 shadow-xs"
      >
        {GROUP_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badge =
            tab.id === "activities" && activeCountToday > 0
              ? activeCountToday
              : tab.id === "challenges" && activeChallengesCount > 0
              ? activeChallengesCount
              : tab.id === "roster" && memberCount > 0
              ? memberCount
              : null;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                haptics.tick();
                setActiveTab(tab.id);
              }}
              className={`relative min-h-[48px] sm:min-h-[44px] px-1.5 sm:px-3 py-1.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-lime-300 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="relative flex items-center">
                <Icon className="w-4 h-4 shrink-0" />
                {badge !== null && (
                  <span
                    className={`sm:hidden -top-1.5 -right-2.5 absolute min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center ${
                      isActive
                        ? "bg-lime-400 text-slate-950"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <span className="truncate max-w-full">{tab.label}</span>
              {badge !== null && (
                <span
                  className={`hidden sm:inline-flex min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black items-center justify-center ${
                    isActive
                      ? "bg-lime-400 text-slate-950"
                      : "bg-slate-200/80 text-slate-700"
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. ACTIVE TAB CONTENT */}
      {activeTab === "arena" && (
        <SquadLeaderboardTab
          leaderboard={leaderboardData}
          isLoading={isLeaderboardLoading}
          period={period}
          onPeriodChange={setPeriod}
          currentUserId={user?._id}
          onShareInvite={handleShareInvite}
          activeCountToday={activeCountToday}
          totalMembers={memberCount}
          openChallengesCount={activeChallengesCount}
          onJumpTab={setActiveTab}
        />
      )}

      {activeTab === "activities" && (
        <SquadActivityTab
          dashboardData={dashboardData}
          isLoading={isDashboardLoading}
          recentEvents={recentEvents}
          sharedPhotoSets={sharedPhotoSets}
          challenges={challenges}
          currentUserId={user?._id}
        />
      )}

      {activeTab === "challenges" && (
        <SquadChallengesTab
          groupId={groupId}
          challenges={challenges}
          isLoading={isChallengesLoading}
        />
      )}

      {activeTab === "roster" && (
        <SquadRosterTab
          activeGroup={activeGroup}
          members={membersData}
          isLoading={isMembersLoading}
          isAdmin={isAdmin}
          currentUserId={user?._id}
          copied={copied}
          onCopyInvite={copyInviteCode}
          onShareInvite={handleShareInvite}
          onRegenerateInvite={() => regenerateMutation.mutate()}
          isRegenerating={regenerateMutation.isPending}
          onOpenJoinModal={() => setShowJoinModal(true)}
          onOpenCreateModal={() => setShowCreateModal(true)}
          onRemoveMember={(userId, onDone) =>
            removeMemberMutation.mutate(userId, { onSuccess: onDone })
          }
          isRemovingMember={removeMemberMutation.isPending}
          onLeaveGroup={(onDone) =>
            leaveMutation.mutate(undefined, { onSuccess: onDone })
          }
          isLeavingGroup={leaveMutation.isPending}
        />
      )}

      {sharedModals}
    </div>
  );
};

export default GroupPage;

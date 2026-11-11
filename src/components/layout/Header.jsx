import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { socialApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { useGroup } from "../../context/GroupContext";
import { Flame, Bell, Users, ChevronDown, Plus } from "lucide-react";
import { Sheet } from "../ui/Sheet";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { haptics } from "../../motion/Haptics";
import { motion } from "motion/react";

export const Header = ({ streakCount = 0 }) => {
  const { user } = useAuth();
  const { groups, activeGroup, selectGroup } = useGroup();
  const [showGroupSheet, setShowGroupSheet] = useState(false);
  const navigate = useNavigate();

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await socialApi.getNotifications();
      return res.data?.data;
    },
    enabled: Boolean(user),
    staleTime: 30 * 1000,
  });
  const unreadCount = notifData?.unreadCount || 0;

  return (
    <>
      <header className="sticky top-0 z-30 w-full h-16 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-3 sm:px-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex items-center">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 w-full">
          {/* Logo / Group Switcher */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <Link
              to="/"
              onClick={() => haptics.tick()}
              className="flex items-center gap-2 sm:gap-2.5 group select-none shrink-0"
              aria-label="FitTogether Home"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-900 flex items-center justify-center p-1.5 shadow-md shadow-slate-900/15 group-hover:scale-105 transition-all duration-200 overflow-hidden ring-1 ring-slate-800/40">
                <img
                  src="/apple-touch-icon.png"
                  alt="FitTogether Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-black text-lg tracking-tight text-slate-900 hidden sm:inline">
                FitTogether
              </span>
            </Link>

            {/* Active Group Pill (Flexible & Responsive) */}
            {activeGroup && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => {
                  haptics.tick();
                  setShowGroupSheet(true);
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 border border-slate-200 transition-all cursor-pointer select-none shadow-xs min-w-0"
              >
                <Users className="w-3.5 h-3.5 text-lime-600 shrink-0" />
                <span className="font-extrabold max-w-[80px] xs:max-w-[110px] sm:max-w-[150px] truncate text-slate-900">
                  {activeGroup.name}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </motion.button>
            )}
          </div>

          {/* Right Action Icons: Streak, Notification, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Streak Counter Badge */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-black shadow-xs select-none shrink-0"
            >
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-orange-500 text-orange-500 animate-pulse shrink-0" />
              <span className="tabular-nums tracking-wide">{streakCount}d</span>
              <span className="hidden sm:inline font-bold">streak</span>
            </motion.div>

            {/* In-app Notifications */}
            <Link
              to="/badges?tab=notifications"
              onClick={() => haptics.tick()}
              aria-label={
                unreadCount > 0
                  ? `Notifications (${unreadCount} unread)`
                  : "Notifications"
              }
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors relative shrink-0"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-lime-500 text-slate-950 text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs tabular-nums">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Profile Avatar */}
            <Link
              to="/profile"
              onClick={() => haptics.tick()}
              className="group select-none shrink-0"
            >
              <Avatar
                src={user?.profileImage}
                name={user?.name || "User"}
                size="sm"
                ringColor="lime"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Group Selector Drawer */}
      <Sheet
        open={showGroupSheet}
        onOpenChange={setShowGroupSheet}
        title="Your Fitness Groups"
        description="Switch between your active squads or join a new one"
      >
        <div className="space-y-3 pt-2">
          {(groups || []).map((g) => {
            const isActive = activeGroup?._id === g._id;
            return (
              <div
                key={g._id}
                onClick={() => {
                  haptics.tick();
                  selectGroup(g);
                  setShowGroupSheet(false);
                }}
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  isActive
                    ? "bg-lime-50 border-lime-400 shadow-sm text-slate-900"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
                      isActive
                        ? "bg-[#84CC16] text-white shadow-sm"
                        : "bg-white text-lime-700 border border-slate-200"
                    }`}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{g.name}</h4>
                    <p className="text-xs text-slate-500">{g.description || "Active Squad"}</p>
                  </div>
                </div>
                <span className="text-xs font-mono bg-white px-2.5 py-1 rounded-lg text-slate-700 border border-slate-200">
                  {g.inviteCode}
                </span>
              </div>
            );
          })}

          <div className="pt-2">
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => {
                setShowGroupSheet(false);
                navigate("/group");
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Manage All Squads
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
};

export default Header;

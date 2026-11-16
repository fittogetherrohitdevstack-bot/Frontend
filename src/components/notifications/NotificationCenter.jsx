import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCheck,
  Trash2,
  UtensilsCrossed,
  Droplets,
  Dumbbell,
  Camera,
  Award,
  Users,
  Flame,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "../ui/Button";
import { GlassCard } from "../ui/GlassCard";
import { useNotifications } from "../../hooks/useNotifications";
import { navigateToNotification } from "../../services/notifications/notificationNavigation";
import { haptics } from "../../motion/Haptics";

const getNotificationIcon = (type = "", category = "") => {
  const t = (type || category || "").toLowerCase();
  if (t.includes("meal")) return <UtensilsCrossed className="w-4 h-4 text-emerald-500" />;
  if (t.includes("water")) return <Droplets className="w-4 h-4 text-cyan-500" />;
  if (t.includes("workout")) return <Dumbbell className="w-4 h-4 text-violet-500" />;
  if (t.includes("moment")) return <Camera className="w-4 h-4 text-pink-500" />;
  if (t.includes("badge") || t.includes("achievement")) return <Award className="w-4 h-4 text-amber-500" />;
  if (t.includes("group") || t.includes("friend")) return <Users className="w-4 h-4 text-blue-500" />;
  if (t.includes("streak")) return <Flame className="w-4 h-4 text-orange-500" />;
  return <Bell className="w-4 h-4 text-slate-500" />;
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const diffDays = Math.floor(diffSec / 86400);
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const NotificationCenter = ({ compact = false, onSelect = null }) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearRead,
    page,
    setPage,
    pagination,
  } = useNotifications();

  const handleItemClick = (notification) => {
    haptics.tick();
    if (!notification.readAt) {
      markAsRead(notification._id);
    }
    if (onSelect) {
      onSelect(notification);
    } else {
      navigateToNotification(notification, navigate);
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    haptics.impact();
    deleteNotification(id);
  };

  return (
    <div className="w-full space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-lime-100 border border-lime-300 text-lime-800 flex items-center justify-center font-black shadow-xs">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-lime-500 text-slate-950 text-xs font-black tabular-nums shadow-xs">
                  {unreadCount} new
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Live updates from your squad & reminders
            </p>
          </div>
        </div>

        {/* Global Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  haptics.tick();
                  markAllAsRead();
                }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-2 h-8 cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1 text-lime-600" />
                <span className="hidden sm:inline">Mark all read</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                haptics.impact();
                clearRead();
              }}
              className="text-xs font-bold text-slate-400 hover:text-rose-600 px-2 h-8 cursor-pointer"
              title="Clear read notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 animate-pulse flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && notifications.length === 0 && (
        <GlassCard className="p-8 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">You're all caught up!</h3>
            <p className="text-xs text-slate-500 font-medium max-w-xs mt-1">
              When squadmates post moments, log meals, or hit hydration goals, updates appear here.
            </p>
          </div>
        </GlassCard>
      )}

      {/* Notification List */}
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {notifications.map((notif) => {
            const isUnread = !notif.readAt;
            return (
              <motion.div
                key={notif._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleItemClick(notif)}
                className={`relative group p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                  isUnread
                    ? "bg-white border-lime-300 shadow-sm hover:shadow-md hover:border-lime-400"
                    : "bg-white/70 border-slate-200/80 hover:bg-white hover:border-slate-300"
                }`}
              >
                {/* Unread Accent Dot */}
                {isUnread && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-lime-500 shadow-xs" />
                )}

                {/* Avatar / Icon */}
                <div className="relative shrink-0">
                  {notif.senderImage ? (
                    <img
                      src={notif.senderImage}
                      alt={notif.senderName || "Sender"}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-xs"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-xs">
                      {getNotificationIcon(notif.type, notif.category)}
                    </div>
                  )}

                  {/* Corner Badge */}
                  {notif.senderImage && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                      {getNotificationIcon(notif.type, notif.category)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4
                      className={`text-xs sm:text-sm tracking-tight truncate ${
                        isUnread ? "font-black text-slate-900" : "font-bold text-slate-700"
                      }`}
                    >
                      {notif.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5 line-clamp-2">
                    {notif.body}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                    {notif.url && notif.url !== "/" && (
                      <span className="inline-flex items-center gap-0.5 text-lime-700 font-bold hover:underline">
                        Open <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Optional Image Preview */}
                {notif.image && (
                  <img
                    src={notif.image}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 hidden sm:block"
                  />
                )}

                {/* Delete Button (visible on hover / focus) */}
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, notif._id)}
                  aria-label="Delete notification"
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity absolute bottom-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.total > pagination.limit && (
        <div className="flex items-center justify-between pt-2 px-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              haptics.tick();
              setPage((p) => Math.max(1, p - 1));
            }}
            className="text-xs font-bold"
          >
            Previous
          </Button>
          <span className="text-xs text-slate-400 font-semibold tabular-nums">
            Page {page} of {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={!pagination.hasMore}
            onClick={() => {
              haptics.tick();
              setPage((p) => p + 1);
            }}
            className="text-xs font-bold"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

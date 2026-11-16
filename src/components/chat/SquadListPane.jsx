import React, { useState } from "react";
import { Search, Flame, Users, MessageSquarePlus, ShieldCheck } from "lucide-react";
import { formatSnippetTime } from "../../utils/chatDateUtils";
import { haptics } from "../../motion/Haptics";
import { useNavigate } from "react-router-dom";

export const SquadListPane = ({ squads = [], activeSquadId, onSelectSquad, isLoading = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const filteredSquads = squads.filter((s) =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-full lg:w-80 xl:w-96 border-r border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex flex-col h-full shrink-0">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Squad Chats
          </h2>
          <button
            type="button"
            onClick={() => {
              haptics.tick();
              navigate("/group");
            }}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Create or Join Squad"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search squads..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-transparent focus:border-lime-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
          />
        </div>
      </div>

      {/* Squads List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-32" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-48" />
              </div>
            </div>
          ))
        ) : filteredSquads.length === 0 ? (
          <div className="text-center py-12 px-4 select-none">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Squads Found</p>
            <p className="text-xs text-slate-400 max-w-[200px] mx-auto mt-1">
              Join or create a squad to start messaging your fitness crew!
            </p>
            <button
              type="button"
              onClick={() => navigate("/group")}
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-lime-500 text-slate-950 text-xs font-black hover:bg-lime-400 active:scale-95 transition-all"
            >
              Explore Squads
            </button>
          </div>
        ) : (
          filteredSquads.map((squad) => {
            const isSelected = String(squad._id) === String(activeSquadId);
            const timeSnippet = formatSnippetTime(squad.lastMessage?.createdAt);

            return (
              <button
                key={squad._id}
                type="button"
                onClick={() => {
                  haptics.tick();
                  onSelectSquad(squad);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                  isSelected
                    ? "bg-lime-500/10 dark:bg-lime-500/15 border border-lime-500/30"
                    : "hover:bg-slate-100/70 dark:hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                {/* Squad Avatar */}
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-400 via-emerald-500 to-teal-600 p-0.5 shrink-0 shadow-sm">
                  <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center font-black text-white text-sm">
                    {squad.name?.slice(0, 2).toUpperCase() || "SQ"}
                  </div>
                  {squad.onlineCount > 0 && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {squad.name}
                    </h3>
                    {timeSnippet && (
                      <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                        {timeSnippet}
                      </span>
                    )}
                  </div>

                  {/* Snippet / Last message */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {squad.lastMessage ? (
                        <>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {squad.lastMessage.senderName?.split(" ")[0]}:{" "}
                          </span>
                          <span className={squad.lastMessage.isDeleted ? "italic opacity-80" : ""}>
                            {squad.lastMessage.text}
                          </span>
                        </>
                      ) : (
                        <span className="italic text-slate-400">No messages yet</span>
                      )}
                    </p>

                    {/* Unread Badge */}
                    {squad.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-lime-500 text-slate-950 text-[10px] font-black shrink-0 animate-pulse">
                        {squad.unreadCount > 99 ? "99+" : squad.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};

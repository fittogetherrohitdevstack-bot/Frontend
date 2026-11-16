import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { chatApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { useSquadChat } from "../hooks/useSquadChat";
import { SquadListPane } from "../components/chat/SquadListPane";
import { ChatHeader } from "../components/chat/ChatHeader";
import { MessageList } from "../components/chat/MessageList";
import { MessageComposer } from "../components/chat/MessageComposer";
import { TypingIndicator } from "../components/chat/TypingIndicator";
import { SquadInfoDrawer } from "../components/chat/SquadInfoDrawer";
import { MessageSquare, Users } from "lucide-react";

export const SquadChatPage = () => {
  const { squadId: urlSquadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);

  // Fetch all squads the user belongs to
  const { data: squadsData, isLoading: isLoadingSquads } = useQuery({
    queryKey: ["chat-squads-list"],
    queryFn: async () => {
      const res = await chatApi.getSquads();
      return res.data?.data || [];
    },
    refetchInterval: 15000,
  });

  const squads = squadsData || [];

  // Determine active squad ID from URL or selected state
  const activeSquadId = urlSquadId || selectedSquad?._id;

  // Single squad detail query (used if deep-linked or refreshed on /chat/:squadId)
  const { data: singleSquadInfo } = useQuery({
    queryKey: ["squad-chat-info", activeSquadId],
    queryFn: async () => {
      if (!activeSquadId) return null;
      const res = await chatApi.getSquadInfo(activeSquadId);
      return res.data?.data;
    },
    enabled: Boolean(activeSquadId),
  });

  // Effective squad object: from squads list, or single query, or state
  const activeSquad =
    squads.find((s) => String(s._id) === String(activeSquadId)) ||
    singleSquadInfo ||
    selectedSquad;

  // Sync state with URL or desktop default selection
  useEffect(() => {
    if (urlSquadId) {
      if (!selectedSquad || String(selectedSquad._id) !== String(urlSquadId)) {
        const found = squads.find((s) => String(s._id) === String(urlSquadId));
        if (found) {
          setSelectedSquad(found);
        } else if (singleSquadInfo) {
          setSelectedSquad(singleSquadInfo);
        }
      }
    } else if (window.innerWidth >= 1024 && squads.length > 0 && !selectedSquad) {
      // On desktop, auto-navigate to first squad if no squad selected in URL
      navigate(`/chat/${squads[0]._id}`, { replace: true });
    }
  }, [squads, urlSquadId, singleSquadInfo, selectedSquad, navigate]);

  // Hook for active squad chat conversation
  const {
    messages,
    isLoading: isLoadingMessages,
    isLoadingOlder,
    hasMoreOlder,
    onlineUserIds,
    typingUsers,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    loadOlderMessages,
    emitTyping,
  } = useSquadChat(activeSquadId);

  const handleSelectSquad = (squad) => {
    setSelectedSquad(squad);
    navigate(`/chat/${squad._id}`);
  };

  const handleBackToList = () => {
    setSelectedSquad(null);
    navigate("/chat");
  };

  const canModerate = activeSquad?.myRole === "admin" || activeSquad?.role === "admin";
  const hasActiveChat = Boolean(activeSquadId);

  return (
    <div className="flex-1 flex h-full w-full bg-slate-50/70 dark:bg-slate-950/70 relative overflow-hidden">
      {/* Left Column: Squads List (Hidden on mobile when a chat is open) */}
      <div className={`${hasActiveChat ? "hidden lg:flex" : "flex w-full"} h-full shrink-0`}>
        <SquadListPane
          squads={squads}
          activeSquadId={activeSquadId}
          onSelectSquad={handleSelectSquad}
          isLoading={isLoadingSquads}
        />
      </div>

      {/* Right Column: Chat Conversation (or Empty State) */}
      <div
        className={`flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-slate-900 ${
          !hasActiveChat ? "hidden lg:flex" : "flex w-full"
        }`}
      >
        {hasActiveChat ? (
          <>
            {/* Chat Top Header */}
            <ChatHeader
              squad={activeSquad || { name: "Squad Chat", _id: activeSquadId }}
              onlineCount={onlineUserIds.length}
              onBack={handleBackToList}
              onOpenInfo={() => setIsInfoDrawerOpen(true)}
            />

            {/* Scrollable Message List */}
            <div className="flex-1 flex flex-col min-h-0 relative bg-slate-50/40 dark:bg-slate-950/40">
              <MessageList
                messages={messages}
                isLoading={isLoadingMessages}
                isLoadingOlder={isLoadingOlder}
                hasMoreOlder={hasMoreOlder}
                onLoadOlder={loadOlderMessages}
                currentUserId={user?._id || user?.id}
                onReply={(msg) => {
                  setEditingMessage(null);
                  setReplyingTo(msg);
                }}
                onEdit={(msg) => {
                  setReplyingTo(null);
                  setEditingMessage(msg);
                }}
                onDelete={deleteMessage}
                onReact={toggleReaction}
                canModerate={canModerate}
                onQuickPrompt={(promptText) => sendMessage(promptText)}
              />

              {/* Floating Typing Indicator */}
              <div className="px-4 pb-1">
                <TypingIndicator typingUsers={typingUsers} />
              </div>
            </div>

            {/* Bottom Message Composer */}
            <MessageComposer
              onSend={sendMessage}
              onEdit={editMessage}
              onTyping={emitTyping}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              editingMessage={editingMessage}
              onCancelEdit={() => setEditingMessage(null)}
            />

            {/* Squad Info Slide-over Sheet */}
            {activeSquad && (
              <SquadInfoDrawer
                isOpen={isInfoDrawerOpen}
                onClose={() => setIsInfoDrawerOpen(false)}
                squadId={activeSquad._id || activeSquadId}
              />
            )}
          </>
        ) : (
          /* Desktop Empty State (when no squad selected) */
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-8 text-center select-none bg-slate-50/50 dark:bg-slate-950/50">
            <div className="w-16 h-16 rounded-3xl bg-lime-500/10 border border-lime-500/20 text-lime-600 dark:text-lime-400 flex items-center justify-center mb-4 shadow-lg shadow-lime-500/5">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Select a Squad to Chat
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
              Choose a squad from the left panel to join the conversation and support your teammates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SquadChatPage;

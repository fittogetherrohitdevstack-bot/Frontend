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

  // Match active squad from URL or default
  useEffect(() => {
    if (squads.length > 0) {
      if (urlSquadId) {
        const found = squads.find((s) => String(s._id) === String(urlSquadId));
        if (found) {
          setSelectedSquad(found);
        }
      } else if (window.innerWidth >= 1024 && !selectedSquad) {
        // On desktop, auto-select first squad if none selected
        setSelectedSquad(squads[0]);
      }
    }
  }, [squads, urlSquadId]);

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
  } = useSquadChat(selectedSquad?._id);

  const handleSelectSquad = (squad) => {
    setSelectedSquad(squad);
    navigate(`/chat/${squad._id}`, { replace: true });
  };

  const handleBackToList = () => {
    setSelectedSquad(null);
    navigate("/chat", { replace: true });
  };

  const canModerate = selectedSquad?.myRole === "admin";

  return (
    <div className="flex-1 flex h-[calc(100dvh-4rem)] bg-slate-50/50 dark:bg-slate-950/50 relative overflow-hidden">
      {/* Left Column: Squads List (Hidden on mobile when a chat is open) */}
      <div className={`${selectedSquad ? "hidden lg:flex" : "flex w-full"} h-full`}>
        <SquadListPane
          squads={squads}
          activeSquadId={selectedSquad?._id}
          onSelectSquad={handleSelectSquad}
          isLoading={isLoadingSquads}
        />
      </div>

      {/* Right Column: Chat Conversation (or Empty State) */}
      <div className={`flex-1 flex flex-col h-full bg-white dark:bg-slate-900 ${!selectedSquad ? "hidden lg:flex" : "flex w-full"}`}>
        {selectedSquad ? (
          <>
            {/* Chat Top Header */}
            <ChatHeader
              squad={selectedSquad}
              onlineCount={onlineUserIds.length}
              onBack={handleBackToList}
              onOpenInfo={() => setIsInfoDrawerOpen(true)}
            />

            {/* Scrollable Message List */}
            <div className="flex-1 flex flex-col min-h-0 relative">
              <MessageList
                messages={messages}
                isLoading={isLoadingMessages}
                isLoadingOlder={isLoadingOlder}
                hasMoreOlder={hasMoreOlder}
                onLoadOlder={loadOlderMessages}
                currentUserId={user?._id}
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
            <SquadInfoDrawer
              isOpen={isInfoDrawerOpen}
              onClose={() => setIsInfoDrawerOpen(false)}
              squadId={selectedSquad._id}
            />
          </>
        ) : (
          /* Desktop Empty State (when no squad selected) */
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-8 text-center select-none">
            <div className="w-16 h-16 rounded-3xl bg-lime-500/10 border border-lime-500/20 text-lime-600 dark:text-lime-400 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Select a Squad to Chat
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
              Choose a squad from the left panel to join the conversation and support your teammates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SquadChatPage;

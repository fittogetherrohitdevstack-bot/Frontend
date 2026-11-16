import { useState, useEffect, useRef, useCallback } from "react";
import { chatApi } from "../api/endpoints";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { haptics } from "../motion/Haptics";
import { toast } from "sonner";

export const useSquadChat = (squadId) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [oldestTimestamp, setOldestTimestamp] = useState(null);

  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Map()); // userId -> userName
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const squadIdRef = useRef(squadId);

  useEffect(() => {
    squadIdRef.current = squadId;
  }, [squadId]);

  // Fetch initial message history
  const fetchInitialMessages = useCallback(async () => {
    if (!squadId) return;
    setIsLoading(true);
    try {
      const res = await chatApi.getMessages(squadId, { limit: 30 });
      const data = res.data?.data || {};
      setMessages(data.messages || []);
      setHasMoreOlder(Boolean(data.hasMore));
      setOldestTimestamp(data.oldestTimestamp || null);

      // Invalidate global unread counts
      queryClient.invalidateQueries({ queryKey: ["chat-unread-counts"] });
    } catch (err) {
      console.warn("[SquadChat] Failed to load messages:", err.message);
      toast.error(err.response?.data?.message || "Could not load messages");
    } finally {
      setIsLoading(false);
    }
  }, [squadId, queryClient]);

  // Load older messages (pagination on scroll-up)
  const loadOlderMessages = useCallback(async () => {
    if (!squadId || !hasMoreOlder || isLoadingOlder || !oldestTimestamp) return 0;
    setIsLoadingOlder(true);
    try {
      const res = await chatApi.getMessages(squadId, { before: oldestTimestamp, limit: 30 });
      const data = res.data?.data || {};
      const older = data.messages || [];

      if (older.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => String(m._id)));
          const filtered = older.filter((m) => !existingIds.has(String(m._id)));
          return [...filtered, ...prev];
        });
        setOldestTimestamp(data.oldestTimestamp || older[0].createdAt);
        setHasMoreOlder(Boolean(data.hasMore));
        return older.length;
      } else {
        setHasMoreOlder(false);
        return 0;
      }
    } catch (err) {
      console.warn("[SquadChat] Failed to load older messages:", err.message);
      return 0;
    } finally {
      setIsLoadingOlder(false);
    }
  }, [squadId, hasMoreOlder, isLoadingOlder, oldestTimestamp]);

  // Initial load
  useEffect(() => {
    setMessages([]);
    setReplyingTo(null);
    setEditingMessage(null);
    setTypingUsers(new Map());
    if (squadId) {
      fetchInitialMessages();
    }
  }, [squadId, fetchInitialMessages]);

  // Socket room management & real-time events
  useEffect(() => {
    if (!socket || !squadId) return;

    // Join dedicated squad chat room
    socket.emit("squad:join_chat", { squadId });

    // 1. Incoming new message
    const handleNewMessage = (msg) => {
      if (String(msg.groupId) !== String(squadIdRef.current)) return;

      setMessages((prev) => {
        // Replace matching optimistic message or append
        const exists = prev.some((m) => String(m._id) === String(msg._id));
        if (exists) {
          return prev.map((m) => (String(m._id) === String(msg._id) ? msg : m));
        }
        return [...prev, msg];
      });

      // Provide subtle haptic for incoming message if not from current user
      if (String(msg.sender?._id) !== String(user?._id)) {
        haptics.tick();
      }

      // Mark as read in backend
      chatApi.markSquadAsRead(squadId).catch(() => {});
    };

    // 2. Message updated (edited)
    const handleMessageUpdated = (msg) => {
      if (String(msg.groupId) !== String(squadIdRef.current)) return;
      setMessages((prev) => prev.map((m) => (String(m._id) === String(msg._id) ? msg : m)));
    };

    // 3. Message deleted
    const handleMessageDeleted = (msg) => {
      if (String(msg.groupId) !== String(squadIdRef.current)) return;
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(msg._id)
            ? { ...m, isDeleted: true, text: "This message was deleted" }
            : m
        )
      );
    };

    // 4. Reactions updated
    const handleReactionUpdated = (data) => {
      if (String(data.groupId) !== String(squadIdRef.current)) return;
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(data.messageId) ? { ...m, reactions: data.reactions } : m
        )
      );
    };

    // 5. Online members in squad
    const handleOnlineMembers = (data) => {
      if (String(data.squadId) === String(squadIdRef.current)) {
        setOnlineUserIds(data.onlineUserIds || []);
      }
    };

    // 6. User started typing
    const handleUserTyping = (data) => {
      if (String(data.squadId) !== String(squadIdRef.current)) return;
      if (String(data.userId) === String(user?._id)) return;

      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.set(data.userId, data.userName);
        return next;
      });
    };

    // 7. User stopped typing
    const handleUserStopped = (data) => {
      if (String(data.squadId) !== String(squadIdRef.current)) return;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    };

    socket.on("chat:message", handleNewMessage);
    socket.on("chat:message_updated", handleMessageUpdated);
    socket.on("chat:message_deleted", handleMessageDeleted);
    socket.on("chat:reaction_updated", handleReactionUpdated);
    socket.on("squad:online_members", handleOnlineMembers);
    socket.on("typing:user_typing", handleUserTyping);
    socket.on("typing:user_stopped", handleUserStopped);

    return () => {
      socket.emit("squad:leave_chat", { squadId });
      socket.off("chat:message", handleNewMessage);
      socket.off("chat:message_updated", handleMessageUpdated);
      socket.off("chat:message_deleted", handleMessageDeleted);
      socket.off("chat:reaction_updated", handleReactionUpdated);
      socket.off("squad:online_members", handleOnlineMembers);
      socket.off("typing:user_typing", handleUserTyping);
      socket.off("typing:user_stopped", handleUserStopped);
    };
  }, [socket, squadId, user?._id]);

  // Typing event dispatcher with auto-stop timer
  const emitTyping = useCallback(() => {
    if (!socket || !squadId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing:start", { squadId, userName: user?.name || "Squadmate" });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("typing:stop", { squadId });
    }, 2500);
  }, [socket, squadId, user?.name]);

  const stopTypingNow = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current && socket && squadId) {
      isTypingRef.current = false;
      socket.emit("typing:stop", { squadId });
    }
  }, [socket, squadId]);

  // Send message with optimistic UI
  const sendMessage = useCallback(
    async (text) => {
      const trimmed = String(text || "").trim();
      if (!trimmed || !squadId) return;

      stopTypingNow();
      haptics.impact();

      const tempId = "opt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
      const optimisticMsg = {
        _id: tempId,
        groupId: squadId,
        sender: {
          _id: user?._id,
          name: user?.name || "Me",
          profileImage: user?.profileImage || "",
        },
        text: trimmed,
        messageType: "text",
        isDeleted: false,
        editedAt: null,
        createdAt: new Date().toISOString(),
        reactions: [],
        replyTo: replyingTo
          ? {
              _id: replyingTo._id,
              text: replyingTo.text,
              senderName: replyingTo.sender?.name || "Squadmate",
              isDeleted: replyingTo.isDeleted,
            }
          : null,
        readByCount: 1,
        isReadByMe: true,
        isMine: true,
        isOptimistic: true,
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      const activeReplyId = replyingTo?._id || null;
      setReplyingTo(null);

      try {
        const res = await chatApi.sendMessage(squadId, {
          text: trimmed,
          replyToId: activeReplyId,
        });
        const serverMsg = res.data?.data;

        // Replace optimistic msg with server message
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? { ...serverMsg, isMine: true } : m))
        );
        queryClient.invalidateQueries({ queryKey: ["chat-squads-list"] });
      } catch (err) {
        toast.error("Failed to send message. Tap to retry.");
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? { ...m, isFailed: true } : m))
        );
      }
    },
    [squadId, replyingTo, user, stopTypingNow, queryClient]
  );

  // Edit message
  const handleEditMessage = useCallback(
    async (messageId, newText) => {
      const trimmed = String(newText || "").trim();
      if (!trimmed || !messageId) return;

      haptics.impact();
      try {
        const res = await chatApi.editMessage(messageId, { text: trimmed });
        const updated = res.data?.data;
        setMessages((prev) =>
          prev.map((m) => (String(m._id) === String(messageId) ? updated : m))
        );
        setEditingMessage(null);
        toast.success("Message edited");
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not edit message");
      }
    },
    []
  );

  // Delete message
  const handleDeleteMessage = useCallback(async (messageId) => {
    if (!messageId) return;
    haptics.warning();
    try {
      await chatApi.deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(messageId)
            ? { ...m, isDeleted: true, text: "This message was deleted" }
            : m
        )
      );
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete message");
    }
  }, []);

  // Toggle reaction
  const handleToggleReaction = useCallback(
    async (messageId, emoji) => {
      if (!messageId || !emoji) return;
      haptics.tick();

      try {
        const res = await chatApi.toggleReaction(messageId, emoji);
        const data = res.data?.data;
        setMessages((prev) =>
          prev.map((m) =>
            String(m._id) === String(messageId) ? { ...m, reactions: data.reactions } : m
          )
        );
      } catch (err) {
        toast.error(err.response?.data?.message || "Reaction failed");
      }
    },
    []
  );

  return {
    messages,
    isLoading,
    isLoadingOlder,
    hasMoreOlder,
    onlineUserIds,
    typingUsers: Array.from(typingUsers.values()),
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    sendMessage,
    editMessage: handleEditMessage,
    deleteMessage: handleDeleteMessage,
    toggleReaction: handleToggleReaction,
    loadOlderMessages,
    emitTyping,
    markAsRead: () => chatApi.markSquadAsRead(squadId).catch(() => {}),
  };
};

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { config } from "../config";
import { useAuth } from "./AuthContext";
import { useGroup } from "./GroupContext";
import { useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const { activeGroup } = useGroup();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState(null);
  const [liveEvent, setLiveEvent] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const activeGroupIdRef = useRef(activeGroup?._id);

  useEffect(() => {
    activeGroupIdRef.current = activeGroup?._id;
  }, [activeGroup?._id]);

  const invalidateSquadQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["group-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["group-leaderboard"] });
    queryClient.invalidateQueries({ queryKey: ["group-challenges"] });
  };

  const pushActivityEvent = (evt) => {
    const entry = {
      id: `${evt.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: evt.timestamp || new Date().toISOString(),
      ...evt,
    };
    setLiveEvent(entry);
    setRecentEvents((prev) => [entry, ...prev].slice(0, 20));
  };

  useEffect(() => {
    if (!token) {
      if (socket) socket.disconnect();
      return;
    }

    const s = io(config.SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      if (activeGroupIdRef.current) {
        s.emit("join-group", activeGroupIdRef.current);
      }
    });

    s.on("meal-logged", (data) => {
      pushActivityEvent({ type: "meal", ...data });
      invalidateSquadQueries();
    });

    s.on("workout-completed", (data) => {
      pushActivityEvent({ type: "workout", ...data });
      invalidateSquadQueries();
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    });

    s.on("water-goal-hit", (data) => {
      pushActivityEvent({ type: "water", ...data });
      invalidateSquadQueries();
    });

    s.on("squad-sync", () => {
      invalidateSquadQueries();
    });

    s.on("badge-earned", (data) => {
      pushActivityEvent({ type: "badge", ...data });
      queryClient.invalidateQueries({ queryKey: ["my-badges"] });
      queryClient.invalidateQueries({ queryKey: ["group-leaderboard"] });
      confetti({ particleCount: 80, spread: 100, origin: { y: 0.6 } });
    });

    s.on("challenge-joined", (data) => {
      pushActivityEvent({ type: "challenge", ...data });
      queryClient.invalidateQueries({ queryKey: ["group-challenges"] });
    });

    s.on("challenge-created", (data) => {
      pushActivityEvent({
        type: "challenge-created",
        userName: data.createdBy || "Teammate",
        ...data,
      });
      queryClient.invalidateQueries({ queryKey: ["group-challenges"] });
    });

    s.on("member-joined", (data) => {
      pushActivityEvent({ type: "member-joined", ...data });
      queryClient.invalidateQueries({ queryKey: ["group-members"] });
      queryClient.invalidateQueries({ queryKey: ["group-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["group-leaderboard"] });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [token]);

  // Join active group room when group changes
  useEffect(() => {
    setRecentEvents([]);
    if (socket && activeGroup?._id) {
      socket.emit("join-group", activeGroup._id);
    }
    return () => {
      if (socket && activeGroup?._id) {
        socket.emit("leave-group", activeGroup._id);
      }
    };
  }, [socket, activeGroup?._id]);

  const clearLiveEvent = () => setLiveEvent(null);

  return (
    <SocketContext.Provider value={{ socket, liveEvent, recentEvents, clearLiveEvent }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

import React, { createContext, useContext, useEffect, useState } from "react";
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
      // Connected to socket server
    });

    s.on("meal-logged", (data) => {
      setLiveEvent({ type: "meal", ...data });
      queryClient.invalidateQueries({ queryKey: ["group-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["group-leaderboard"] });
    });

    s.on("workout-completed", (data) => {
      setLiveEvent({ type: "workout", ...data });
      queryClient.invalidateQueries({ queryKey: ["group-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["group-leaderboard"] });
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    });

    s.on("water-goal-hit", (data) => {
      setLiveEvent({ type: "water", ...data });
      queryClient.invalidateQueries({ queryKey: ["group-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["group-leaderboard"] });
    });

    s.on("badge-earned", (data) => {
      setLiveEvent({ type: "badge", ...data });
      queryClient.invalidateQueries({ queryKey: ["my-badges"] });
      queryClient.invalidateQueries({ queryKey: ["group-leaderboard"] });
      confetti({ particleCount: 80, spread: 100, origin: { y: 0.6 } });
    });

    s.on("challenge-joined", (data) => {
      setLiveEvent({ type: "challenge", ...data });
      queryClient.invalidateQueries({ queryKey: ["group-challenges"] });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [token]);

  // Join active group room when group changes
  useEffect(() => {
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
    <SocketContext.Provider value={{ socket, liveEvent, clearLiveEvent }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "../api/endpoints";
import { useSocket } from "../context/SocketContext";
import { notificationManager } from "../services/notifications/notificationManager";
import { toast } from "sonner";

export const useNotifications = (options = { autoInit: false }) => {
  const queryClient = useQueryClient();
  const { socket } = useSocket() || {};
  const [page, setPage] = useState(1);
  const [permissionStatus, setPermissionStatus] = useState("default");

  // Check permission on mount
  useEffect(() => {
    notificationManager.getPermissionStatus().then((status) => {
      setPermissionStatus(status);
    });

    if (options.autoInit) {
      notificationManager.init();
    }
  }, [options.autoInit]);

  // Query: In-App Notifications
  const {
    data: notifData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["notifications", page],
    queryFn: async () => {
      const res = await notificationApi.getNotifications({ page, limit: 25 });
      return res.data?.data || { notifications: [], unreadCount: 0, pagination: {} };
    },
    staleTime: 30 * 1000,
  });

  // Query: User Notification Preferences
  const { data: prefData, isLoading: isLoadingPrefs } = useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: async () => {
      const res = await notificationApi.getPreferences();
      return res.data?.data?.preferences || {};
    },
    staleTime: 5 * 60 * 1000,
  });

  // Mutation: Mark single notification read
  const markReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mutation: Mark all read
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  // Mutation: Delete single notification
  const deleteMutation = useMutation({
    mutationFn: (id) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mutation: Clear read notifications
  const clearReadMutation = useMutation({
    mutationFn: () => notificationApi.clearRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Read notifications cleared");
    },
  });

  // Mutation: Update preferences
  const updatePrefsMutation = useMutation({
    mutationFn: (newPrefs) => notificationApi.updatePreferences(newPrefs),
    onSuccess: (res) => {
      queryClient.setQueryData(
        ["notificationPreferences"],
        res.data?.data?.preferences
      );
      toast.success("Notification settings saved");
    },
  });

  // Real-time socket listener for incoming notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      const n = data?.notification;
      if (n) {
        notificationManager.notify({
          title: n.title,
          body: n.body,
          type: n.type,
          data: { url: n.url, ...n.data },
        });
      }
    };

    socket.on("new-notification", handleNewNotification);

    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, [socket, queryClient]);

  const requestPermission = useCallback(async () => {
    const status = await notificationManager.requestPermission();
    setPermissionStatus(status);
    return status;
  }, []);

  return {
    notifications: notifData?.notifications || [],
    unreadCount: notifData?.unreadCount || 0,
    pagination: notifData?.pagination || {},
    isLoading,
    isFetching,
    refetch,
    page,
    setPage,
    preferences: prefData || {},
    isLoadingPrefs,
    permissionStatus,
    requestPermission,
    markAsRead: (id) => markReadMutation.mutate(id),
    markAllAsRead: () => markAllReadMutation.mutate(),
    deleteNotification: (id) => deleteMutation.mutate(id),
    clearRead: () => clearReadMutation.mutate(),
    updatePreferences: (prefs) => updatePrefsMutation.mutate(prefs),
    isUpdatingPrefs: updatePrefsMutation.isPending,
  };
};

export default useNotifications;

/**
 * Maps notification types and deep-link URLs to frontend routes
 */
export const resolveNotificationRoute = (notification) => {
  if (!notification) return "/";

  const rawUrl = notification.url || notification.data?.url;
  if (rawUrl && typeof rawUrl === "string" && rawUrl.startsWith("/")) {
    return rawUrl;
  }

  const type = notification.type || notification.data?.type || "";

  switch (type) {
    case "meal":
    case "meal_added":
      return "/tracker";
    case "diet":
    case "diet_updated":
      return "/diet";
    case "water":
    case "water_logged":
      return "/water";
    case "moment":
    case "moment_posted":
      return "/moments";
    case "workout":
    case "workout_completed":
      return "/workouts";
    case "badge":
    case "achievement_unlocked":
      return "/badges";
    case "group":
    case "friend_request":
    case "friend_request_accepted":
      return "/group";
    case "weight":
      return "/weight";
    case "measurements":
      return "/measurements";
    case "photos":
      return "/photos";
    case "challenge":
      return "/challenges";
    case "chat":
    case "chat_message":
    case "squad_chat": {
      const groupId = notification.groupId || notification.data?.groupId;
      return groupId ? `/chat/${groupId}` : "/chat";
    }
    default:
      return "/";
  }
};

/**
 * Perform navigation using React Router navigate function or fallback to window.location
 */
export const navigateToNotification = (notification, navigateFn = null) => {
  const targetRoute = resolveNotificationRoute(notification);

  if (typeof navigateFn === "function") {
    navigateFn(targetRoute);
  } else if (typeof window !== "undefined") {
    window.location.href = targetRoute;
  }
};

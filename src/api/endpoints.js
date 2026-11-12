import api from "./client";

// Auth & User
export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  refresh: () => api.post("/auth/refresh"),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/users/me"),
  updateProfile: (data) => api.put("/users/profile", data),
  updateFeatures: (data) => api.put("/users/features", data),
  updateSocialSettings: (data) => api.put("/users/me/social-settings", data),
  activateStreakFreeze: (data) => api.post("/users/me/streak-freeze", data || {}),
  uploadAvatar: (data) =>
    data instanceof FormData
      ? api.post("/users/avatar", data, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      : api.post("/users/avatar", data),
  removeAvatar: () => api.delete("/users/avatar"),
};

// Groups
export const groupApi = {
  create: (data) => api.post("/groups", data),
  join: (data) => api.post("/groups/join", data),
  getInvitePreview: (code) => api.get(`/groups/invite/${code}`),
  getMyGroups: () => api.get("/groups/mine"),
  getById: (id) => api.get(`/groups/${id}`),
  update: (id, data) => api.put(`/groups/${id}`, data),
  getMembers: (id) => api.get(`/groups/${id}/members`),
  regenerateInvite: (id) => api.post(`/groups/${id}/invite/regenerate`),
  leave: (id) => api.post(`/groups/${id}/leave`),
  removeMember: (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`),
  getDashboard: (id) => api.get(`/groups/${id}/dashboard`),
  getLeaderboard: (id, period = "week") => api.get(`/groups/${id}/leaderboard?period=${period}`),
  createChallenge: (id, data) => api.post(`/groups/${id}/challenges`, data),
  getChallenges: (id) => api.get(`/groups/${id}/challenges`),
  getChallengeTemplates: (id) => api.get(`/groups/${id}/challenges/templates`),
  selectWeeklyTemplate: (id, templateKey) =>
    api.post(`/groups/${id}/challenges/weekly`, { templateKey }),
  getFeed: (id, cursor = null, limit = 15) =>
    api.get(`/groups/${id}/feed`, { params: { ...(cursor ? { cursor } : {}), limit } }),
  reactFeedEvent: (eventId, emoji) => api.post(`/feed/${eventId}/react`, { emoji }),
  getTodayStatus: (id) => api.get(`/groups/${id}/today-status`),
  nudgeMember: (id, targetUserId, message = "") =>
    api.post(`/groups/${id}/nudge`, { targetUserId, message }),
};

// Diet & Daily Tracker
export const dietApi = {
  createPlan: (data) => api.post("/diet", data),
  getMyPlans: () => api.get("/diet/my-plans"),
  getPlanById: (id) => api.get(`/diet/${id}`),
  updatePlan: (id, data) => api.put(`/diet/${id}`, data),
  deletePlan: (id) => api.delete(`/diet/${id}`),
  activatePlan: (id) => api.post(`/diet/${id}/activate`),
  duplicateDay: (id, data) => api.post(`/diet/${id}/duplicate-day`, data),
  getTodayPlannedMeals: () => api.get("/diet/today"),
  getOrCreateMealLog: (date) => api.post("/meals/log", { date }),
  updateMealStatus: (logId, data) => api.patch(`/meals/log/${logId}`, data),
  getMealHistory: (params) => api.get("/meals/history", { params }),
  getMyDashboard: () => api.get("/dashboard/me"),
};

// Workouts
export const workoutApi = {
  createPlan: (data) => api.post("/workouts", data),
  getMyPlans: () => api.get("/workouts/my-plans"),
  getToday: () => api.get("/workouts/today"),
  updatePlan: (id, data) => api.put(`/workouts/${id}`, data),
  deletePlan: (id) => api.delete(`/workouts/${id}`),
  saveSession: (data) => api.post("/workouts/sessions", data),
  updateSession: (id, data) => api.patch(`/workouts/sessions/${id}`, data),
  getHistory: () => api.get("/workouts/sessions/history"),
  getRecords: () => api.get("/workouts/records"),
  markAttendance: (data) => api.post("/workouts/attendance", data),
};

// Water & Body Progress & Weight
export const progressApi = {
  addWater: (data) => api.post("/water", data),
  getTodayWater: () => api.get("/water/today"),
  getWaterHistory: () => api.get("/water/history"),
  deleteWaterEntry: (id) => api.delete(`/water/entries/${id}`),
  saveMetrics: (data) => api.post("/progress/metrics", data),
  uploadPhoto: (data) => api.post("/progress/photo", data),
  getProgressHistory: (period = "month") => api.get(`/progress/history?period=${period}`),
  // Weight tracking
  upsertWeight: (data) => api.put("/progress/weight", data),
  getWeightLogs: (params) => api.get("/progress/weight", { params }),
  getWeightSummary: (range = "30d") => api.get(`/progress/weight/summary?range=${range}`),
  deleteWeightLog: (id) => api.delete(`/progress/weight/${id}`),
};

export const weightApi = {
  upsertWeight: (data) => api.put("/progress/weight", data),
  getWeightLogs: (params) => api.get("/progress/weight", { params }),
  getWeightSummary: (range = "30d") => api.get(`/progress/weight/summary?range=${range}`),
  deleteWeightLog: (id) => api.delete(`/progress/weight/${id}`),
};

// Weekly Body Measurements
export const measurementApi = {
  upsertMeasurements: (data) => api.put("/progress/measurements", data),
  getMeasurements: (params) => api.get("/progress/measurements", { params }),
  getSummary: (range = "12w") => api.get(`/progress/measurements/summary?range=${range}`),
  deleteMeasurement: (id) => api.delete(`/progress/measurements/${id}`),
};

// Daily Diet Chart & Tick-off API
export const mealChartApi = {
  getDayChart: (date) => api.get(`/meals/day?date=${date}`),
  saveDayChart: (date, data) => api.put(`/meals/day?date=${date}`, data),
  updateItem: (data) => api.patch("/meals/day/items", data),
  updateMeal: (data) => api.patch("/meals/day/meals", data),
  addUnplannedItem: (data) => api.post("/meals/day/items", data),
  copyChart: (data) => api.post("/meals/day/copy", data),
  getSummary: (range = "7d") => api.get(`/meals/summary?range=${range}`),
  getTemplates: () => api.get("/diet/templates"),
  saveTemplate: (data) => api.post("/diet/templates", data),
  deleteTemplate: (id) => api.delete(`/diet/templates/${id}`),
};

// Social, Badges & In-App Notifications
export const socialApi = {
  joinChallenge: (id) => api.post(`/challenges/${id}/join`),
  getChallengeDetails: (id) => api.get(`/challenges/${id}`),
  getMyBadges: () => api.get("/users/me/badges"),
  getNotifications: () => api.get("/notifications"),
  markNotificationRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch("/notifications/read-all"),
  updateReminderPreferences: (data) => api.put("/notifications/preferences", data),
};

// Weekly Targets & Pace Tracking
export const weeklyTargetApi = {
  getWeekly: (week) => api.get("/targets/weekly", { params: week ? { week } : {} }),
  upsertWeekly: (data) => api.put("/targets/weekly", data),
  updateDefaults: (data) => api.put("/targets/defaults", data),
  getHistory: (weeks = 12) => api.get("/targets/history", { params: { weeks } }),
  suggest: () => api.get("/targets/suggest"),
};

// Smart In-App Reminders
export const reminderApi = {
  getSettings: () => api.get("/reminders/settings"),
  updateSettings: (data) => api.put("/reminders/settings", data),
  snooze: (data) => api.post("/reminders/snooze", data),
  skip: (data) => api.post("/reminders/skip", data),
  getDue: () => api.get("/reminders/due"),
  sendTest: () => api.post("/reminders/test"),
};

// Bi-Weekly Progress Photo Sets (Front, Side, Back relaxed)
export const photoSetApi = {
  listSets: (params) => api.get("/progress/photo-sets", { params }),
  getCurrent: () => api.get("/progress/photo-sets/current"),
  uploadPosePhoto: (formData, onUploadProgress) =>
    api.put("/progress/photo-sets/current/photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    }),
  deletePosePhoto: (setId, pose) => api.delete(`/progress/photo-sets/${setId}/photo/${pose}`),
  deleteSet: (setId) => api.delete(`/progress/photo-sets/${setId}`),
  updateVisibility: (setId, visibility) =>
    api.put(`/progress/photo-sets/${setId}/visibility`, { visibility }),
  updateAnchor: (anchorDate) =>
    api.put("/progress/photo-sets/anchor", { anchorDate }),
  getGroupShared: (groupId) => api.get(`/groups/${groupId}/shared-photos`),
};

// Web Push Notifications (Phase 4)
export const pushApi = {
  getVapidKey: () => api.get("/push/vapid-key"),
  subscribe: (payload) => api.post("/push/subscribe", payload),
  unsubscribe: (payload) => api.post("/push/unsubscribe", payload || {}),
  sendTest: () => api.post("/push/test"),
};

// Sunday Weekly Recap Story Card (Phase 6)
export const recapApi = {
  getWeeklyRecap: (weekStart = null) =>
    api.get("/recap/weekly", { params: weekStart ? { weekStart } : {} }),
};

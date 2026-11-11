export const config = {
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
  APP_NAME: import.meta.env.VITE_APP_NAME || "FitTogether",
  DEFAULT_TIMEZONE: import.meta.env.VITE_DEFAULT_TIMEZONE || "Asia/Kolkata",
};

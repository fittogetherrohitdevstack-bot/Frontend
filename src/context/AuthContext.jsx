import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/endpoints";
import { notificationManager } from "../services/notifications/notificationManager";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("ft_access_token") || null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res.data?.success) {
        setUser(res.data.data.user);
        setProfile(res.data.data.profile);
      }
    } catch (err) {
      setUser(null);
      setProfile(null);
      localStorage.removeItem("ft_access_token");
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }

    const handleSessionExpired = () => {
      setUser(null);
      setProfile(null);
      setToken(null);
    };

    window.addEventListener("ft_session_expired", handleSessionExpired);
    return () => window.removeEventListener("ft_session_expired", handleSessionExpired);
  }, [token]);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    if (res.data?.success) {
      const { user: loggedUser, profile: loggedProfile, accessToken } = res.data.data;
      localStorage.setItem("ft_access_token", accessToken);
      setToken(accessToken);
      setUser(loggedUser);
      setProfile(loggedProfile);
      notificationManager.registerOnLogin().catch(() => {});
      return res.data;
    }
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    if (res.data?.success) {
      const { user: newUser, profile: newProfile, accessToken } = res.data.data;
      localStorage.setItem("ft_access_token", accessToken);
      setToken(accessToken);
      setUser(newUser);
      setProfile(newProfile);
      notificationManager.registerOnLogin().catch(() => {});
      return res.data;
    }
  };

  const logout = async () => {
    try {
      await notificationManager.unregisterOnLogout().catch(() => {});
      await authApi.logout();
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem("ft_access_token");
      setToken(null);
      setUser(null);
      setProfile(null);
    }
  };

  const updateProfileData = (updatedUser, updatedProfile) => {
    if (updatedUser) setUser(updatedUser);
    if (updatedProfile) setProfile(updatedProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfileData,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      profile: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,
      login: async () => {},
      register: async () => {},
      logout: () => {},
      updateProfileData: () => {},
      refreshUser: async () => {},
    };
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from "react";
import { groupApi } from "../api/endpoints";
import { useAuth } from "./AuthContext";

const GroupContext = createContext(null);

export const GroupProvider = ({ children }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroups = async () => {
    if (!user) {
      setGroups([]);
      setActiveGroup(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await groupApi.getMyGroups();
      if (res.data?.success) {
        const list = res.data.data.groups || [];
        setGroups(list);

        const savedId = localStorage.getItem("ft_active_group_id");
        const found = list.find((g) => g._id === savedId);
        if (found) {
          setActiveGroup(found);
        } else if (list.length > 0) {
          setActiveGroup(list[0]);
          localStorage.setItem("ft_active_group_id", list[0]._id);
        } else {
          setActiveGroup(null);
        }
      }
    } catch (err) {
      console.error("Failed to load user groups", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const selectGroup = (group) => {
    setActiveGroup(group);
    if (group) {
      localStorage.setItem("ft_active_group_id", group._id);
    } else {
      localStorage.removeItem("ft_active_group_id");
    }
  };

  return (
    <GroupContext.Provider
      value={{
        groups,
        activeGroup,
        isLoading,
        selectGroup,
        refreshGroups: fetchGroups,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) throw new Error("useGroup must be used within a GroupProvider");
  return context;
};

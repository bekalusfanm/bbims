// UserContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "../services/authService";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = getCurrentUser(); // Removed await as getCurrentUser is synchronous
      setUser(user);
    };
    fetchUser();
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

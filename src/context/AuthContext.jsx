import React, { createContext, useContext, useState } from "react";
import { Auth } from "../api/api";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(Auth.get());

  const isAdmin   = !!user && ["ADMIN", "MANAGER"].includes(user.role);
  const isLoggedIn = !!user?.token;

  const login = (data) => {
    Auth.save(data);
    setUser(data);
  };

  const logout = () => {
    Auth.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

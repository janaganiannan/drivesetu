"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (emailOrPhone: string, name: string, password?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("trendify_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (emailOrPhone: string, name: string, password?: string) => {
    // Specific Owner Check
    const isOwner = (emailOrPhone === "8125531017" || emailOrPhone === "owner@trendify.com") && password === "annan@123";
    
    const newUser = {
      id: "u-" + Math.random().toString(36).substr(2, 6),
      name: isOwner ? "Store Owner" : name,
      email: emailOrPhone.includes("@") ? emailOrPhone : "",
      phone: !emailOrPhone.includes("@") ? emailOrPhone : "",
      isAdmin: isOwner,
    };
    setUser(newUser);
    localStorage.setItem("trendify_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("trendify_user");
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

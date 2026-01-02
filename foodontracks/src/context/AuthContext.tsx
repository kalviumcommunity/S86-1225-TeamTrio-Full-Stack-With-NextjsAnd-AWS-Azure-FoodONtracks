"use client";

import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { logger } from "@/lib/logger";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, email: string, role?: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Load user from localStorage using lazy initialization
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const storedUser = localStorage.getItem("authUser");
      if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        logger.error("failed_parse_stored_user", { error: String(error) });
        localStorage.removeItem("authUser");
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = (username: string, email: string, role: string = "user") => {
    const newUser: User = {
      id: Date.now().toString(),
      name: username,
      email,
      role,
    };
    setUser(newUser);
    localStorage.setItem("authUser", JSON.stringify(newUser));
    logger.info("user_logged_in", { username, role });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authUser");
    logger.info("user_logged_out", {});
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("authUser", JSON.stringify(updatedUser));
      logger.info("user_updated", { user: updatedUser });
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for consuming context
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

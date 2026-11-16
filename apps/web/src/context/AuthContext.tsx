"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, setAuthToken, getAuthToken, setApiAuthContext } from "../lib/api";

export type Role =
  | "owner_admin"
  | "bid_manager"
  | "business_development"
  | "technical_contributor"
  | "finance_contributor"
  | "compliance_reviewer"
  | "approver"
  | "viewer";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  role: Role | null;
  organization_id: string | null;
  organization_name: string | null;
  is_platform_admin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: {
    email: string;
    password: string;
    full_name?: string;
    organization_name?: string;
    role?: Role;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (allowedRoles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Initialize session from token in localStorage on mount
  useEffect(() => {
    async function initAuth() {
      try {
        const storedToken = getAuthToken();
        if (storedToken) {
          setToken(storedToken);
          const userProfile = await api.getMe();
          if (userProfile && userProfile.id) {
            setUser(userProfile);
            setApiAuthContext(userProfile.organization_id || "", userProfile.id);
          } else {
            // Invalid session
            setAuthToken(null);
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.warn("Session check failed or expired:", err);
        setAuthToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      if (!res.access_token || !res.user) {
        throw new Error("Invalid response from login service");
      }
      setAuthToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      setApiAuthContext(res.user.organization_id || "", res.user.id);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (payload: {
    email: string;
    password: string;
    full_name?: string;
    organization_name?: string;
    role?: Role;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.signup(payload);
      if (!res.access_token || !res.user) {
        throw new Error("Invalid response from registration service");
      }
      setAuthToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      setApiAuthContext(res.user.organization_id || "", res.user.id);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setApiAuthContext("", "");
    router.push("/login");
  };

  const refreshUser = async () => {
    try {
      const profile = await api.getMe();
      if (profile && profile.id) {
        setUser(profile);
        setApiAuthContext(profile.organization_id || "", profile.id);
      }
    } catch (err) {
      console.error("Failed to refresh user profile:", err);
    }
  };

  const hasRole = (allowedRoles: Role[]): boolean => {
    if (!user) return false;
    if (user.is_platform_admin) return true;
    if (!user.role) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setApiAuthContext } from "../lib/api";
import { useAuth, Role } from "./AuthContext";

export type { Role };
export type UIState = "populated" | "empty" | "loading" | "error" | "permission_denied" | "stale";

export interface Organization {
  id: string;
  name: string;
  registrationCountry: string;
  ntn?: string;
  secp?: string;
  categories: string[];
  regions: string[];
  profileCompleteness: number;
  scenario?: "A" | "B" | "C" | string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "warning" | "info" | "danger" | "success";
  timestamp: string;
  read: boolean;
  link?: string;
}

interface TenantContextType {
  activeOrg: Organization;
  setActiveOrg: (org: Organization) => void;
  currentUser: User;
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  hasRole: (allowedRoles: Role[]) => boolean;
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  uiState: UIState;
  setUiState: (state: UIState) => void;
  isPlatformAdmin: boolean;
  setIsPlatformAdmin: (isAdmin: boolean) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, hasRole: authHasRole } = useAuth();
  const [uiState, setUiState] = useState<UIState>("populated");
  const [searchQuery, setSearchQuery] = useState("");
  const [overrideRole, setOverrideRole] = useState<Role | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-1",
      title: "Workspace Initialized",
      message: "Your organization workspace is active. Register bids, upload credentials, and explore live tenders.",
      type: "success",
      timestamp: "Just now",
      read: false,
      link: "/tenders",
    },
  ]);

  const currentRole: Role = overrideRole || user?.role || "owner_admin";

  const [overrideOrg, setOverrideOrg] = useState<Organization | null>(null);
  const [platformAdminState, setPlatformAdminState] = useState<boolean>(false);

  const activeOrg: Organization = overrideOrg || {
    id: user?.organization_id || "00000000-0000-0000-0000-000000000000",
    name: user?.organization_name || "My Organization",
    registrationCountry: "PK",
    categories: [],
    regions: ["Federal Capital", "Punjab"],
    profileCompleteness: 45,
    scenario: "A",
  };

  const currentUser: User = {
    id: user?.id || "00000000-0000-0000-0000-000000000001",
    email: user?.email || "user@organization.example",
    fullName: user?.full_name || user?.email?.split("@")[0] || "User",
    role: currentRole,
  };

  useEffect(() => {
    if (user?.organization_id && user?.id) {
      setApiAuthContext(user.organization_id, user.id);
    }
  }, [user]);

  const hasRole = (allowedRoles: Role[]): boolean => {
    if (user?.is_platform_admin) return true;
    return authHasRole(allowedRoles);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <TenantContext.Provider
      value={{
        activeOrg,
        setActiveOrg: (org: Organization) => setOverrideOrg(org),
        currentUser,
        currentRole,
        setCurrentRole: (r: Role) => setOverrideRole(r),
        hasRole,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        searchQuery,
        setSearchQuery,
        uiState,
        setUiState,
        isPlatformAdmin: platformAdminState || !!user?.is_platform_admin,
        setIsPlatformAdmin: (isAdmin: boolean) => setPlatformAdminState(isAdmin),
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

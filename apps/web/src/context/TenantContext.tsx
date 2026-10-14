"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type UIState = "populated" | "empty" | "loading" | "error" | "permission_denied" | "stale";

export type Role =
  | "owner_admin"
  | "bid_manager"
  | "business_development"
  | "technical_contributor"
  | "finance_contributor"
  | "compliance_reviewer"
  | "approver"
  | "viewer";

export interface Organization {
  id: string;
  name: string;
  registrationCountry: string;
  ntn: string;
  secp: string;
  categories: string[];
  regions: string[];
  profileCompleteness: number;
  scenario: "A" | "B" | "C";
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

export const SCENARIO_ORGANIZATIONS: Organization[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Apex Healthcare Technologies Ltd (Fictional)",
    registrationCountry: "PK",
    ntn: "1234567-8",
    secp: "0098765",
    categories: ["Medical Devices", "Hospital Equipment", "Biomedical Engineering"],
    regions: ["Federal Capital", "Punjab", "Sindh"],
    profileCompleteness: 92,
    scenario: "A",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Delta Engineering & Cloud Solutions (Fictional)",
    registrationCountry: "PK",
    ntn: "5432109-8",
    secp: "0045678",
    categories: ["Cloud Computing", "IT Systems Integration", "Datacenter Infrastructure"],
    regions: ["Punjab", "Sindh"],
    profileCompleteness: 60,
    scenario: "B",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Indus Heavy Logistics & Mobility (Fictional)",
    registrationCountry: "PK",
    ntn: "9876543-1",
    secp: "0011223",
    categories: ["Vehicles & Heavy Equipment", "Transport Services"],
    regions: ["Federal Capital", "Punjab", "Balochistan"],
    profileCompleteness: 85,
    scenario: "C",
  },
];

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
  setUiState: (state: "populated" | "empty" | "loading" | "error" | "permission_denied" | "stale") => void;
  isPlatformAdmin: boolean;
  setIsPlatformAdmin: (isAdmin: boolean) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [activeOrg, setActiveOrg] = useState<Organization>(SCENARIO_ORGANIZATIONS[0]);
  const [currentRole, setCurrentRole] = useState<Role>("bid_manager");
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [uiState, setUiState] = useState<UIState>("populated");
  const [searchQuery, setSearchQuery] = useState("");

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-1",
      title: "Mandatory Evidence Expired (Scenario B)",
      message: "PRA Provincial Sales Tax Registration expired 35 days ago. Disqualification risk under Rule 36.",
      type: "danger",
      timestamp: "10 mins ago",
      read: false,
      link: "/compliance",
    },
    {
      id: "notif-2",
      title: "Tender Corrigendum Issued (Scenario C)",
      message: "NDMA published Corrigendum 01 extending deadline to Oct 24 and expediting delivery to 45 days. Prior approvals invalidated.",
      type: "warning",
      timestamp: "1 hour ago",
      read: false,
      link: "/tenders",
    },
    {
      id: "notif-3",
      title: "EPADS Feed Sync Successful",
      message: "Federal E-Procurement feed synced 14 new tenders. 3 match your category profile.",
      type: "success",
      timestamp: "3 hours ago",
      read: true,
    },
  ]);

  const currentUser: User = {
    id: "usr-001",
    email: "mustafa.bid@apex-health.example",
    fullName: "Mustafa Muhammad",
    role: currentRole,
  };

  const hasRole = (allowedRoles: Role[]): boolean => {
    if (isPlatformAdmin) return true;
    return allowedRoles.includes(currentRole);
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
        setActiveOrg,
        currentUser,
        currentRole,
        setCurrentRole,
        hasRole,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        searchQuery,
        setSearchQuery,
        uiState,
        setUiState,
        isPlatformAdmin,
        setIsPlatformAdmin,
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

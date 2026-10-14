"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  HelpCircle,
  Building,
  ChevronDown,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import { useTenant, SCENARIO_ORGANIZATIONS, Role, UIState } from "../../context/TenantContext";
import { NotificationDrawer } from "../shared/NotificationDrawer";

export function Header() {
  const {
    activeOrg,
    setActiveOrg,
    currentUser,
    currentRole,
    setCurrentRole,
    notifications,
    searchQuery,
    setSearchQuery,
    uiState,
    setUiState,
  } = useTenant();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 select-none">
        {/* Left: Organization Switcher Dropdown */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
            >
              <Building className="w-3.5 h-3.5 text-blue-600" />
              <span className="truncate max-w-[190px]">{activeOrg.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isOrgDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-40">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Switch Active Tenant Workspace
                </div>
                {SCENARIO_ORGANIZATIONS.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      setActiveOrg(org);
                      setIsOrgDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-start justify-between cursor-pointer ${
                      activeOrg.id === org.id ? "bg-blue-50/70 text-blue-900 font-bold" : "text-slate-700"
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{org.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Scenario {org.scenario}</div>
                    </div>
                    {activeOrg.id === org.id && (
                      <span className="text-[10px] bg-blue-200 text-blue-900 px-1.5 py-0.2 rounded font-bold">
                        ACTIVE
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick UI State Tester for Demonstrations */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
            <SlidersHorizontal className="w-3 h-3 text-slate-500" />
            <span className="text-slate-500 font-medium">State:</span>
            <select
              value={uiState}
              onChange={(e) => setUiState(e.target.value as UIState)}
              className="bg-transparent font-bold text-slate-800 text-xs focus:outline-hidden cursor-pointer"
              title="Test all required UI edge cases per AGENTS.md"
            >
              <option value="populated">Populated</option>
              <option value="loading">Loading</option>
              <option value="empty">Empty</option>
              <option value="error">API Error</option>
              <option value="permission_denied">Permission Denied</option>
              <option value="stale">Stale Data</option>
            </select>
          </div>
        </div>

        {/* Center: Universal Search Input */}
        <div className="flex-1 max-w-md mx-6 hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tenders, requirements, vault documents... (Ctrl+K)"
              className="w-full h-9 pl-9 pr-12 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
            />
            <kbd className="absolute right-2.5 top-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Role Switcher, Notifications, Help, Profile */}
        <div className="flex items-center gap-3">
          {/* Role Switcher Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer border border-slate-200"
              title="Switch RBAC role to verify server and client permission boundaries"
            >
              <Shield className="w-3 h-3 text-blue-600" />
              <span className="capitalize">{currentRole.replace(/_/g, " ")}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-40">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Switch RBAC Role (Live Test)
                </div>
                {(
                  [
                    "owner_admin",
                    "bid_manager",
                    "business_development",
                    "technical_contributor",
                    "finance_contributor",
                    "compliance_reviewer",
                    "approver",
                    "viewer",
                  ] as Role[]
                ).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setCurrentRole(role);
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 capitalize cursor-pointer ${
                      currentRole === role ? "font-bold text-blue-600 bg-blue-50/50" : "text-slate-700"
                    }`}
                  >
                    {role.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={() => setIsNotifOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors relative cursor-pointer"
            title="Open Notifications & Alerts Drawer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white"></span>
            )}
          </button>

          {/* Help link */}
          <Link
            href="/onboarding"
            className="p-2 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 transition-colors hidden sm:block"
            title="Setup & Onboarding Wizard"
          >
            <HelpCircle className="w-4 h-4" />
          </Link>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
              MM
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-none">
                {currentUser.fullName}
              </span>
              <span className="text-[10px] text-slate-400 capitalize mt-0.5">
                {currentRole.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>
      </header>

      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
}

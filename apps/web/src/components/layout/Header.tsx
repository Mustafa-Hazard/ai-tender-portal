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
  LogOut,
  User as UserIcon,
  Server,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import { NotificationDrawer } from "../shared/NotificationDrawer";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, searchQuery, setSearchQuery } = useTenant();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isOwnerOrAdmin = user?.is_platform_admin || user?.role === "owner_admin";

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 select-none">
        {/* Left: Organization Workspace Branding */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/90 text-xs font-semibold text-slate-800">
            <Building className="w-3.5 h-3.5 text-[#0051d5]" />
            <span className="truncate max-w-[200px]">
              {user?.organization_name || "Enterprise Workspace"}
            </span>
            <span className="text-[10px] bg-blue-100 text-[#0051d5] font-bold px-1.5 py-0.2 rounded font-mono">
              PROD
            </span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md mx-6 hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search live tenders, requirements, vault documents... (Ctrl+K)"
              className="w-full h-9 pl-9 pr-12 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
            />
            <kbd className="absolute right-2.5 top-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Authenticated vs Unauthenticated Navigation Controls */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              {/* Role Indicator Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                <Shield className="w-3.5 h-3.5 text-[#0051d5]" />
                <span className="capitalize">{user.role?.replace(/_/g, " ") || "Member"}</span>
              </div>

              {/* Notifications Bell */}
              <button
                type="button"
                onClick={() => setIsNotifOpen(true)}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white"></span>
                )}
              </button>

              {/* Help & Guide Link */}
              <Link
                href="/onboarding"
                className="p-2 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 transition-colors hidden sm:block"
                title="System Guide"
              >
                <HelpCircle className="w-4 h-4" />
              </Link>

              {/* User Avatar & Dropdown Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                    {user.full_name
                      ? user.full_name.slice(0, 2).toUpperCase()
                      : user.email.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden xl:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800 leading-none">
                      {user.full_name || user.email}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize mt-0.5">
                      {user.role?.replace(/_/g, " ") || "Member"}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user.full_name || "Enterprise User"}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 capitalize">
                        {user.role?.replace(/_/g, " ") || "Member"}
                      </span>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>Company Profile</span>
                    </Link>

                    {isOwnerOrAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Server className="w-4 h-4 text-slate-400" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Unauthenticated Navbar State */
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0051d5] hover:bg-blue-700 transition-colors shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Bookmark,
  Layers,
  ShieldCheck,
  FileEdit,
  Building2,
  FolderLock,
  Calendar,
  BarChart3,
  Users,
  Settings,
  Server,
  LogOut,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useAuth, Role } from "../../context/AuthContext";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  allowedRoles?: Role[];
  adminOnly?: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();

  const isOwnerOrAdmin = user?.is_platform_admin || user?.role === "owner_admin";
  const isApproverOrAdmin = isOwnerOrAdmin || user?.role === "approver";

  const navigation: NavItem[] = [
    { title: "Dashboard", href: "/", icon: LayoutDashboard },
    { title: "Discover Tenders", href: "/tenders", icon: Compass, badge: "Live" },
    { title: "Saved Searches", href: "/saved-searches", icon: Bookmark },
    { title: "Participation", href: "/participation", icon: Layers, badge: "Kanban" },
    { title: "Compliance", href: "/compliance", icon: ShieldCheck },
    { title: "Proposals", href: "/proposals", icon: FileEdit },
    // Approvals gated to Approvers and Owner/Admins
    ...(isApproverOrAdmin
      ? [{ title: "Approvals", href: "/approvals", icon: ShieldCheck, badge: "Gate" }]
      : []),
    { title: "Submissions", href: "/submissions", icon: FileEdit },
    { title: "Company Profile", href: "/profile", icon: Building2 },
    { title: "Document Vault", href: "/vault", icon: FolderLock },
    { title: "Calendar & Tasks", href: "/calendar", icon: Calendar },
    // Reports & Analytics
    ...(isOwnerOrAdmin || user?.role === "bid_manager" || user?.role === "finance_contributor"
      ? [{ title: "Reports & BI", href: "/reports", icon: BarChart3 }]
      : []),
    // Admin only management
    ...(isOwnerOrAdmin
      ? [
          { title: "Team & Access", href: "/admin", icon: Users },
          { title: "Settings", href: "/settings", icon: Settings },
        ]
      : []),
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen shrink-0 sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-[#0051d5] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            TP
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-slate-900 tracking-tight">
              Tender Portal
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Enterprise Bidder SaaS</span>
          </div>
        </Link>
      </div>

      {/* Organization Badge Card */}
      <div className="p-3 m-3 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-slate-900 font-medium">
          <span className="truncate max-w-[170px]" title={user?.organization_name || "My Organization"}>
            {user?.organization_name || "Enterprise Workspace"}
          </span>
          <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1 py-0.5 rounded font-semibold">
            PK
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Active Role</span>
          <span className="font-semibold text-blue-700 capitalize">
            {user?.role?.replace(/_/g, " ") || "Member"}
          </span>
        </div>
      </div>

      {/* Dynamic Navigation List with RBAC Filtering */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold transition-all group ${
                isActive
                  ? "bg-[#eff6ff] text-[#0051d5] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-[#0051d5]" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    isActive ? "bg-blue-200 text-blue-900" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Platform Administrator Panel Link (Conditioned on is_platform_admin or owner_admin) */}
      {isOwnerOrAdmin && (
        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          <Link
            href="/admin"
            className="flex items-center justify-between p-2 rounded-md text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              <span>Admin Dashboard</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      )}

      {/* Authenticated User Profile & Sign Out Bar */}
      <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
            {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : user?.email?.slice(0, 2).toUpperCase() || "TP"}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs font-semibold text-slate-800 truncate" title={user?.full_name || user?.email}>
              {user?.full_name || user?.email}
            </span>
            <span className="text-[10px] text-slate-400 truncate">
              {user?.email}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          title="Sign out of Tender Portal"
          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

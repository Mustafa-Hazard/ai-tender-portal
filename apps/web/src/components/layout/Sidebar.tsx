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
  ChevronRight,
} from "lucide-react";
import { useTenant } from "../../context/TenantContext";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const { activeOrg } = useTenant();

  const navigation: NavItem[] = [
    { title: "Dashboard", href: "/", icon: LayoutDashboard },
    { title: "Discover Tenders", href: "/tenders", icon: Compass, badge: "Live" },
    { title: "Saved Searches", href: "/saved-searches", icon: Bookmark },
    { title: "Participation", href: "/participation", icon: Layers, badge: "Kanban" },
    { title: "Compliance", href: "/compliance", icon: ShieldCheck },
    { title: "Proposals", href: "/proposals", icon: FileEdit },
    { title: "Approvals", href: "/approvals", icon: ShieldCheck, badge: "Gate" },
    { title: "Submissions", href: "/submissions", icon: FileEdit },
    { title: "Company Profile", href: "/profile", icon: Building2 },
    { title: "Document Vault", href: "/vault", icon: FolderLock },
    { title: "Calendar & Tasks", href: "/calendar", icon: Calendar },
    { title: "Reports", href: "/reports", icon: BarChart3 },
    { title: "Team", href: "/team", icon: Users },
    { title: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen shrink-0 sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#0051d5] text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-[#0041ab] transition-colors">
            TP
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm text-[#0b1c30] tracking-tight flex items-center gap-1">
              AI Tender Portal
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-medium">Enterprise Bidder SaaS</span>
          </div>
        </Link>
      </div>

      {/* Organization Badge Card */}
      <div className="p-3 m-3 rounded-lg bg-blue-50/60 border border-blue-100 flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px] text-blue-900 font-bold">
          <span className="truncate max-w-[170px]" title={activeOrg.name}>
            {activeOrg.name.replace(" (Fictional)", "")}
          </span>
          <span className="font-mono text-[10px] bg-blue-200 text-blue-950 px-1 rounded">
            PK
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
          <span>Profile Setup:</span>
          <span className="font-bold text-blue-800">{activeOrg.profileCompleteness}%</span>
        </div>
        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-1 rounded-full transition-all"
            style={{ width: `${activeOrg.profileCompleteness}%` }}
          />
        </div>
      </div>

      {/* Navigation List matching Figma */}
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

      {/* Platform Admin Area Toggle */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50">
        <Link
          href="/admin"
          className="flex items-center justify-between p-2 rounded-md text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-600" />
            <span>Platform Admin</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>
    </aside>
  );
}

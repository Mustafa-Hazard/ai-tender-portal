"use client";

import React, { useState } from "react";
import { X, Bell, AlertTriangle, AlertCircle, Info, CheckCheck, ExternalLink } from "lucide-react";
import { useTenant } from "../../context/TenantContext";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  className = "",
}: NotificationDrawerProps) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useTenant();
  const [filter, setFilter] = useState<"all" | "unread" | "urgent">("all");

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "urgent") return n.type === "danger" || n.type === "warning";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden ${className}`} role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Notifications & Alerts</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="text-xs text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-4 py-2 border-b border-slate-100 flex gap-2 text-xs bg-white">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-full cursor-pointer font-medium ${
                filter === "all" ? "bg-blue-100 text-blue-900 font-bold" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`px-2.5 py-1 rounded-full cursor-pointer font-medium ${
                filter === "unread" ? "bg-blue-100 text-blue-900 font-bold" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("urgent")}
              className={`px-2.5 py-1 rounded-full cursor-pointer font-medium ${
                filter === "urgent" ? "bg-red-100 text-red-900 font-bold" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Urgent Risks
            </button>
          </div>

          {/* Notifications Feed */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No notifications matching current filter.
              </div>
            ) : (
              filtered.map((item) => {
                const icon = {
                  danger: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />,
                  warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
                  info: <Info className="w-4 h-4 text-blue-600 shrink-0" />,
                  success: <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />,
                }[item.type];

                const bgStyle = item.read ? "bg-white" : "bg-blue-50/50";

                return (
                  <div
                    key={item.id}
                    onClick={() => markNotificationRead(item.id)}
                    className={`p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer ${bgStyle}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">{icon}</div>
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between gap-1 mb-1">
                          <h4 className={`text-xs font-bold ${item.type === "danger" ? "text-red-950" : "text-slate-900"}`}>
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-2">
                          {item.message}
                        </p>
                        {item.link && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline">
                            <span>Inspect Affected Record</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";


export type SourceType =
  | "government_portal"
  | "government_department"
  | "private_corporate"
  | "supplier_portal"
  | "upload"
  | "manual";

export type SourceHealth = "healthy" | "degraded" | "failing" | "unknown";

interface SourceBadgeProps {
  name: string;
  sourceType?: SourceType;
  health?: SourceHealth;
  lastChecked?: string;
  isFictional?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function SourceBadge({
  name,
  sourceType = "government_portal",
  health = "healthy",
  lastChecked,
  isFictional = true,
  isLoading = false,
  className = "",
}: SourceBadgeProps) {
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-400 animate-pulse border border-slate-200">
        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
        <span className="w-16 h-2 bg-slate-300 rounded"></span>
      </span>
    );
  }

  const healthDots = {
    healthy: "bg-emerald-500",
    degraded: "bg-amber-500",
    failing: "bg-red-500",
    unknown: "bg-slate-400",
  }[health];

  const healthLabels = {
    healthy: "Feed Active",
    degraded: "Feed Delayed",
    failing: "Connection Error",
    unknown: "Unverified Feed",
  }[health];

  return (
    <span
      data-source-type={sourceType}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-50 text-slate-800 border border-slate-200 ${className}`}
      title={`${name} (${healthLabels}) ${lastChecked ? `- Last checked: ${lastChecked}` : ""}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${healthDots}`} aria-hidden="true" />
      <span className="truncate max-w-[180px] font-medium">{name}</span>
      {isFictional && (
        <span className="text-[10px] font-mono px-1 rounded bg-slate-200 text-slate-700 font-semibold" title="Visibly marked fictional sample connector per AGENTS.md rule 13">
          SAMPLE
        </span>
      )}
    </span>
  );
}

"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Clock, HelpCircle, XCircle } from "lucide-react";

export type StatusCategory =
  | "fit"
  | "eligibility"
  | "coverage"
  | "readiness"
  | "stage"
  | "lifecycle";

interface StatusPillProps {
  category?: StatusCategory;
  label: string;
  variant?: "success" | "warning" | "danger" | "neutral" | "info";
  score?: number;
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  errorMessage?: string;
  className?: string;
}

export function StatusPill({
  category,
  label,
  variant,
  score,
  isLoading = false,
  isEmpty = false,
  isError = false,
  errorMessage = "Status unavailable",
  className = "",
}: StatusPillProps) {
  if (isLoading) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-400 animate-pulse ${className}`}>
        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
        Loading...
      </span>
    );
  }

  if (isError) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 ${className}`} title={errorMessage}>
        <AlertCircle className="w-3 h-3 text-red-600" />
        Error
      </span>
    );
  }

  if (isEmpty || !label) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200 ${className}`}>
        <HelpCircle className="w-3 h-3 text-slate-400" />
        Not stated
      </span>
    );
  }

  // Derive visual variant if not explicitly given
  let resolvedVariant = variant || "neutral";
  let IconComponent = HelpCircle;

  if (category === "eligibility") {
    if (label.toLowerCase().includes("potentially eligible") || label.toLowerCase().includes("eligible")) {
      resolvedVariant = "success";
      IconComponent = CheckCircle2;
    } else if (label.toLowerCase().includes("not eligible")) {
      resolvedVariant = "danger";
      IconComponent = XCircle;
    } else {
      resolvedVariant = "warning";
      IconComponent = AlertCircle;
    }
  } else if (category === "readiness") {
    if (label.toLowerCase().includes("ready")) {
      resolvedVariant = "success";
      IconComponent = CheckCircle2;
    } else if (label.toLowerCase().includes("blocked")) {
      resolvedVariant = "danger";
      IconComponent = XCircle;
    } else {
      resolvedVariant = "info";
      IconComponent = Clock;
    }
  }

  const variantStyles = {
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-red-50 text-red-800 border-red-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
    neutral: "bg-slate-100 text-slate-800 border-slate-200",
  }[resolvedVariant];


  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyles} ${className}`}
      role="status"
    >
      <IconComponent className="w-3 h-3 shrink-0" aria-hidden="true" />
      <span>{label}</span>
      {score !== undefined && (
        <span className="font-mono text-[11px] opacity-80">({score}%)</span>
      )}
    </span>
  );
}

"use client";

import React from "react";
import { X } from "lucide-react";

interface FilterChipProps {
  label: string;
  value?: string | number;
  count?: number;
  isActive?: boolean;
  onToggle?: () => void;
  onClear?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FilterChip({
  label,
  value,
  count,
  isActive = false,
  onToggle,
  onClear,
  isLoading = false,
  disabled = false,
  className = "",
}: FilterChipProps) {
  if (isLoading) {
    return (
      <span className="inline-flex items-center h-8 px-3 rounded-full text-xs bg-slate-100 text-slate-400 animate-pulse border border-slate-200">
        <span className="w-12 h-3 bg-slate-300 rounded"></span>
      </span>
    );
  }

  const activeStyles = isActive
    ? "bg-blue-50 text-blue-800 border-blue-300 font-semibold shadow-xs"
    : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200 font-medium";

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs border transition-all cursor-pointer select-none focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${activeStyles} ${className}`}
      aria-pressed={isActive}
    >
      <span>{label}</span>
      {value && <span className="font-semibold text-blue-900">: {value}</span>}
      {count !== undefined && (
        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? "bg-blue-200 text-blue-900" : "bg-slate-100 text-slate-600"}`}>
          {count}
        </span>
      )}
      {isActive && onClear && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="p-0.5 rounded-full hover:bg-blue-200 text-blue-800 transition-colors"
          title="Clear filter"
          aria-label={`Clear ${label} filter`}
        >
          <X className="w-3 h-3" />
        </span>
      )}
    </button>
  );
}

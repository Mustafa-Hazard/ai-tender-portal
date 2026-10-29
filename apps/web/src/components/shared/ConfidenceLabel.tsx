"use client";

import React from "react";
import { Sparkles, AlertTriangle, HelpCircle } from "lucide-react";

interface ConfidenceLabelProps {
  confidence?: number | null; // 0.0 to 1.0 or 0 to 100
  isAiGenerated?: boolean;
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  citationCount?: number;
  className?: string;
}

export function ConfidenceLabel({
  confidence,
  isAiGenerated = true,
  isLoading = false,
  isEmpty = false,
  isError = false,
  citationCount,
  className = "",
}: ConfidenceLabelProps) {
  if (isLoading) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-slate-400 animate-pulse ${className}`}>
        <Sparkles className="w-3 h-3 text-slate-300" />
        Estimating confidence...
      </span>
    );
  }

  if (isError) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-red-600 font-medium ${className}`}>
        <AlertTriangle className="w-3 h-3" />
        Confidence calc error
      </span>
    );
  }

  if (isEmpty || confidence === null || confidence === undefined) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-slate-500 font-medium ${className}`}>
        <HelpCircle className="w-3 h-3 text-slate-400" />
        Manual origin
      </span>
    );
  }

  const scorePct = confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence);

  let badgeColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
  let label = "High Confidence";

  if (scorePct < 70) {
    badgeColor = "text-red-700 bg-red-50 border-red-200";
    label = "Low Confidence (Review Queue)";
  } else if (scorePct < 85) {
    badgeColor = "text-amber-700 bg-amber-50 border-amber-200";
    label = "Medium Confidence";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${badgeColor} ${className}`}
      title={`AI Confidence Score: ${scorePct}% based on source document extraction`}
    >
      {isAiGenerated && <Sparkles className="w-3 h-3" aria-hidden="true" />}
      <span>{label}</span>
      <span className="font-mono text-[11px] font-bold">({scorePct}%)</span>
      {citationCount !== undefined && citationCount > 0 && (
        <span className="text-[10px] bg-white/70 px-1 rounded ml-0.5">
          {citationCount} {citationCount === 1 ? "ref" : "refs"}
        </span>
      )}
    </span>
  );
}

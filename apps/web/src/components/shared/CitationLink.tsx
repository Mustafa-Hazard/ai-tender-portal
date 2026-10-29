"use client";

import React from "react";
import { ExternalLink, FileText, AlertCircle, Bookmark } from "lucide-react";

interface CitationLinkProps {
  documentName?: string;
  page?: number | string;
  section?: string;
  fullCitation?: string;
  onClick?: () => void;
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  className?: string;
}

export function CitationLink({
  documentName,
  page,
  section,
  fullCitation,
  onClick,
  isLoading = false,
  isEmpty = false,
  isError = false,
  className = "",
}: CitationLinkProps) {
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-400 animate-pulse border border-slate-200">
        <Bookmark className="w-3 h-3 text-slate-300" />
        Resolving citation...
      </span>
    );
  }

  if (isError) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-50 text-red-700 border border-red-200 font-medium">
        <AlertCircle className="w-3 h-3" />
        Unresolved citation
      </span>
    );
  }

  if (isEmpty || (!documentName && !fullCitation)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-500 border border-slate-200 font-medium">
        <span>Manual origin</span>
      </span>
    );
  }

  const displayText =
    fullCitation ||
    `${documentName || "Document"}${page ? `, p.${page}` : ""}${section ? ` (${section})` : ""}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-blue-50/80 hover:bg-blue-100 text-blue-900 border border-blue-200 hover:border-blue-300 transition-colors cursor-pointer text-left group ${className}`}
      title={`Click to view verified source citation: ${displayText}`}
    >
      <FileText className="w-3.5 h-3.5 text-blue-700 shrink-0" />
      <span className="truncate max-w-[260px]">{displayText}</span>
      <ExternalLink className="w-3 h-3 text-blue-500 group-hover:text-blue-700 shrink-0 ml-0.5" />
    </button>
  );
}

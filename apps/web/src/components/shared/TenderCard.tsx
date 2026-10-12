"use client";

import React from "react";
import { Calendar, Building, AlertTriangle, ShieldAlert, ArrowRight, FileCheck } from "lucide-react";
import { StatusPill } from "./StatusPill";
import { SourceBadge } from "./SourceBadge";

export interface TenderCardData {
  id: string;
  title: string;
  buyerName?: string | null;
  referenceNumber?: string | null;
  category?: string | null;
  country?: string | null;
  city?: string | null;
  estimatedValue?: number | string | null;
  currency?: string | null;
  deadlineAt?: string | null;
  deadlineTimezone?: string | null;
  lifecycleStatus: "open" | "amended" | "closed" | "cancelled" | "unknown";
  sourceName?: string;
  fitScore?: number | null;
  mandatoryEligibility: "potentially_eligible" | "not_eligible" | "undetermined";
  submissionReadiness?: "ready_to_submit" | "blocked" | "in_progress";
  isStale?: boolean;
  unresolvedFields?: string[];
  isAmended?: boolean;
}

interface TenderCardProps {
  tender?: TenderCardData;
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onSelect?: (id: string) => void;
  onEvaluate?: (id: string) => void;
  className?: string;
}

export function TenderCard({
  tender,
  isLoading = false,
  isEmpty = false,
  isError = false,
  errorMessage = "Unable to load opportunity details",
  onSelect,
  onEvaluate,
  className = "",
}: TenderCardProps) {
  if (isLoading) {
    return (
      <div className={`p-5 bg-white rounded-lg border border-slate-200 shadow-xs animate-pulse ${className}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="w-1/3 h-4 bg-slate-200 rounded"></div>
          <div className="w-20 h-5 bg-slate-200 rounded-full"></div>
        </div>
        <div className="w-3/4 h-6 bg-slate-200 rounded mb-3"></div>
        <div className="w-1/2 h-4 bg-slate-100 rounded mb-4"></div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <div className="w-24 h-4 bg-slate-200 rounded"></div>
          <div className="w-28 h-4 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`p-5 bg-red-50 rounded-lg border border-red-200 text-red-900 ${className}`}>
        <div className="flex items-center gap-2 mb-2 font-semibold">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>Error loading tender</span>
        </div>
        <p className="text-xs text-red-700 mb-3">{errorMessage}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-xs font-medium text-red-800 underline hover:no-underline"
        >
          Retry request
        </button>
      </div>
    );
  }

  if (isEmpty || !tender) {
    return (
      <div className={`p-8 bg-white rounded-lg border border-dashed border-slate-300 text-center ${className}`}>
        <FileCheck className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <h4 className="text-sm font-semibold text-slate-700">No tenders available</h4>
        <p className="text-xs text-slate-500 mt-1">Adjust search parameters or upload a new RFP document.</p>
      </div>
    );
  }

  // Format currency deterministically
  const formattedBudget =
    tender.estimatedValue && tender.currency
      ? `${tender.currency} ${Number(tender.estimatedValue).toLocaleString("en-PK")}`
      : "Not stated";

  // Format deadline with timezones
  const formattedDeadline = tender.deadlineAt
    ? `${new Date(tender.deadlineAt).toLocaleDateString("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })} (${tender.deadlineTimezone || "PKT"})`
    : "Not stated";

  return (
    <div
      className={`p-5 bg-white rounded-lg border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${className}`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <SourceBadge name={tender.sourceName || "Federal Procurement"} isFictional={true} />
            {tender.lifecycleStatus === "amended" && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-700" />
                CORRIGENDUM ISSUED
              </span>
            )}
            {tender.isStale && (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                Stale Feed
              </span>
            )}
          </div>
          {/* Distinct Status Indicators per Rule 4 */}
          <div className="flex items-center gap-1.5">
            {tender.fitScore !== undefined && tender.fitScore !== null && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200" title="Statistical fit based on company profile">
                Fit: {tender.fitScore}%
              </span>
            )}
            <StatusPill
              category="eligibility"
              label={
                tender.mandatoryEligibility === "potentially_eligible"
                  ? "Potentially Eligible"
                  : tender.mandatoryEligibility === "not_eligible"
                  ? "Not Eligible"
                  : "Undetermined"
              }
            />
          </div>
        </div>

        {/* Title & Reference */}
        <h3
          onClick={() => onSelect && onSelect(tender.id)}
          className="text-base font-bold text-[#0b1c30] group-hover:text-[#0051d5] transition-colors cursor-pointer line-clamp-2 mb-1.5"
        >
          {tender.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mb-4 font-medium">
          <span className="flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[220px]">{tender.buyerName || "Not stated"}</span>
          </span>
          <span className="font-mono text-slate-500">
            Ref: {tender.referenceNumber || "Not stated"}
          </span>
        </div>
      </div>

      {/* Meta Grid & Action Footer */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Estimated Value</span>
            <span className={`font-semibold ${tender.estimatedValue ? "text-slate-900 font-mono" : "text-slate-500 italic"}`}>
              {formattedBudget}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Submission Deadline</span>
            <span className={`font-semibold flex items-center gap-1 ${tender.deadlineAt ? "text-slate-900" : "text-slate-500 italic"}`}>
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{formattedDeadline}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {tender.mandatoryEligibility === "not_eligible" ? (
            <span className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Eligibility Blocker
            </span>
          ) : (
            <span className="text-xs text-slate-500">
              {tender.category || "General Procurement"}
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEvaluate && onEvaluate(tender.id)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#0051d5] hover:bg-[#0041ab] text-white transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <span>Evaluate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

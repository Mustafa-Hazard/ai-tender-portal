"use client";

import React, { useState } from "react";
import { Sparkles, UserCheck } from "lucide-react";
import { CitationLink } from "./CitationLink";

export interface RequirementData {
  id: string;
  code: string;
  category: string;
  kind: "mandatory" | "scored";
  originalText: string;
  citation?: string;
  aiStatus: "meets_requirement" | "partially_meets" | "does_not_meet" | "missing_evidence" | "needs_interpretation" | "not_applicable";
  reviewerStatus: "unreviewed" | "meets_requirement" | "partially_meets" | "does_not_meet" | "not_applicable";
  evidenceTitle?: string;
  evidenceIsExpired?: boolean;
  notApplicableJustification?: string;
}

interface RequirementRowProps {
  req?: RequirementData;
  onUpdateStatus?: (status: string, justification?: string) => void;
  onViewCitation?: () => void;
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  className?: string;
}

export function RequirementRow({
  req,
  onUpdateStatus,
  onViewCitation,
  isLoading = false,
  isEmpty = false,
  isError = false,
  className = "",
}: RequirementRowProps) {
  const [justification, setJustification] = useState(req?.notApplicableJustification || "");
  const [showJustificationPrompt, setShowJustificationPrompt] = useState(false);

  if (isLoading) {
    return (
      <tr className="animate-pulse border-b border-slate-200">
        <td className="p-3"><div className="w-16 h-4 bg-slate-200 rounded"></div></td>
        <td className="p-3"><div className="w-48 h-4 bg-slate-200 rounded"></div></td>
        <td className="p-3"><div className="w-20 h-4 bg-slate-200 rounded"></div></td>
        <td className="p-3"><div className="w-24 h-4 bg-slate-200 rounded"></div></td>
      </tr>
    );
  }

  if (isError) {
    return (
      <tr className="bg-red-50 text-red-900 border-b border-red-200 text-xs">
        <td colSpan={5} className="p-3 font-medium">Failed to load requirement assessment.</td>
      </tr>
    );
  }

  if (isEmpty || !req) {
    return (
      <tr className="border-b border-slate-200 text-slate-500 text-xs">
        <td colSpan={5} className="p-4 text-center">No compliance requirements extracted.</td>
      </tr>
    );
  }

  const aiStatusColors = {
    meets_requirement: "bg-emerald-50 text-emerald-800 border-emerald-200",
    partially_meets: "bg-amber-50 text-amber-800 border-amber-200",
    does_not_meet: "bg-red-50 text-red-800 border-red-200",
    missing_evidence: "bg-purple-50 text-purple-800 border-purple-200",
    needs_interpretation: "bg-blue-50 text-blue-800 border-blue-200",
    not_applicable: "bg-slate-100 text-slate-700 border-slate-200",
  }[req.aiStatus];

  const aiLabels = {
    meets_requirement: "Meets",
    partially_meets: "Partial",
    does_not_meet: "Does Not Meet",
    missing_evidence: "Missing Vault Evidence",
    needs_interpretation: "Needs Interpretation",
    not_applicable: "Not Applicable",
  }[req.aiStatus];

  return (
    <tr className={`border-b border-slate-200 hover:bg-slate-50/80 transition-colors text-xs ${className}`}>
      {/* Code & Kind */}
      <td className="p-3 align-top font-mono font-bold text-slate-700 whitespace-nowrap">
        <div>{req.code}</div>
        <span
          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase mt-1 ${
            req.kind === "mandatory"
              ? "bg-red-100 text-red-800 border border-red-300"
              : "bg-blue-100 text-blue-800 border border-blue-300"
          }`}
        >
          {req.kind}
        </span>
      </td>

      {/* Requirement Text & Citation */}
      <td className="p-3 align-top max-w-md">
        <p className="text-slate-900 font-medium leading-relaxed mb-2">
          {req.originalText}
        </p>
        <CitationLink fullCitation={req.citation} onClick={onViewCitation} />

        {/* Linked Evidence Info */}
        {req.evidenceTitle && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-500">Pinned Evidence:</span>
            <span className={`font-semibold ${req.evidenceIsExpired ? "text-red-700 bg-red-50 px-1 rounded border border-red-200" : "text-emerald-800"}`}>
              {req.evidenceTitle} {req.evidenceIsExpired ? "[EXPIRED - BLOCKER]" : ""}
            </span>
          </div>
        )}
      </td>

      {/* AI Suggestion (Rule 6: Distinct from Human) */}
      <td className="p-3 align-top whitespace-nowrap">
        <div className="flex flex-col gap-1 items-start">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-500" />
            AI Suggestion
          </span>
          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${aiStatusColors}`}>
            {aiLabels}
          </span>
        </div>
      </td>

      {/* Human Verified Decision */}
      <td className="p-3 align-top whitespace-nowrap">
        <div className="flex flex-col gap-1 items-start">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-emerald-600" />
            Reviewer Decision
          </span>
          <select
            value={req.reviewerStatus}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "not_applicable") {
                setShowJustificationPrompt(true);
              } else {
                setShowJustificationPrompt(false);
                if (onUpdateStatus) { onUpdateStatus(val); }
              }
            }}
            className="h-7 text-xs bg-white border border-slate-300 rounded px-2 font-medium text-slate-800 focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="unreviewed">Unreviewed</option>
            <option value="meets_requirement">Verified: Meets</option>
            <option value="partially_meets">Partially Meets</option>
            <option value="does_not_meet">Does Not Meet</option>
            <option value="not_applicable">Not Applicable</option>
          </select>
        </div>

        {/* Mandatory Justification for N/A matching Rule 6 */}
        {showJustificationPrompt && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded max-w-xs">
            <label className="text-[10px] font-bold text-amber-900 block mb-1">
              Recorded Justification Required for N/A (Rule 6):
            </label>
            <input
              type="text"
              value={justification}
              placeholder="e.g. Buyer amendment waived in Addendum 1"
              onChange={(e) => setJustification(e.target.value)}
              className="w-full text-xs p-1 border border-amber-300 rounded bg-white text-slate-800 mb-1"
            />
            <button
              type="button"
              disabled={!justification.trim()}
              onClick={() => {
                setShowJustificationPrompt(false);
                if (onUpdateStatus) { onUpdateStatus("not_applicable", justification); }
              }}
              className="px-2 py-0.5 bg-amber-700 text-white rounded text-[10px] font-bold disabled:opacity-50 cursor-pointer"
            >
              Record N/A
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

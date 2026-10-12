"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, Clock, ShieldCheck, RefreshCw } from "lucide-react";

export interface ApprovalStep {
  id: string;
  flowType: "participation" | "technical" | "commercial" | "final";
  stepName: string;
  requiredRole: string;
  approverName?: string;
  status: "pending" | "approved" | "changes_requested" | "rejected" | "invalidated";
  decisionNotes?: string;
  decidedAt?: string;
  isInvalidated?: boolean;
}

interface ApprovalPanelProps {
  steps?: ApprovalStep[];
  canApprove?: boolean;
  onApprove?: (stepId: string, notes: string) => void;
  onRequestChanges?: (stepId: string, notes: string) => void;
  onReject?: (stepId: string, notes: string) => void;
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  className?: string;
}

export function ApprovalPanel({
  steps = [],
  canApprove = true,
  onApprove,
  onRequestChanges,
  onReject,
  isLoading = false,
  isEmpty = false,
  isError = false,
  className = "",
}: ApprovalPanelProps) {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  if (isLoading) {
    return (
      <div className={`p-4 bg-white border border-slate-200 rounded-lg animate-pulse ${className}`}>
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-16 bg-slate-100 rounded mb-2"></div>
        <div className="h-16 bg-slate-100 rounded"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`p-4 bg-red-50 text-red-800 text-xs rounded border border-red-200 ${className}`}>
        Failed to retrieve approval workflow hierarchy.
      </div>
    );
  }

  if (isEmpty || steps.length === 0) {
    return (
      <div className={`p-6 bg-white border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-500 ${className}`}>
        No approval requirements configured for this bid stage.
      </div>
    );
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden ${className}`}>
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Governance & Approval Matrix</span>
        </h4>
        <span className="text-[11px] text-slate-500 font-medium">Separation of Duties Enforced</span>
      </div>

      <div className="divide-y divide-slate-100">
        {steps.map((step) => {
          const statusBadge = {
            approved: (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Approved
              </span>
            ),
            pending: (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                Pending Review
              </span>
            ),
            changes_requested: (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-50 text-orange-800 border border-orange-200 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 text-orange-600" />
                Changes Requested
              </span>
            ),
            rejected: (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-800 border border-red-200 flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-600" />
                Rejected
              </span>
            ),
            invalidated: (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-900 border border-purple-300 flex items-center gap-1" title="Corrigendum issued after signoff (Rule 11)">
                <AlertCircle className="w-3 h-3 text-purple-700" />
                Invalidated by Amendment
              </span>
            ),
          }[step.status];

          return (
            <div key={step.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">{step.stepName}</h5>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Required Role: <span className="font-semibold text-slate-700 uppercase">{step.requiredRole.replace(/_/g, " ")}</span>
                  </span>
                </div>
                {statusBadge}
              </div>

              {step.decisionNotes && (
                <div className="p-2 bg-slate-50 rounded text-xs text-slate-700 my-2 border border-slate-200">
                  <span className="font-semibold text-slate-800">Approver Notes: </span>
                  {step.decisionNotes}
                </div>
              )}

              {step.status === "invalidated" && (
                <div className="p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-900 font-medium my-2">
                  <strong>Notice (Rule 11):</strong> Buyer tender corrigendum modified scope or deadline after approval. Prior signoff invalidated. Re-review required.
                </div>
              )}

              {step.status === "pending" && canApprove && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <input
                    type="text"
                    value={selectedStepId === step.id ? notes : ""}
                    onChange={(e) => {
                      setSelectedStepId(step.id);
                      setNotes(e.target.value);
                    }}
                    placeholder="Enter approval or change request notes..."
                    className="w-full text-xs p-2 border border-slate-300 rounded mb-2 bg-white text-slate-800"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onApprove && onApprove(step.id, notes)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                    >
                      Approve Step
                    </button>
                    <button
                      type="button"
                      onClick={() => onRequestChanges && onRequestChanges(step.id, notes)}
                      className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                    >
                      Request Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => onReject && onReject(step.id, notes)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

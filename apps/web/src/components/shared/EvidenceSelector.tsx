"use client";

import React from "react";
import { ShieldCheck, AlertTriangle, ChevronDown } from "lucide-react";

export interface VaultEvidenceItem {
  id: string;
  title: string;
  docType: string;
  version: number;
  issuer?: string;
  expiresOn?: string | null;
  isExpired: boolean;
  approvalState: "approved" | "pending" | "rejected" | "expired";
}

interface EvidenceSelectorProps {
  evidenceList?: VaultEvidenceItem[];
  selectedEvidenceId?: string | null;
  onSelectEvidence?: (id: string) => void;
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  className?: string;
}

export function EvidenceSelector({
  evidenceList = [],
  selectedEvidenceId,
  onSelectEvidence,
  isLoading = false,
  isEmpty = false,
  isError = false,
  className = "",
}: EvidenceSelectorProps) {
  if (isEmpty || evidenceList.length === 0) {
    return (
      <div className={`p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500 text-center ${className}`}>
        No evidence documents available in vault.
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className={`h-10 bg-slate-100 rounded border border-slate-200 animate-pulse ${className}`}></div>
    );
  }

  if (isError) {
    return (
      <div className={`p-2 bg-red-50 text-red-800 text-xs border border-red-200 rounded ${className}`}>
        Failed to load evidence vault items.
      </div>
    );
  }

  const selectedItem = evidenceList.find((e) => e.id === selectedEvidenceId);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="relative">
        <select
          value={selectedEvidenceId || ""}
          onChange={(e) => onSelectEvidence && onSelectEvidence(e.target.value)}
          className="w-full h-9 pl-3 pr-8 text-xs bg-white border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 appearance-none cursor-pointer"
        >
          <option value="">-- Link Document from Company Vault --</option>
          {evidenceList.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} (v{item.version}) {item.isExpired ? " [EXPIRED!]" : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
      </div>

      {/* Selected Item Expiry Status Warning matching Rule 7 */}
      {selectedItem && (
        <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded border bg-slate-50">
          <div className="flex items-center gap-1.5 truncate">
            {selectedItem.isExpired ? (
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            )}
            <span className="truncate font-medium text-slate-700">
              {selectedItem.docType} (v{selectedItem.version})
            </span>
          </div>

          <div>
            {selectedItem.isExpired ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                <span>EXPIRED: {selectedItem.expiresOn}</span>
              </span>
            ) : selectedItem.expiresOn ? (
              <span className="text-[11px] text-slate-500">
                Valid to: {selectedItem.expiresOn}
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">No expiry date</span>
            )}
          </div>
        </div>
      )}

      {selectedItem?.isExpired && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-900 font-medium">
          <strong>Disqualification Risk (Rule 7):</strong> Expired evidence cannot satisfy mandatory requirements. Upload a renewed certificate.
        </div>
      )}
    </div>
  );
}

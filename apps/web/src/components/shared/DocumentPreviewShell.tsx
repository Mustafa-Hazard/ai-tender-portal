"use client";

import React, { useState } from "react";
import { Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText, AlertCircle, Bookmark } from "lucide-react";

interface DocumentPreviewShellProps {
  filename?: string;
  versionNumber?: number;
  totalPages?: number;
  currentPage?: number;
  highlightedSection?: string;
  highlightedExcerpt?: string;
  sha256?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  onDownload?: () => void;
  className?: string;
}

export function DocumentPreviewShell({
  filename = "Tender_Specification_RFP.pdf",
  versionNumber = 1,
  totalPages = 48,
  currentPage: initialPage = 14,
  highlightedSection = "Clause 4.1 — Mandatory Legal Eligibility",
  highlightedExcerpt = "The bidder must be on Active Taxpayers List (ATL) of FBR with valid NTN and STRN certificates at the time of bid submission. Proof of active status must be appended to Envelope A (Technical).",
  sha256 = "a1b2c3d4e5f60000111122223333444455556666777788889999aaaabbbbcccc",
  isLoading = false,
  isEmpty = false,
  isError = false,
  onDownload,
  className = "",
}: DocumentPreviewShellProps) {
  const [page, setPage] = useState(initialPage);
  const [zoom, setZoom] = useState(100);

  if (isLoading) {
    return (
      <div className={`flex flex-col h-full bg-slate-50 border border-slate-200 rounded-lg p-6 animate-pulse ${className}`}>
        <div className="h-10 bg-slate-200 rounded mb-4"></div>
        <div className="flex-1 bg-slate-200 rounded mb-4"></div>
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`p-8 bg-red-50 border border-red-200 rounded-lg text-center ${className}`}>
        <AlertCircle className="w-8 h-8 mx-auto text-red-600 mb-2" />
        <h4 className="text-sm font-semibold text-red-900">Document failed to load</h4>
        <p className="text-xs text-red-700 mt-1">Unable to retrieve PDF blob from object storage. Verify tenant permissions.</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={`p-12 bg-white border border-dashed border-slate-300 rounded-lg text-center ${className}`}>
        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <h4 className="text-sm font-semibold text-slate-700">No Document Attached</h4>
        <p className="text-xs text-slate-500 mt-1">Upload an RFP document or corrigendum notice to enable citation deep-linking.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden ${className}`}>
      {/* Document Top Bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#0051d5]" />
          <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]" title={filename}>
            {filename}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
            v{versionNumber}
          </span>
        </div>

        {/* Zoom & Page Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-slate-200 rounded bg-white px-1 py-0.5 text-xs">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
              title="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs px-1">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
              title="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-0.5 border border-slate-200 rounded bg-white px-1 py-0.5 text-xs">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="p-1 hover:bg-slate-100 rounded cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] px-1">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="p-1 hover:bg-slate-100 rounded cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onDownload}
            className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded bg-white hover:bg-slate-50 cursor-pointer"
            title="Download original file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Simulated Document Canvas with Citation Highlight */}
      <div className="p-6 bg-slate-100/70 overflow-auto flex-1 flex justify-center min-h-[360px]">
        <div
          className="bg-white border border-slate-300 shadow-md p-8 max-w-xl w-full text-xs text-slate-800 leading-relaxed font-serif relative"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
        >
          <div className="text-[10px] font-mono text-slate-400 border-b border-slate-200 pb-2 mb-4 flex justify-between">
            <span>FEDERAL TEACHING HOSPITAL — TENDER SPECIFICATION</span>
            <span>PAGE {page} OF {totalPages}</span>
          </div>

          <p className="text-slate-500 mb-3 text-[11px]">
            SECTION II: INSTRUCTIONS TO BIDDERS & MANDATORY QUALIFICATION CRITERIA
          </p>

          {/* Highlighted Citation Box matching Rule 2 */}
          <div className="p-3 bg-amber-50/90 border-l-4 border-amber-500 rounded-r my-4 shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 mb-1">
              <Bookmark className="w-3 h-3 text-amber-700" />
              <span>[VERIFIED CITATION] {highlightedSection}</span>
            </div>
            <p className="text-slate-900 font-sans font-medium leading-normal bg-yellow-100/60 p-1.5 rounded">
              {highlightedExcerpt}
            </p>
          </div>

          <p className="text-slate-600 mb-2">
            4.2 Financial Turnover: The procuring agency requires evidence of annual audited statements for the last three consecutive fiscal years proving average liquidity...
          </p>
          <p className="text-slate-600 mb-2">
            4.3 Manufacturer Authorization: Direct manufacturer representation authorization (Form Tech-3) must be executed on judicial stamp paper...
          </p>

          <div className="mt-8 pt-4 border-t border-slate-200 text-[9px] font-mono text-slate-400 flex justify-between">
            <span>SHA256: {sha256.slice(0, 24)}...</span>
            <span>PROVENANCE: OCR Extracted (100% confidence)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

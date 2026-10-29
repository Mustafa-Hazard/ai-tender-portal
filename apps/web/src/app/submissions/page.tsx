"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileCheck,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ShieldCheck,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { AppLayout } from "../../components/layout/AppLayout";
import { StatusPill } from "../../components/shared/StatusPill";
import { useTenant } from "../../context/TenantContext";

export default function SubmissionsArchivePage() {
  const { activeOrg } = useTenant();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const submissions = [
    {
      id: "sub-1",
      submissionRef: "SUB-ME-PUNJAB-2026-0491-01",
      tenderTitle: "Procurement of High-End ICU Ventilators & Patient Monitors",
      tenderRef: "ME/PUNJAB/2026/0491",
      client: "Specialized Healthcare & Medical Education Department, Punjab",
      submittedBy: "Mustafa Muhammad (CEO)",
      submittedAt: "2026-10-17 11:30 UTC",
      contractValue: "PKR 59,000,000",
      bidBondAmount: "PKR 1,180,000 (2%)",
      sha256Hash: "ef764a6b272e5ce854f2d7c86c03cd6cb01a7745dc8457a24f824f46a5b37201",
      status: "submitted",
    },
  ];

  const handleCopyHash = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <FileCheck className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Submitted Bids & Audit Archive</h1>
                <p className="text-sm text-slate-500">
                  Immutable submission dossier registry for {activeOrg?.name || "Apex Healthcare Technologies"}. All submissions sealed with SHA-256 cryptographic signatures.
                </p>
              </div>
            </div>
          </div>
          <div>
            <Link
              href="/participation"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Pipeline
            </Link>
          </div>
        </div>

        {submissions.map((sub) => (
          <div key={sub.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
                    {sub.submissionRef}
                  </span>
                  <StatusPill label="SUBMITTED & SEALED" variant="success" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-2">{sub.tenderTitle}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authority: {sub.client} • Tender Ref: {sub.tenderRef}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors">
                  <Download className="w-4 h-4" /> Download Official Submission Package (.zip)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Commercial Bid</span>
                <span className="font-bold text-slate-900 text-sm font-mono mt-0.5 block">{sub.contractValue}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Mandatory 2% Bid Bond</span>
                <span className="font-bold text-emerald-700 text-sm font-mono mt-0.5 block">{sub.bidBondAmount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Signatory Authorizer</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{sub.submittedBy}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Timestamp (UTC)</span>
                <span className="font-bold text-slate-900 text-sm font-mono mt-0.5 block">{sub.submittedAt}</span>
              </div>
            </div>

            {/* Cryptographic SHA-256 Manifest Box */}
            <div className="p-4 bg-slate-900 rounded-xl text-white space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Cryptographic SHA-256 Submission Seal</span>
                </div>
                <button
                  onClick={() => handleCopyHash(sub.sha256Hash, sub.id)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  {copiedId === sub.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === sub.id ? "Copied" : "Copy Hash"}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-emerald-400 break-all bg-black/40 p-2.5 rounded border border-slate-800">
                {sub.sha256Hash}
              </div>
              <p className="text-[11px] text-slate-400">
                This tamper-proof cryptographic fingerprint seals the technical narrative, decimal pricing schedule, compliance matrix, and attached evidence certificates into an auditable record.
              </p>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}

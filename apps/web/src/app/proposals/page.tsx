"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FileEdit, ArrowRight } from "lucide-react";
import { StatusPill } from "../../components/shared/StatusPill";
import { useTenant } from "../../context/TenantContext";
import { api } from "../../lib/api";

export default function ProposalsDirectoryPage() {
  const { activeOrg } = useTenant();

  const [proposals, setProposals] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    api.getBids(activeOrg.id)
      .then((bids) => {
        if (!cancelled && Array.isArray(bids)) {
          const mapped = bids.map((b: any) => ({
            id: String(b.id),
            title: `Proposal for ${b.tender_title || "Tender"}`,
            tenderTitle: b.tender_title || "Tender Opportunity",
            tenderRef: b.tender_ref || "REF-NOT-STATED",
            client: b.buyer_name || b.client || "Procuring Authority",
            contractValue: `PKR ${Number(b.potential_contract_value || 0).toLocaleString()}`,
            deadline: b.internal_deadline ? String(b.internal_deadline).split("T")[0] : "2026-10-28",
            progress: b.stage === "submitted" ? 100 : b.stage === "preparing" ? 75 : 45,
            readinessState: b.stage === "submitted" ? "submitted" : b.stage === "preparing" ? "ready_to_submit" : "in_progress",
            technicalLead: "Lead Bid Representative",
          }));
          setProposals(mapped);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [activeOrg.id]);

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <FileEdit className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Proposal Preparation Workspaces</h1>
                <p className="text-sm text-slate-500">
                  Draft technical narratives, compile commercial pricing schedules (Rule 8 decimal arithmetic), and manage multi-role approvals.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {proposals.map((p) => (
            <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs font-bold text-slate-500">{p.tenderRef}</span>
                <StatusPill
                  label={p.readinessState.replace(/_/g, " ").toUpperCase()}
                  variant={p.readinessState === "ready_to_submit" ? "success" : "warning"}
                />
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm">{p.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">Tender: {p.tenderTitle}</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Proposal Completion</span>
                  <span>{p.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${p.progress}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Commercial Total</span>
                  <span className="font-bold text-slate-900">{p.contractValue}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Submission Target</span>
                  <span className="font-bold text-slate-900">{p.deadline}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Lead: {p.technicalLead}</span>
                <Link
                  href={`/proposals/${p.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Open Editor & Pricing <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
  );
}

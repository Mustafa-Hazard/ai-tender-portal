"use client";

import React from "react";
import Link from "next/link";
import { FileEdit, Building, Calendar, DollarSign, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { AppLayout } from "../../components/layout/AppLayout";
import { StatusPill } from "../../components/shared/StatusPill";
import { useTenant } from "../../context/TenantContext";

export default function ProposalsDirectoryPage() {
  const { activeOrg } = useTenant();

  const proposals = [
    {
      id: "aaaaaaaa-bbbb-cccc-dddd-111111111111",
      title: "Comprehensive Proposal for ICU Ventilators & Central Monitors",
      tenderTitle: "Procurement of High-End ICU Ventilators & Patient Monitors",
      tenderRef: "ME/PUNJAB/2026/0491",
      client: "Specialized Healthcare & Medical Education Department, Punjab",
      contractValue: "PKR 59,000,000",
      deadline: "2026-10-28",
      progress: 85,
      readinessState: "ready_to_submit",
      technicalLead: "Dr. Tariq Mahmood",
    },
    {
      id: "bbbbbbbb-cccc-dddd-eeee-222222222222",
      title: "Municipal Cloud ERP Implementation Proposal",
      tenderTitle: "Enterprise Cloud Migration & Municipal ERP Datacenter Modernization",
      tenderRef: "ERP/KHI/2026/8812",
      client: "Sindh Local Government & Municipal Information Systems Directorate",
      contractValue: "PKR 85,000,000",
      deadline: "2026-11-05",
      progress: 40,
      readinessState: "in_progress",
      technicalLead: "Zeeshan Ali",
    },
  ];

  return (
    <AppLayout>
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
    </AppLayout>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Building,
  DollarSign,
  UserCheck,
  ArrowRight,
  FileText,
  AlertOctagon,
  RefreshCw,
  Check,
  X,
} from "lucide-react";
import { AppLayout } from "../../components/layout/AppLayout";
import { StatusPill } from "../../components/shared/StatusPill";
import { useTenant } from "../../context/TenantContext";

interface ApprovalTask {
  id: string;
  bidId: string;
  tenderTitle: string;
  tenderRef: string;
  client: string;
  contractValue: string;
  stepName: string;
  flowType: "technical" | "commercial" | "legal_compliance" | "final";
  requiredRole: string;
  status: "pending" | "approved" | "changes_requested" | "rejected" | "invalidated";
  deadline: string;
}

const INITIAL_APPROVALS: ApprovalTask[] = [
  {
    id: "app-1",
    bidId: "aaaaaaaa-bbbb-cccc-dddd-111111111111",
    tenderTitle: "Procurement of High-End ICU Ventilators & Patient Monitors",
    tenderRef: "ME/PUNJAB/2026/0491",
    client: "Specialized Healthcare & Medical Education Department, Punjab",
    contractValue: "PKR 59,000,000",
    stepName: "Executive & CEO Final Submission Authorization",
    flowType: "final",
    requiredRole: "approver (CEO)",
    status: "pending",
    deadline: "2026-10-26",
  },
  {
    id: "app-2",
    bidId: "bbbbbbbb-cccc-dddd-eeee-222222222222",
    tenderTitle: "Enterprise Cloud Migration & Municipal ERP Datacenter Modernization",
    tenderRef: "ERP/KHI/2026/8812",
    client: "Sindh Local Government & Municipal Information Systems Directorate",
    contractValue: "PKR 85,000,000",
    stepName: "Commercial Schedule & Margin Verification (Rule 8)",
    flowType: "commercial",
    requiredRole: "finance_contributor (CFO)",
    status: "pending",
    deadline: "2026-11-02",
  },
  {
    id: "app-3",
    bidId: "aaaaaaaa-bbbb-cccc-dddd-111111111111",
    tenderTitle: "Procurement of High-End ICU Ventilators & Patient Monitors",
    tenderRef: "ME/PUNJAB/2026/0491",
    client: "Specialized Healthcare & Medical Education Department, Punjab",
    contractValue: "PKR 59,000,000",
    stepName: "Mandatory Vault Credentials & Regulatory Audit (Rule 7)",
    flowType: "legal_compliance",
    requiredRole: "compliance_reviewer",
    status: "approved",
    deadline: "2026-10-24",
  },
  {
    id: "app-4",
    bidId: "aaaaaaaa-bbbb-cccc-dddd-111111111111",
    tenderTitle: "Procurement of High-End ICU Ventilators & Patient Monitors",
    tenderRef: "ME/PUNJAB/2026/0491",
    client: "Specialized Healthcare & Medical Education Department, Punjab",
    contractValue: "PKR 59,000,000",
    stepName: "Technical Specifications & Scope Sign-off",
    flowType: "technical",
    requiredRole: "technical_contributor",
    status: "approved",
    deadline: "2026-10-22",
  },
];

export default function ApprovalsPage() {
  const { activeOrg } = useTenant();
  const [approvals, setApprovals] = useState<ApprovalTask[]>(INITIAL_APPROVALS);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<ApprovalTask | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [actionError, setActionError] = useState("");

  const pendingCount = approvals.filter((a) => a.status === "pending").length;
  const approvedCount = approvals.filter((a) => a.status === "approved").length;

  const filtered = approvals.filter((a) => {
    if (activeTab === "pending") return a.status === "pending";
    if (activeTab === "approved") return a.status === "approved";
    if (activeTab === "commercial") return a.flowType === "commercial";
    if (activeTab === "technical") return a.flowType === "technical";
    return true;
  });

  const handleOpenAction = (task: ApprovalTask, action: "approve" | "reject") => {
    setSelectedTask(task);
    setActionType(action);
    setNotesInput(action === "approve" ? "Verified and authorized for tender submission package." : "");
    setActionError("");
  };

  const handleConfirmAction = () => {
    if (!notesInput.trim() || notesInput.trim().length < 3) {
      setActionError("Please provide audit notes (minimum 3 characters).");
      return;
    }

    if (selectedTask && actionType) {
      setApprovals(
        approvals.map((a) =>
          a.id === selectedTask.id
            ? { ...a, status: actionType === "approve" ? "approved" : "changes_requested" }
            : a
        )
      );
    }
    setSelectedTask(null);
    setActionType(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Multi-Role Approval Center</h1>
                <p className="text-sm text-slate-500">
                  Governance gate for {activeOrg?.name || "Apex Healthcare Technologies"}. Review and authorize bid submissions with immutable audit logging.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/submissions"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              View Submitted Archive <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awaiting Sign-off</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</div>
            <div className="text-xs text-slate-500 mt-1">Requires authorized role review</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Approved Sign-offs</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{approvedCount}</div>
            <div className="text-xs text-emerald-600 mt-1">Cleared in audit log</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Invalidation Safeguard</div>
            <div className="text-2xl font-bold text-blue-700 mt-1">Active</div>
            <div className="text-xs text-slate-500 mt-1">Proposal changes reset downstream steps</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Audit Defense</div>
            <div className="text-2xl font-bold text-purple-700 mt-1">SHA-256</div>
            <div className="text-xs text-purple-600 mt-1">Cryptographic integrity seals</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {[
            { id: "all", label: "All Sign-offs" },
            { id: "pending", label: `Pending Review (${pendingCount})` },
            { id: "approved", label: "Approved" },
            { id: "commercial", label: "Commercial Only" },
            { id: "technical", label: "Technical Only" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Approvals Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Tender Opportunity</th>
                  <th className="py-3 px-4">Approval Gate Step</th>
                  <th className="py-3 px-4">Required Signatory</th>
                  <th className="py-3 px-4">Target Value</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 leading-snug">{item.tenderTitle}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.tenderRef} • {item.client}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{item.stepName}</span>
                      <span className="block text-[10px] text-slate-400 uppercase font-mono mt-0.5">{item.flowType}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" /> {item.requiredRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{item.contractValue}</td>
                    <td className="py-3.5 px-4">
                      <StatusPill
                        label={item.status.replace(/_/g, " ").toUpperCase()}
                        variant={item.status === "approved" ? "success" : item.status === "pending" ? "warning" : "danger"}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenAction(item, "approve")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded shadow-sm transition-colors"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => handleOpenAction(item, "reject")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 text-[11px] font-semibold rounded border border-slate-200 transition-colors"
                          >
                            <X className="w-3 h-3" /> Changes
                          </button>
                        </div>
                      ) : (
                        <Link
                          href={`/proposals/${item.bidId}`}
                          className="text-blue-600 hover:underline font-semibold text-[11px]"
                        >
                          View Dossier
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Modal */}
        {selectedTask && actionType && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className={`p-2 rounded-lg ${actionType === "approve" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {actionType === "approve" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {actionType === "approve" ? "Authorize Sign-Off" : "Request Proposal Modifications"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedTask.stepName}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-600">
                  {actionType === "approve"
                    ? "By approving, you certify that all parameters have been reviewed according to corporate and regulatory compliance standards. This action is permanently recorded in the immutable audit ledger."
                    : "Requesting changes will flag this step and automatically invalidate any downstream approvals to ensure all modifications undergo re-verification."}
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Audit Notes & Rationale
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter audit rationale..."
                    value={notesInput}
                    onChange={(e) => {
                      setNotesInput(e.target.value);
                      setActionError("");
                    }}
                    className="w-full mt-1.5 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {actionError && <p className="text-xs text-red-600 mt-1">{actionError}</p>}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors ${
                    actionType === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Confirm Sign-Off
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

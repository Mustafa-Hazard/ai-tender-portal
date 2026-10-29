"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileCheck2,
  Plus,
  ArrowRight,
  ShieldAlert,
  Building,
  FolderLock,
  Layers,
} from "lucide-react";
import { useTenant } from "../context/TenantContext";
import { TenderCard, TenderCardData } from "../components/shared/TenderCard";
import { FilterChip } from "../components/shared/FilterChip";
import { Timeline, TimelineMilestone } from "../components/shared/Timeline";

export default function DashboardPage() {
  const { activeOrg, currentRole, uiState, setUiState } = useTenant();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Sample Tenders matching Scenarios A, B, and C
  const sampleTenders: TenderCardData[] = [
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      title: "Procurement of High-End ICU Ventilators & Patient Monitors (Sample Fictional Data)",
      buyerName: "Federal Teaching Hospital Islamabad",
      referenceNumber: "FTH-ICU-2026-088",
      category: "Medical Equipment",
      country: "PK",
      city: "Islamabad",
      estimatedValue: 175000000,
      currency: "PKR",
      deadlineAt: "2026-11-01T14:00:00+05:00",
      deadlineTimezone: "Asia/Karachi",
      lifecycleStatus: "open",
      sourceName: "Federal EPADS Portal",
      fitScore: 94,
      mandatoryEligibility: "potentially_eligible",
      submissionReadiness: "in_progress",
      isStale: false,
    },
    {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      title: "Enterprise Cloud Migration & Municipal ERP Datacenter Modernization (Sample Fictional Data)",
      buyerName: "Punjab Municipal Development Fund Company",
      referenceNumber: "PMDFC-CLOUD-2026-012",
      category: "Information Technology",
      country: "PK",
      city: "Lahore",
      estimatedValue: 85000000,
      currency: "PKR",
      deadlineAt: "2026-11-06T15:00:00+05:00",
      deadlineTimezone: "Asia/Karachi",
      lifecycleStatus: "open",
      sourceName: "Punjab PPRA Portal",
      fitScore: 88, // High fit score
      mandatoryEligibility: "not_eligible", // Disqualification risk! High fit does NOT hide failure!
      submissionReadiness: "blocked",
      isStale: false,
    },
    {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      title: "Supply of 100 Heavy-Duty All-Terrain Logistics Trucks (Sample Fictional Data)",
      buyerName: "National Disaster Management Authority (NDMA)",
      referenceNumber: "NDMA-FLEET-2026-05",
      category: "Vehicles & Heavy Equipment",
      country: "PK",
      city: "Islamabad",
      estimatedValue: 850000000,
      currency: "PKR",
      deadlineAt: "2026-10-24T12:00:00+05:00",
      deadlineTimezone: "Asia/Karachi",
      lifecycleStatus: "amended", // Corrigendum issued
      sourceName: "Federal EPADS Portal",
      fitScore: 85,
      mandatoryEligibility: "potentially_eligible",
      submissionReadiness: "in_progress",
      isAmended: true,
      isStale: false,
    },
    {
      id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      title: "Establishment of Smart Laboratory Diagnostic Center (Sample Fictional Data)",
      buyerName: "Services Hospital Lahore",
      referenceNumber: "SHL-LAB-2026",
      category: "Healthcare Infrastructure",
      country: "PK",
      city: "Lahore",
      estimatedValue: null, // "Not stated" per Rule 1
      currency: null,
      deadlineAt: null, // "Not stated" per Rule 1
      deadlineTimezone: null,
      lifecycleStatus: "open",
      sourceName: "Punjab PPRA Portal",
      fitScore: 78,
      mandatoryEligibility: "undetermined",
      submissionReadiness: "in_progress",
      unresolvedFields: ["estimated_value", "deadline_at"],
      isStale: true,
    },
  ];

  const milestones: TimelineMilestone[] = [
    {
      id: "m-1",
      title: "Pre-Bid Clarification Meeting (ICU Ventilators)",
      dateStr: "18 Oct 2026, 11:00 AM",
      timezone: "PKT",
      status: "current",
      description: "Mandatory pre-bid conference via Zoom. Technical query submissions due.",
    },
    {
      id: "m-2",
      title: "Bid Security Bank Guarantee Issuance",
      dateStr: "22 Oct 2026, 03:00 PM",
      timezone: "PKT",
      status: "upcoming",
      description: "2% CDR / Bank Guarantee submission from Schedule A Bank.",
    },
    {
      id: "m-3",
      title: "Corrigendum Submission Extended Deadline (NDMA Fleet)",
      dateStr: "24 Oct 2026, 12:00 PM",
      timezone: "PKT",
      status: "upcoming",
      description: "Physical submission in wax-sealed envelopes at NDMA headquarters.",
    },
  ];

  // Handling different mandatory UI states per AGENTS.md
  if (uiState === "loading") {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <TenderCard isLoading={true} />
            <TenderCard isLoading={true} />
          </div>
          <div className="h-64 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (uiState === "permission_denied") {
    return (
      <div className="p-12 bg-white rounded-lg border border-red-200 text-center max-w-xl mx-auto my-12">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-600 mt-1 mb-4">
          Your current role (<span className="font-semibold uppercase">{currentRole.replace(/_/g, " ")}</span>) does not have authorization to view executive pipeline analytics for this tenant.
        </p>
        <button
          type="button"
          onClick={() => setUiState("populated")}
          className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 cursor-pointer"
        >
          Reset to Populated State
        </button>
      </div>
    );
  }

  if (uiState === "error") {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-red-900">Backend Connection Error</h3>
        <p className="text-xs text-red-700 mt-1 mb-4">
          Unable to synchronize live procurement feed with FastAPI core service.
        </p>
        <button
          type="button"
          onClick={() => setUiState("populated")}
          className="px-3 py-1.5 bg-red-700 text-white rounded text-xs font-bold hover:bg-red-800 cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Scenario Context & Setup */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-white border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#0b1c30] tracking-tight">
              Bid Management Command Center
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 text-blue-900 border border-blue-200">
              Scenario {activeOrg.scenario}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active Workspace: <strong className="text-slate-800">{activeOrg.name}</strong> • NTN: {activeOrg.ntn}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/onboarding"
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors flex items-center gap-1.5"
          >
            <Building className="w-3.5 h-3.5 text-blue-600" />
            <span>Setup Profile ({activeOrg.profileCompleteness}%)</span>
          </Link>
          <Link
            href="/tenders"
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#0051d5] hover:bg-[#0041ab] text-white transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Discover Tenders</span>
          </Link>
        </div>
      </div>

      {/* Critical Alert Banners per Scenarios B and C */}
      {activeOrg.scenario === "B" && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3 text-red-950">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-red-900 text-sm">
              Disqualification Risk Detected (Scenario B — Trust Rule 7)
            </h4>
            <p className="mt-0.5 text-red-800 leading-relaxed">
              Your company&apos;s <strong>PRA Provincial Tax Clearance Certificate</strong> expired 35 days ago. Under PPRA Rule 36, mandatory qualification is blocked regardless of high capability fit (88%). Upload a valid certificate to unlock eligibility.
            </p>
          </div>
          <Link
            href="/vault"
            className="px-3 py-1 bg-red-600 text-white rounded font-bold text-xs hover:bg-red-700 whitespace-nowrap self-center"
          >
            Update Vault
          </Link>
        </div>
      )}

      {activeOrg.scenario === "C" && (
        <div className="p-4 rounded-lg bg-purple-50 border border-purple-200 flex items-start gap-3 text-purple-950">
          <AlertTriangle className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-purple-900 text-sm">
              Tender Corrigendum Notice (Scenario C — Trust Rule 11)
            </h4>
            <p className="mt-0.5 text-purple-800 leading-relaxed">
              NDMA issued <strong>Corrigendum 01</strong> extending the deadline and modifying delivery terms to 45 days. Affected proposal approvals have been invalidated and require review.
            </p>
          </div>
          <Link
            href="/compliance"
            className="px-3 py-1 bg-purple-700 text-white rounded font-bold text-xs hover:bg-purple-800 whitespace-nowrap self-center"
          >
            Review Changes
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Tracked Opportunities</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">14</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Pipeline Value:</span>
            <span className="font-bold text-blue-900 font-mono">PKR 1.25 Billion</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Mandatory Eligibility</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono">
            {activeOrg.scenario === "B" ? (
              <span className="text-red-700">Blocked</span>
            ) : (
              <span className="text-emerald-700">100% Valid</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {activeOrg.scenario === "B" ? "1 Expired Mandatory Certificate" : "3 Pinned Vault Evidence Verified"}
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Proposal Coverage</span>
            <FileCheck2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">85%</div>
          <div className="text-[11px] text-slate-500 mt-1">
            18 of 21 Mandatory Sections Drafted
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Nearest Closing</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">12 Days</div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            Federal Hospital Ventilators (01 Nov)
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tenders List with Filters */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Recommended & Active Tenders
              </h2>
              <p className="text-xs text-slate-500">
                Four distinct indicators displayed separately per AGENTS.md Rule 4
              </p>
            </div>

            {/* Filter Chips matching Section 15 */}
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterChip
                label="All"
                count={4}
                isActive={selectedFilter === "all"}
                onToggle={() => setSelectedFilter("all")}
              />
              <FilterChip
                label="High Fit (>85%)"
                isActive={selectedFilter === "high_fit"}
                onToggle={() => setSelectedFilter("high_fit")}
              />
              <FilterChip
                label="Eligible Only"
                isActive={selectedFilter === "eligible"}
                onToggle={() => setSelectedFilter("eligible")}
              />
              <FilterChip
                label="Amended"
                isActive={selectedFilter === "amended"}
                onToggle={() => setSelectedFilter("amended")}
              />
            </div>
          </div>

          <div className="space-y-3">
            {sampleTenders
              .filter((t) => {
                if (selectedFilter === "high_fit") return (t.fitScore || 0) >= 85;
                if (selectedFilter === "eligible") return t.mandatoryEligibility === "potentially_eligible";
                if (selectedFilter === "amended") return t.lifecycleStatus === "amended";
                return true;
              })
              .map((t) => (
                <TenderCard
                  key={t.id}
                  tender={t}
                  onSelect={(id) => alert(`Opening Tender ${id}`)}
                  onEvaluate={(id) => alert(`Evaluating Bid Qualification for ${id}`)}
                />
              ))}
          </div>
        </div>

        {/* Right Column: Schedule Timeline & Governance */}
        <div className="space-y-6">
          <Timeline milestones={milestones} />

          {/* Quick Access to Key Workspaces */}
          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Bidder SaaS Workspaces
            </h4>
            <div className="space-y-2">
              <Link
                href="/compliance"
                className="flex items-center justify-between p-2.5 rounded-md hover:bg-slate-50 border border-slate-100 transition-colors group text-xs"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-bold text-slate-800 group-hover:text-blue-600">Compliance Center</div>
                    <div className="text-[10px] text-slate-400">Requirement matrix & AI citation assistant</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </Link>

              <Link
                href="/participation"
                className="flex items-center justify-between p-2.5 rounded-md hover:bg-slate-50 border border-slate-100 transition-colors group text-xs"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-bold text-slate-800 group-hover:text-blue-600">Participation Board</div>
                    <div className="text-[10px] text-slate-400">10-stage gated Kanban pipeline</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </Link>

              <Link
                href="/vault"
                className="flex items-center justify-between p-2.5 rounded-md hover:bg-slate-50 border border-slate-100 transition-colors group text-xs"
              >
                <div className="flex items-center gap-2">
                  <FolderLock className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="font-bold text-slate-800 group-hover:text-blue-600">Document Vault</div>
                    <div className="text-[10px] text-slate-400">Verified evidence with expiry tracking</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

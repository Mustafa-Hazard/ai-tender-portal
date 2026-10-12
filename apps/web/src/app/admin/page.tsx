"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Server,
  FileSearch,
  History,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Download,
  ExternalLink,
  Lock,
  Database,
  Check,
  X,
  FileText,
  Sliders,
  AlertCircle,
} from "lucide-react";
import { useTenant } from "../../context/TenantContext";
import { StatusPill } from "../../components/shared/StatusPill";
import { ConfidenceLabel } from "../../components/shared/ConfidenceLabel";

interface Connector {
  id: string;
  name: string;
  jurisdiction: string;
  url: string;
  status: "healthy" | "degraded" | "offline";
  lastCrawl: string;
  schedule: string;
  successRate: number;
  avgLatencyMs: number;
  tendersCount: number;
  notes?: string;
}

interface ReviewItem {
  id: string;
  tenderId: string;
  tenderTitle: string;
  docName: string;
  pageNumber: number;
  field: string;
  extractedValue: string;
  confidence: number;
  reason: string;
  status: "pending" | "approved" | "corrected";
  correctedValue?: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  orgName: string;
  actor: string;
  role: string;
  action: string;
  resource: string;
  details: string;
  hash: string;
}

export default function AdminPage() {
  const { currentRole, isPlatformAdmin, setIsPlatformAdmin, uiState } = useTenant();
  const [activeTab, setActiveTab] = useState<"connectors" | "extraction" | "audit">("connectors");
  const [selectedReviewItem, setSelectedReviewItem] = useState<ReviewItem | null>(null);
  const [correctedValueInput, setCorrectedValueInput] = useState("");
  const [auditFilterOrg, setAuditFilterOrg] = useState<string>("all");
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [syncingConnectorId, setSyncingConnectorId] = useState<string | null>(null);

  // Check RBAC: Platform Admin or Owner Admin
  const isAuthorized = isPlatformAdmin || currentRole === "owner_admin";

  // Connectors Mock Data
  const [connectors, setConnectors] = useState<Connector[]>([
    {
      id: "epads-fed",
      name: "Federal E-Procurement (EPADS)",
      jurisdiction: "Pakistan (Federal PPRA)",
      url: "https://eprocure.gov.pk",
      status: "healthy",
      lastCrawl: "14 minutes ago",
      schedule: "Every 30 mins",
      successRate: 99.8,
      avgLatencyMs: 410,
      tendersCount: 684,
    },
    {
      id: "ppra-punjab",
      name: "Punjab PPRA E-Procurement Feed",
      jurisdiction: "Punjab Provincial",
      url: "https://ppra.punjab.gov.pk",
      status: "healthy",
      lastCrawl: "42 minutes ago",
      schedule: "Every 1 hour",
      successRate: 98.4,
      avgLatencyMs: 650,
      tendersCount: 412,
    },
    {
      id: "ppra-sindh",
      name: "Sindh PPRA SPPRA Portal Scraper",
      jurisdiction: "Sindh Provincial",
      url: "https://ppms.pprasindh.gov.pk",
      status: "degraded",
      lastCrawl: "2 hours ago",
      schedule: "Every 1 hour",
      successRate: 83.2,
      avgLatencyMs: 1420,
      tendersCount: 152,
      notes: "Cloudflare anti-bot challenge encountered on pagination offset > 100",
    },
    {
      id: "ungm-multilateral",
      name: "UNGM & Multilateral Development Feed",
      jurisdiction: "International / UN Agencies",
      url: "https://ungm.org",
      status: "healthy",
      lastCrawl: "4 hours ago",
      schedule: "Every 6 hours",
      successRate: 100.0,
      avgLatencyMs: 290,
      tendersCount: 88,
    },
  ]);

  // Extraction Review Queue Mock Data
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([
    {
      id: "rev-001",
      tenderId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      tenderTitle: "Procurement of High-End ICU Ventilators & Patient Monitors",
      docName: "Tender_Specifications_Vol_2.pdf",
      pageNumber: 14,
      field: "Bid Security Guarantee Amount",
      extractedValue: "PKR 3,500,000",
      confidence: 0.64,
      reason: "Handwritten note stamped partially obscuring digit 5 in Clause 17.2",
      status: "pending",
    },
    {
      id: "rev-002",
      tenderId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      tenderTitle: "Tier-3 Datacenter Infrastructure & High-Density Hyperconverged Cluster",
      docName: "RFP_Section_IV_Eligibility.pdf",
      pageNumber: 8,
      field: "Mandatory Vendor Turnover (Annual)",
      extractedValue: "PKR 500,000,000 per annum over last 3 fiscal years",
      confidence: 0.68,
      reason: "Complex multi-year phrasing across two paragraphs requiring human sign-off",
      status: "pending",
    },
    {
      id: "rev-003",
      tenderId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      tenderTitle: "Emergency Disaster Response Fleet Supply & Logistics Service",
      docName: "NDMA_Corrigendum_01.pdf",
      pageNumber: 2,
      field: "Expedited Delivery Period",
      extractedValue: "45 calendar days from issuance of Purchase Order",
      confidence: 0.69,
      reason: "Corrigendum modifies original clause 4.1 from 90 days to 45 days",
      status: "pending",
    },
  ]);

  // Immutable Audit Log Entries Mock Data
  const auditLogs: AuditLogEntry[] = [
    {
      id: "aud-001",
      timestamp: "2026-10-12 10:15:32 PKT",
      orgName: "Delta Engineering (Scenario B)",
      actor: "system_cron@tenderportal.internal",
      role: "System Orchestrator",
      action: "evidence.expired_flagged",
      resource: "Evidence: PRA Provincial Sales Tax #PRA-7890123",
      details: "Certificate expired 35 days ago (2026-09-07). Mandatory eligibility updated to DISQUALIFIED per Rule 7.",
      hash: "8f7b2a...e901",
    },
    {
      id: "aud-002",
      timestamp: "2026-10-12 09:44:11 PKT",
      orgName: "Indus Logistics (Scenario C)",
      actor: "ingestion_worker@tenderportal.internal",
      role: "Source Ingestion Service",
      action: "corrigendum.detected",
      resource: "Tender: NDMA-FLEET-2026-041",
      details: "Detected Corrigendum 01. Delivery timeline reduced from 90 to 45 days. Invalidation flag marked on prior approvals per Rule 11.",
      hash: "3c1e9f...64a2",
    },
    {
      id: "aud-003",
      timestamp: "2026-10-12 08:30:00 PKT",
      orgName: "Apex Healthcare (Scenario A)",
      actor: "mustafa.bid@apex-health.example",
      role: "Bid Manager",
      action: "tender.status_updated",
      resource: "Tender: FTH-ICU-2026-088",
      details: "Pipeline stage changed from EVALUATING to DECIDED_BID. Technical lead assigned.",
      hash: "a49d5c...31b8",
    },
    {
      id: "aud-004",
      timestamp: "2026-10-11 16:22:45 PKT",
      orgName: "Apex Healthcare (Scenario A)",
      actor: "dr.tariq@apex-health.example",
      role: "Compliance Reviewer",
      action: "evidence.verified",
      resource: "Evidence: DRAP Medical Device License #MD-2024-889",
      details: "Evidence validated against DRAP Online Register. Valid until 2028-12-31.",
      hash: "2b8f74...9cd0",
    },
    {
      id: "aud-005",
      timestamp: "2026-10-11 14:10:19 PKT",
      orgName: "Delta Engineering (Scenario B)",
      actor: "sarah.finance@delta.example",
      role: "Finance Contributor",
      action: "proposal.pricing_updated",
      resource: "Proposal: DELTA-PROP-2026-002",
      details: "Recalculated bill of materials using deterministic decimal arithmetic (Subtotal: PKR 482,000,000 + 18% GST).",
      hash: "77e31a...55f9",
    },
    {
      id: "aud-006",
      timestamp: "2026-10-11 11:05:02 PKT",
      orgName: "Platform Administration",
      actor: "admin@tenderportal.internal",
      role: "Owner Admin",
      action: "connector.rescheduled",
      resource: "Connector: Federal EPADS",
      details: "Polling frequency updated from 60 mins to 30 mins during peak tender posting hours.",
      hash: "99b0c2...11d4",
    },
  ];

  const handleSyncConnector = (id: string) => {
    setSyncingConnectorId(id);
    setTimeout(() => {
      setConnectors((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, lastCrawl: "Just now", status: "healthy", successRate: 100 }
            : c
        )
      );
      setSyncingConnectorId(null);
    }, 1200);
  };

  const handleApproveExtraction = (item: ReviewItem) => {
    setReviewItems((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, status: "approved" } : r))
    );
    setSelectedReviewItem(null);
  };

  const handleSaveCorrection = () => {
    if (!selectedReviewItem) return;
    setReviewItems((prev) =>
      prev.map((r) =>
        r.id === selectedReviewItem.id
          ? {
              ...r,
              status: "corrected",
              correctedValue: correctedValueInput || selectedReviewItem.extractedValue,
            }
          : r
      )
    );
    setSelectedReviewItem(null);
    setCorrectedValueInput("");
  };

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesOrg =
      auditFilterOrg === "all" ||
      (auditFilterOrg === "apex" && log.orgName.includes("Apex")) ||
      (auditFilterOrg === "delta" && log.orgName.includes("Delta")) ||
      (auditFilterOrg === "indus" && log.orgName.includes("Indus")) ||
      (auditFilterOrg === "platform" && log.orgName.includes("Platform"));

    const matchesSearch =
      auditSearchQuery.trim() === "" ||
      log.actor.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(auditSearchQuery.toLowerCase());

    return matchesOrg && matchesSearch;
  });

  // Handle permission denied UI state
  if (!isAuthorized || uiState === "permission_denied") {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="bg-white rounded-xl border border-red-200 p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Administrator Privileges Required
          </h1>
          <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
            The Platform Administration Console manages source crawlers, OCR review queues, and tenant-wide immutable audit ledgers. Your current role is{" "}
            <span className="font-semibold text-slate-800">{currentRole}</span>.
          </p>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 max-w-lg mx-auto text-left mb-6 text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800">Demo RBAC Simulator:</p>
            <p>
              To explore this page, you can either switch your role to <strong>Owner Admin</strong> in the top header, or toggle the demo Platform Admin simulation below:
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsPlatformAdmin(true)}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Simulate Platform Admin Session
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle Loading UI State
  if (uiState === "loading") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  // Handle Error UI State
  if (uiState === "error") {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center gap-3 text-red-800 font-semibold mb-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          Failed to load Platform Administrator telemetry
        </div>
        <p className="text-sm text-red-700 mb-4">
          Could not establish connection to the crawler orchestrator daemon. Please retry or check network configuration.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              Platform Admin
            </span>
            <span className="text-xs text-slate-400">• Multi-Tenant Control Plane</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            System Administration & Audit Console
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor public portal connectors, oversee low-confidence extraction queues, and inspect immutable audit ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setConnectors((prev) =>
                prev.map((c) => ({ ...c, lastCrawl: "Just now", status: "healthy" }))
              );
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh All Feeds
          </button>
          <button
            onClick={() => {
              const dataStr =
                "data:text/json;charset=utf-8," +
                encodeURIComponent(JSON.stringify(auditLogs, null, 2));
              const downloadAnchor = document.createElement("a");
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `audit-trail-${new Date().toISOString()}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit Trail (JSON)
          </button>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1.5">
            <span>Active Source Crawlers</span>
            <Server className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">4 / 4</div>
          <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 3 Healthy, 1 Degraded (Rate limit)
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1.5">
            <span>Tenders Ingested (30d)</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">1,336</div>
          <p className="text-xs text-slate-500 mt-1">EPADS, PPRA Punjab & Sindh</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1.5">
            <span>Extraction Review Queue</span>
            <FileSearch className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {reviewItems.filter((r) => r.status === "pending").length} Pending
          </div>
          <p className="text-xs text-slate-500 mt-1">Confidence &lt; 0.70 threshold</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1.5">
            <span>Ledger Integrity</span>
            <History className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">100% Verified</div>
          <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> SHA-256 Chain Unbroken
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("connectors")}
            className={`py-3 px-1 border-b-2 text-sm font-semibold flex items-center gap-2 transition-colors ${
              activeTab === "connectors"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <Server className="w-4 h-4" />
            Source Connectors & Crawlers
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600 font-bold">
              {connectors.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("extraction")}
            className={`py-3 px-1 border-b-2 text-sm font-semibold flex items-center gap-2 transition-colors ${
              activeTab === "extraction"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <FileSearch className="w-4 h-4" />
            Extraction Review Queue
            {reviewItems.filter((r) => r.status === "pending").length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-800 font-bold">
                {reviewItems.filter((r) => r.status === "pending").length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`py-3 px-1 border-b-2 text-sm font-semibold flex items-center gap-2 transition-colors ${
              activeTab === "audit"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <History className="w-4 h-4" />
            Immutable Audit Trail Ledger
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600 font-bold">
              {auditLogs.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Source Connectors & Crawlers */}
      {activeTab === "connectors" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Configured public procurement connectors and automated ingest schedules.</span>
            <span>All crawls record source HTML/PDF hash to prevent duplicate parsing.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectors.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-shadow space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 text-base">{c.name}</h3>
                      <StatusPill
                        variant={
                          c.status === "healthy"
                            ? "success"
                            : c.status === "degraded"
                            ? "warning"
                            : "danger"
                        }
                        label={
                          c.status === "healthy"
                            ? "Healthy"
                            : c.status === "degraded"
                            ? "Degraded"
                            : "Offline"
                        }
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{c.jurisdiction}</p>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-1 font-mono"
                    >
                      {c.url} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {c.notes && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{c.notes}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Last Crawl</span>
                    <span className="font-semibold text-slate-700">{c.lastCrawl}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Schedule</span>
                    <span className="font-semibold text-slate-700">{c.schedule}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Success Rate</span>
                    <span
                      className={`font-semibold ${
                        c.successRate >= 98
                          ? "text-emerald-700"
                          : c.successRate >= 90
                          ? "text-amber-700"
                          : "text-red-700"
                      }`}
                    >
                      {c.successRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Avg Latency</span>
                    <span className="font-semibold text-slate-700">{c.avgLatencyMs}ms</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    <strong>{c.tendersCount}</strong> tenders discovered
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSyncConnector(c.id)}
                      disabled={syncingConnectorId === c.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          syncingConnectorId === c.id ? "animate-spin text-blue-600" : ""
                        }`}
                      />
                      {syncingConnectorId === c.id ? "Syncing..." : "Sync Now"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Extraction Review Queue */}
      {activeTab === "extraction" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <strong className="font-semibold block text-sm mb-0.5">
                Human-in-the-Loop Review Threshold (Rule 6 Enforcement)
              </strong>
              AI suggestions with extraction confidence below <strong>0.70</strong> are routed here before populating critical tender eligibility criteria. Review and approve or correct values below.
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-sm">
                Flagged Extraction Items ({reviewItems.length})
              </h2>
              <span className="text-xs text-slate-500">
                Sorted by lowest confidence score
              </span>
            </div>

            <div className="divide-y divide-slate-200">
              {reviewItems.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <ConfidenceLabel confidence={item.confidence} />
                        <span className="text-xs font-medium text-slate-500">
                          Field: <strong className="text-slate-800">{item.field}</strong>
                        </span>
                        <StatusPill
                          variant={
                            item.status === "approved"
                              ? "success"
                              : item.status === "corrected"
                              ? "info"
                              : "warning"
                          }
                          label={
                            item.status === "approved"
                              ? "Approved by Supervisor"
                              : item.status === "corrected"
                              ? "Manually Corrected"
                              : "Pending Human Review"
                          }
                        />
                      </div>

                      <h3 className="text-sm font-semibold text-slate-900">
                        {item.tenderTitle}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          {item.docName}
                        </span>
                        <span>•</span>
                        <span>Page {item.pageNumber}</span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        <span className="text-slate-500 block mb-0.5">Extracted Value:</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {item.status === "corrected" && item.correctedValue
                            ? item.correctedValue
                            : item.extractedValue}
                        </span>
                        <div className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Flag reason: {item.reason}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 lg:flex-col lg:items-end shrink-0">
                      {item.status === "pending" ? (
                        <>
                          <button
                            onClick={() => handleApproveExtraction(item)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve As Is
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReviewItem(item);
                              setCorrectedValueInput(item.extractedValue);
                            }}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 flex items-center gap-1.5"
                          >
                            <Sliders className="w-3.5 h-3.5" /> Correct Value
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Immutable Audit Trail Ledger */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search actor email, action, resource..."
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-slate-500 font-medium">Filter Tenant:</span>
              <select
                value={auditFilterOrg}
                onChange={(e) => setAuditFilterOrg(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 bg-white"
              >
                <option value="all">All Organizations</option>
                <option value="apex">Apex Healthcare (Scenario A)</option>
                <option value="delta">Delta Engineering (Scenario B)</option>
                <option value="indus">Indus Logistics (Scenario C)</option>
                <option value="platform">Platform Administration</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Timestamp (PKT)</th>
                    <th className="py-3 px-4">Tenant / Org</th>
                    <th className="py-3 px-4">Actor & Role</th>
                    <th className="py-3 px-4">Action Event</th>
                    <th className="py-3 px-4">Target Resource</th>
                    <th className="py-3 px-4">Audit Details</th>
                    <th className="py-3 px-4">Checksum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No audit events match current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                          {log.orgName}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-900">{log.actor}</div>
                          <div className="text-[11px] text-slate-400">{log.role}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={log.resource}>
                          {log.resource}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-md">
                          {log.details}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {log.hash}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Correcting Low Confidence Extraction */}
      {selectedReviewItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="font-bold text-slate-900 text-base">
                Correct Extracted Value
              </h2>
              <button
                onClick={() => setSelectedReviewItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                <strong>Tender:</strong> {selectedReviewItem.tenderTitle}
              </p>
              <p>
                <strong>Source:</strong> {selectedReviewItem.docName} (Page{" "}
                {selectedReviewItem.pageNumber})
              </p>
              <p>
                <strong>Field:</strong> {selectedReviewItem.field}
              </p>
              <p className="text-amber-700">
                <strong>Flag Reason:</strong> {selectedReviewItem.reason}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Verified Value:
              </label>
              <input
                type="text"
                value={correctedValueInput}
                onChange={(e) => setCorrectedValueInput(e.target.value)}
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedReviewItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCorrection}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
              >
                Save Correction & Mark Verified
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

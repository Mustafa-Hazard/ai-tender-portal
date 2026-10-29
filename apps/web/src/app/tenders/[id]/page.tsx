"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ExternalLink,
  FileText,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  Download,
  Layers,
  DollarSign,
  History,
  FileQuestion,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { StatusPill } from "../../../components/shared/StatusPill";
import { SourceBadge } from "../../../components/shared/SourceBadge";
import { CitationLink } from "../../../components/shared/CitationLink";
import { DocumentPreviewShell } from "../../../components/shared/DocumentPreviewShell";

interface TenderDetailParams {
  params: Promise<{ id: string }>;
}

export default function TenderDetailPage({ params }: TenderDetailParams) {
  const resolvedParams = use(params);
  const tenderId = resolvedParams.id;
  

  const [activeTab, setActiveTab] = useState<
    "overview" | "lots" | "requirements" | "documents" | "clarifications" | "audit"
  >("requirements");

  const [viewerPage, setViewerPage] = useState<number>(14);
  const [highlightedText, setHighlightedText] = useState<string>(
    "The Bidder must possess valid DRAP establishment license under the Medical Devices Rules 2017."
  );
  const [isViewerExpanded, setIsViewerExpanded] = useState<boolean>(false);
  const [showNotBiddingModal, setShowNotBiddingModal] = useState<boolean>(false);
  const [notBiddingReason, setNotBiddingReason] = useState<string>("");
  const [bidDecisionStatus, setBidDecisionStatus] = useState<"pending" | "bidding" | "declined">("pending");

  // Sample Detailed Tender Data matching Scenarios
  const tender = {
    id: tenderId,
    title: "Procurement of High-End ICU Ventilators & Patient Monitors (Sample Fictional Data)",
    buyerName: "Federal Teaching Hospital Islamabad",
    referenceNumber: "FTH-ICU-2026-088",
    category: "Medical Equipment",
    procurementMethod: "Single Stage Two Envelope",
    country: "PK",
    region: "Federal Capital",
    city: "Islamabad",
    estimatedValue: 175000000,
    currency: "PKR",
    publishedAt: "2026-10-08T09:00:00+05:00",
    deadlineAt: "2026-11-20T14:00:00+05:00",
    deadlineTimezone: "Asia/Karachi",
    sourceName: "Federal EPADS Portal",
    originalUrl: "https://eprocure.gov.pk.example/tenders/FTH-ICU-2026-088",
    fitScore: 94,
    mandatoryEligibility: "potentially_eligible",
    proposalCoveragePercent: 45,
    submissionReadiness: "in_progress",
    description:
      "The Federal Teaching Hospital Islamabad invites sealed bids from eligible manufacturers or authorized distributors for the supply, installation, testing, commissioning, and 3-year comprehensive warranty maintenance of 40 invasive critical care ventilators and 40 multi-parameter cardiac patient monitors.",
    lots: [
      {
        number: "Lot-1",
        title: "40x Invasive Critical Care Ventilators",
        scope: "Supply of intensive care ventilators with integrated capnography, neonatal to adult modes, high-flow oxygen therapy, and turbine-driven air supply.",
        estimatedValue: 120000000,
        currency: "PKR",
        leadTime: "60 calendar days",
      },
      {
        number: "Lot-2",
        title: "40x Multi-Parameter Central Monitoring Stations",
        scope: "Bedside 12-inch ECG, SpO2, NIBP, IBP, and temperature monitors connected to dual-screen central nursing telemetry console.",
        estimatedValue: 55000000,
        currency: "PKR",
        leadTime: "45 calendar days",
      },
    ],
    requirements: [
      {
        code: "REQ-001",
        kind: "mandatory",
        category: "Regulatory Licensing",
        text: "The Bidder must possess valid DRAP establishment license and registration certificate under the Medical Devices Rules 2017.",
        page: 14,
        paragraph: 3,
        aiStatus: "meets",
        aiConfidence: 0.96,
        reviewerStatus: "verified_meets",
        linkedEvidence: "DRAP Medical Device License #MD-2024-889 (Valid until Dec 2028)",
      },
      {
        code: "REQ-002",
        kind: "mandatory",
        category: "Tax Compliance",
        text: "The Bidder shall be an Active Taxpayer on the Federal Board of Revenue (FBR) Active Taxpayers List (ATL) for Income Tax and Sales Tax.",
        page: 15,
        paragraph: 1,
        aiStatus: "meets",
        aiConfidence: 0.98,
        reviewerStatus: "verified_meets",
        linkedEvidence: "Active Taxpayer Certificate 2026 #NTN-1234567-8",
      },
      {
        code: "REQ-003",
        kind: "mandatory",
        category: "Financial Capacity",
        text: "The Bidder is required to demonstrate average annual financial turnover of not less than PKR 150 Million over the last three fiscal years (2023-2025).",
        page: 16,
        paragraph: 4,
        aiStatus: "meets",
        aiConfidence: 0.91,
        reviewerStatus: "verified_meets",
        linkedEvidence: "Audited Financial Statements 2023-2025 by KPMG Taseer Hadi",
      },
      {
        code: "REQ-004",
        kind: "mandatory",
        category: "Bid Security Bond",
        text: "The Bidder shall submit a CDR or Bank Guarantee equal to 2% of the estimated lot price (PKR 3,500,000) valid for 180 days.",
        page: 18,
        paragraph: 2,
        aiStatus: "needs_action",
        aiConfidence: 0.89,
        reviewerStatus: "in_progress",
        linkedEvidence: "Pending Bank Guarantee Issuance from Habib Bank Ltd",
      },
      {
        code: "REQ-005",
        kind: "scored",
        category: "Technical Specifications",
        text: "Ventilators equipped with dedicated Non-Invasive Ventilation (NIV) automatic leak compensation up to 60 L/min will receive 10 bonus points.",
        page: 22,
        paragraph: 1,
        aiStatus: "meets",
        aiConfidence: 0.94,
        reviewerStatus: "verified_meets",
        linkedEvidence: "Apex VentPro-900 Technical Datasheet Clause 4.2",
      },
    ],
    documents: [
      {
        id: "doc-1",
        name: "FTH_ICU_Tender_Specifications_Vol_1.pdf",
        type: "Bidding Documents",
        size: "4.8 MB",
        pages: 36,
        hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        uploadedAt: "2026-10-08 09:15 PKT",
      },
      {
        id: "doc-2",
        name: "Standard_Bidding_Forms_Financial_Schedule.xlsx",
        type: "BOQ & Commercial Template",
        size: "1.2 MB",
        pages: 6,
        hash: "7d793037a0760186574b0282f2f435e7090a6c0e390f7193d93ebc413554e389",
        uploadedAt: "2026-10-08 09:15 PKT",
      },
    ],
    clarifications: [
      {
        id: "clar-1",
        query: "Is international CE marking under EU MDR accepted in lieu of US FDA 510(k)?",
        response: "Yes, both CE-MDR and US FDA certifications are equally accepted per Clause 8.4.",
        issuedAt: "2026-10-10 11:30 PKT",
      },
      {
        id: "clar-2",
        query: "Pre-bid conference venue and timing.",
        response: "Pre-bid meeting will be conducted on October 25, 2026 at 11:00 AM in Conference Hall A and via Zoom link.",
        issuedAt: "2026-10-10 15:00 PKT",
      },
    ],
    auditEvents: [
      {
        id: "aud-1",
        timestamp: "2026-10-14 10:15 PKT",
        actor: "Mustafa Muhammad (Bid Manager)",
        action: "Tender intelligence viewed & requirements matrix verified",
      },
      {
        id: "aud-2",
        timestamp: "2026-10-12 09:30 PKT",
        actor: "Crawler Daemon",
        action: "Ingested from Federal EPADS portal with SHA256 integrity hash",
      },
    ],
  };

  const handleCitationClick = (page: number, text: string) => {
    setViewerPage(page);
    setHighlightedText(text);
  };

  const handleParticipate = () => {
    setBidDecisionStatus("bidding");
  };

  const handleDeclineBid = () => {
    if (!notBiddingReason.trim()) return;
    setBidDecisionStatus("declined");
    setShowNotBiddingModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Back Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/tenders"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discover Tenders
        </Link>
        <span className="text-xs text-slate-400 font-mono">
          Tender ID: {tender.id.slice(0, 13)}...
        </span>
      </div>

      {/* Top Intelligence Hero Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge name={tender.sourceName} isFictional={true} />
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                {tender.referenceNumber}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Method: <strong>{tender.procurementMethod}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {tender.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                {tender.buyerName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-mono">
                <Calendar className="w-4 h-4 text-slate-400" />
                Deadline: {tender.deadlineAt.slice(0, 10)} (14:00 {tender.deadlineTimezone})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-mono text-emerald-700 font-bold">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Est. Budget: {tender.currency} {tender.estimatedValue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Decision Buttons */}
          <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end shrink-0">
            {bidDecisionStatus === "bidding" ? (
              <span className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Bid Active in Participation Pipeline
              </span>
            ) : bidDecisionStatus === "declined" ? (
              <span className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-2">
                <XCircle className="w-4 h-4 text-slate-500" />
                Declined: {notBiddingReason}
              </span>
            ) : (
              <>
                <button
                  onClick={handleParticipate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  Participate / Create Bid
                </button>
                <button
                  onClick={() => setShowNotBiddingModal(true)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  Flag as Not Bidding
                </button>
              </>
            )}
            <a
              href={tender.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-mono pt-1"
            >
              Official Portal Link <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* The 4 Distinct Non-Negotiable Indicators (Rules 4 & 5) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 block mb-1 font-semibold uppercase tracking-wider">
              1. Opportunity Fit
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold font-mono text-emerald-600">
                {tender.fitScore}%
              </span>
              <span className="text-xs font-semibold text-emerald-700">High Match</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Biomedical Category Profile</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 block mb-1 font-semibold uppercase tracking-wider">
              2. Mandatory Eligibility
            </span>
            <StatusPill
              category="eligibility"
              label="Potentially Eligible"
              variant="success"
            />
            <p className="text-[10px] text-emerald-600 mt-1 font-medium">All 4 mandatory licenses active</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 block mb-1 font-semibold uppercase tracking-wider">
              3. Proposal Coverage
            </span>
            <div className="flex items-center gap-2">
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${tender.proposalCoveragePercent}%` }}
                ></div>
              </div>
              <span className="font-mono font-bold text-slate-800">
                {tender.proposalCoveragePercent}%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Technical draft in progress</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 block mb-1 font-semibold uppercase tracking-wider">
              4. Submission Readiness
            </span>
            <StatusPill
              category="readiness"
              label="In Progress"
              variant="info"
            />
            <p className="text-[10px] text-amber-700 mt-1 font-medium">Pending 2% CDR guarantee</p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Dual Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Embedded Document Viewer Shell with Interactive Citation Jump */}
        <div
          className={`space-y-3 transition-all duration-300 ${
            isViewerExpanded ? "lg:col-span-12" : "lg:col-span-5"
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Document Viewer & Citation Inspector
              </h3>
            </div>
            <button
              onClick={() => setIsViewerExpanded(!isViewerExpanded)}
              className="text-slate-500 hover:text-slate-700 text-xs font-semibold flex items-center gap-1"
            >
              {isViewerExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" /> Split View
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" /> Full Width
                </>
              )}
            </button>
          </div>

          <DocumentPreviewShell
            filename="FTH_ICU_Tender_Specifications_Vol_1.pdf"
            totalPages={36}
            currentPage={viewerPage}
            highlightedSection={`Page ${viewerPage} — Clause Inspection`}
            highlightedExcerpt={highlightedText}
          />

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Active Citation Jump Target:</strong>
              <p className="mt-0.5 font-mono text-[11px] leading-relaxed">
                Page {viewerPage}: &quot;{highlightedText}&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Tender Intelligence Multi-Tab Workspace */}
        <div
          className={`space-y-4 ${
            isViewerExpanded ? "hidden" : "lg:col-span-7"
          }`}
        >
          {/* Navigation Tabs */}
          <div className="border-b border-slate-200 bg-white rounded-t-xl px-3 pt-2">
            <nav className="flex space-x-6 overflow-x-auto text-xs" aria-label="Tender Tabs">
              <button
                onClick={() => setActiveTab("requirements")}
                className={`py-3 px-1 border-b-2 font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeTab === "requirements"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Mandatory Requirements ({tender.requirements.length})
              </button>

              <button
                onClick={() => setActiveTab("lots")}
                className={`py-3 px-1 border-b-2 font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeTab === "lots"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Layers className="w-4 h-4" />
                Lots & BOQ ({tender.lots.length})
              </button>

              <button
                onClick={() => setActiveTab("overview")}
                className={`py-3 px-1 border-b-2 font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeTab === "overview"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <FileText className="w-4 h-4" />
                Overview & Dates
              </button>

              <button
                onClick={() => setActiveTab("documents")}
                className={`py-3 px-1 border-b-2 font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeTab === "documents"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Download className="w-4 h-4" />
                Documents & Hashes ({tender.documents.length})
              </button>

              <button
                onClick={() => setActiveTab("clarifications")}
                className={`py-3 px-1 border-b-2 font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeTab === "clarifications"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <FileQuestion className="w-4 h-4" />
                Q&A / Addendums ({tender.clarifications.length})
              </button>

              <button
                onClick={() => setActiveTab("audit")}
                className={`py-3 px-1 border-b-2 font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeTab === "audit"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <History className="w-4 h-4" />
                Audit Trail
              </button>
            </nav>
          </div>

          {/* Tab 1: Mandatory Requirements Matrix */}
          {activeTab === "requirements" && (
            <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Click any citation button to jump and highlight the exact clause in the left document viewer.
                </span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 4 of 4 Mandatory Satisfied
                </span>
              </div>

              <div className="space-y-3">
                {tender.requirements.map((req) => (
                  <div
                    key={req.code}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 transition-shadow space-y-2.5 bg-slate-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-800">
                          {req.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            req.kind === "mandatory"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {req.kind}
                        </span>
                        <span className="text-xs text-slate-500">{req.category}</span>
                      </div>

                      <button
                        onClick={() => handleCitationClick(req.page, req.text)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold font-mono transition-colors"
                        title="Jump to document page and highlight snippet"
                      >
                        <CitationLink
                          documentName="FTH_ICU_Tender_Specifications_Vol_1.pdf"
                          page={req.page}
                          section={`¶${req.paragraph}`}
                        />
                      </button>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      {req.text}
                    </p>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-slate-600 truncate">
                          Linked Evidence:{" "}
                          <strong className="text-slate-800">{req.linkedEvidence}</strong>
                        </span>
                      </div>
                      <StatusPill
                        label="Verified: Meets"
                        variant="success"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Lots & Scope of Work */}
          {activeTab === "lots" && (
            <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Separately evaluated lots under Single Stage Two Envelope procedure.</span>
                <span>Sub-total: <strong>PKR 175,000,000</strong></span>
              </div>

              <div className="space-y-3">
                {tender.lots.map((lot) => (
                  <div
                    key={lot.number}
                    className="p-4 rounded-xl border border-slate-200 space-y-2 bg-slate-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">
                        {lot.number}
                      </span>
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {lot.currency} {lot.estimatedValue.toLocaleString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{lot.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{lot.scope}</p>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                      <span>Delivery / Completion: <strong>{lot.leadTime}</strong></span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Quoting Eligible
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Overview & Timeline */}
          {activeTab === "overview" && (
            <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-5 shadow-xs space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Procurement Description</h4>
                <p className="text-slate-600 leading-relaxed">{tender.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block mb-0.5">Tender Lifecycle Status</span>
                  <StatusPill label="Open & Active" variant="success" />
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Procurement Framework</span>
                  <span className="font-semibold text-slate-800">PPRA Rule 36(b)</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Official Timezone</span>
                  <span className="font-mono font-semibold text-slate-800">Asia/Karachi (PKT, UTC+5)</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Bid Validity Period</span>
                  <span className="font-semibold text-slate-800">180 Calendar Days</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Documents & Hashes */}
          {activeTab === "documents" && (
            <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-4 shadow-xs space-y-3">
              <div className="text-xs text-slate-500">
                All downloaded packs are cryptographically signed with SHA-256 hashes to guarantee non-tampering.
              </div>

              {tender.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      {doc.name}
                    </div>
                    <div className="text-slate-400 font-mono text-[11px] truncate max-w-md">
                      SHA256: {doc.hash}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {doc.type} • {doc.size} • {doc.pages} pages • Uploaded {doc.uploadedAt}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      alert(`Downloading verified tender document: ${doc.name}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Pack
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tab 5: Clarifications & Pre-Bid Notes */}
          {activeTab === "clarifications" && (
            <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-4 shadow-xs space-y-3 text-xs">
              <div className="text-xs text-slate-500">
                Published buyer clarifications and corrigendum addendums.
              </div>

              {tender.clarifications.map((clar) => (
                <div key={clar.id} className="p-3.5 rounded-lg border border-slate-200 space-y-2 bg-slate-50/50">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-600">Question & Official Answer</span>
                    <span>{clar.issuedAt}</span>
                  </div>
                  <p className="font-semibold text-slate-900">Q: {clar.query}</p>
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded text-blue-900 font-medium">
                    A: {clar.response}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 6: Immutable Audit Trail */}
          {activeTab === "audit" && (
            <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-4 shadow-xs space-y-3 text-xs">
              <div className="text-xs text-slate-500">
                Append-only activity ledger for this tender record per AGENTS.md requirements.
              </div>

              <div className="divide-y divide-slate-100">
                {tender.auditEvents.map((evt) => (
                  <div key={evt.id} className="py-2.5 flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-800">{evt.action}</div>
                      <div className="text-[11px] text-slate-400">{evt.actor}</div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {evt.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Flagging as Not Bidding (Enforcing Rule 6 Justification) */}
      {showNotBiddingModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="font-bold text-slate-900 text-base">
                Record Reason for Not Bidding
              </h2>
              <button
                onClick={() => setShowNotBiddingModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Per <strong>AGENTS.md Rule 6</strong>, declining to participate on a tender requires a recorded business justification for audit compliance.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Decline Justification:
              </label>
              <textarea
                value={notBiddingReason}
                onChange={(e) => setNotBiddingReason(e.target.value)}
                rows={3}
                placeholder="e.g. Unfavorable payment terms, 45-day compressed delivery schedule exceeds factory lead time..."
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowNotBiddingModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineBid}
                disabled={!notBiddingReason.trim()}
                className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-xs disabled:opacity-50"
              >
                Record Decline & Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  UserCheck,
  FileText,
  Building,
  RotateCcw,
  Check,
  AlertOctagon,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { AppLayout } from "../../components/layout/AppLayout";
import { StatusPill } from "../../components/shared/StatusPill";
import { CitationLink } from "../../components/shared/CitationLink";
import { useTenant } from "../../context/TenantContext";

interface RequirementItem {
  id: string;
  code: string;
  category: "Legal" | "Technical" | "Financial";
  kind: "mandatory" | "scored";
  originalText: string;
  citation: string;
  aiStatus: "meets_requirement" | "partially_meets" | "does_not_meet" | "missing_evidence" | "not_applicable";
  aiConfidence: number;
  reviewerStatus: "meets_requirement" | "partially_meets" | "does_not_meet" | "missing_evidence" | "not_applicable" | "unreviewed";
  linkedEvidenceTitle?: string;
  linkedEvidenceExpiresOn?: string;
  isEvidenceExpired: boolean;
  notApplicableJustification?: string;
  notes?: string;
}

const TENDERS = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    title: "Procurement of High-End ICU Ventilators & Patient Monitors",
    ref: "ME/PUNJAB/2026/0491",
    client: "Specialized Healthcare & Medical Education Department, Punjab",
    budget: "PKR 140,000,000",
    fitScore: 94,
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    title: "Enterprise Cloud Migration & Municipal ERP Datacenter Modernization",
    ref: "ERP/KHI/2026/8812",
    client: "Sindh Local Government & Municipal Information Systems Directorate",
    budget: "PKR 85,000,000",
    fitScore: 78,
  },
];

const INITIAL_REQUIREMENTS: RequirementItem[] = [
  {
    id: "req-1",
    code: "REQ-LEG-01",
    category: "Legal",
    kind: "mandatory",
    originalText: "The bidder must be on Active Taxpayers List (ATL) of FBR with valid NTN and Sales Tax Registration on tender opening date.",
    citation: "Section 3.1(a), Page 14 - Legal Eligibility Criteria",
    aiStatus: "meets_requirement",
    aiConfidence: 0.98,
    reviewerStatus: "meets_requirement",
    linkedEvidenceTitle: "Active Taxpayer Status Certificate 2026-27",
    linkedEvidenceExpiresOn: "2027-07-14",
    isEvidenceExpired: false,
    notes: "Verified against FBR active portal records.",
  },
  {
    id: "req-2",
    code: "REQ-TEC-01",
    category: "Technical",
    kind: "mandatory",
    originalText: "Manufacturer must hold valid ISO 13485 certification and FDA 510(k) or CE Marking under MDR for all quoted models.",
    citation: "Section 4.2(c), Page 28 - Quality Management Standards",
    aiStatus: "meets_requirement",
    aiConfidence: 0.95,
    reviewerStatus: "meets_requirement",
    linkedEvidenceTitle: "ISO 13485:2016 Medical Devices Quality Management System",
    linkedEvidenceExpiresOn: "2028-10-11",
    isEvidenceExpired: false,
    notes: "Accredited by BSI with full MDR annex scope.",
  },
  {
    id: "req-3",
    code: "REQ-FIN-01",
    category: "Financial",
    kind: "mandatory",
    originalText: "Average annual turnover of minimum PKR 100 Million over the last three financial years documented by audited balance sheets.",
    citation: "Section 5.1(b), Page 36 - Minimum Financial Capacity",
    aiStatus: "meets_requirement",
    aiConfidence: 0.92,
    reviewerStatus: "meets_requirement",
    linkedEvidenceTitle: "Annual Audited Accounts FY2024-2025",
    linkedEvidenceExpiresOn: "2027-06-14",
    isEvidenceExpired: false,
    notes: "Average 3-yr turnover is PKR 148 Million.",
  },
];

export default function ComplianceMatrixPage() {
  const { activeOrg } = useTenant();
  const [selectedTenderId, setSelectedTenderId] = useState(TENDERS[0].id);
  const [requirements, setRequirements] = useState<RequirementItem[]>(INITIAL_REQUIREMENTS);
  
  // Rule 6 Modal State
  const [justificationModalReq, setJustificationModalReq] = useState<RequirementItem | null>(null);
  const [justificationInput, setJustificationInput] = useState("");
  const [justificationError, setJustificationError] = useState("");

  // Rule 7 Scenario Simulator
  const [isScenarioBActive, setIsScenarioBActive] = useState(false);

  const activeTender = TENDERS.find((t) => t.id === selectedTenderId) || TENDERS[0];

  // Apply scenario B (expired evidence) or scenario A
  const toggleScenario = (enableScenarioB: boolean) => {
    setIsScenarioBActive(enableScenarioB);
    if (enableScenarioB) {
      setRequirements(
        requirements.map((r) =>
          r.code === "REQ-LEG-01"
            ? {
                ...r,
                linkedEvidenceTitle: "PRA Provincial Tax Clearance Certificate (EXPIRED)",
                linkedEvidenceExpiresOn: "2026-09-07",
                isEvidenceExpired: true,
                reviewerStatus: "meets_requirement",
              }
            : r
        )
      );
    } else {
      setRequirements(INITIAL_REQUIREMENTS);
    }
  };

  // Compute 4 Distinct Indicators (Rule 4 & 5)
  const totalReqs = requirements.length;
  const mandatoryReqs = requirements.filter((r) => r.kind === "mandatory");
  const reviewedCount = requirements.filter((r) => r.reviewerStatus !== "unreviewed").length;
  const coveragePercent = Math.round((reviewedCount / totalReqs) * 100);

  // Check blockers
  const blockers: string[] = [];
  let isMandatoryEligible = true;

  mandatoryReqs.forEach((req) => {
    if (req.isEvidenceExpired) {
      isMandatoryEligible = false;
      blockers.push(
        `RULE 7 CRITICAL BLOCKER: Requirement ${req.code} is linked to expired evidence "${req.linkedEvidenceTitle}" (Expired on ${req.linkedEvidenceExpiresOn}). Expired vault credentials automatically void mandatory eligibility.`
      );
    } else if (req.reviewerStatus === "does_not_meet") {
      isMandatoryEligible = false;
      blockers.push(`Requirement ${req.code} failed: Evaluator verified DOES NOT MEET.`);
    } else if (req.reviewerStatus === "not_applicable" && !req.notApplicableJustification) {
      isMandatoryEligible = false;
      blockers.push(`RULE 6 BLOCKER: Requirement ${req.code} marked N/A without recorded justification.`);
    } else if (req.reviewerStatus !== "meets_requirement" && req.reviewerStatus !== "not_applicable") {
      isMandatoryEligible = false;
    }
  });

  const eligibilityStatus: "potentially_eligible" | "not_eligible" | "undetermined" =
    blockers.length > 0 ? "not_eligible" : isMandatoryEligible ? "potentially_eligible" : "undetermined";

  const submissionReadiness: "ready_to_submit" | "blocked" | "in_progress" =
    eligibilityStatus === "not_eligible"
      ? "blocked"
      : eligibilityStatus === "potentially_eligible" && coveragePercent === 100
      ? "ready_to_submit"
      : "in_progress";

  const handleStatusChange = (req: RequirementItem, newStatus: any) => {
    if (newStatus === "not_applicable") {
      setJustificationModalReq(req);
      setJustificationInput(req.notApplicableJustification || "");
      setJustificationError("");
    } else {
      setRequirements(
        requirements.map((r) =>
          r.id === req.id
            ? { ...r, reviewerStatus: newStatus, notApplicableJustification: undefined }
            : r
        )
      );
    }
  };

  const handleSaveJustification = () => {
    if (!justificationInput.trim()) {
      setJustificationError("RULE 6 MANDATORY: You must record an audit-grade justification explaining why this tender requirement does not apply.");
      return;
    }

    if (justificationModalReq) {
      setRequirements(
        requirements.map((r) =>
          r.id === justificationModalReq.id
            ? {
                ...r,
                reviewerStatus: "not_applicable",
                notApplicableJustification: justificationInput.trim(),
              }
            : r
        )
      );
    }
    setJustificationModalReq(null);
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
                <h1 className="text-2xl font-bold text-slate-900">Compliance Center & Disqualification Matrix</h1>
                <p className="text-sm text-slate-500">
                  Pre-submission verification for {activeOrg?.name || "Apex Healthcare Technologies"}. Separate AI suggestions from human sign-offs.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-1 rounded-lg flex items-center text-xs font-medium">
              <button
                onClick={() => toggleScenario(false)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  !isScenarioBActive ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Scenario A: Valid Vault
              </button>
              <button
                onClick={() => toggleScenario(true)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  isScenarioBActive ? "bg-red-600 text-white shadow-sm font-semibold" : "text-slate-600 hover:text-red-700"
                }`}
              >
                Scenario B: Expired Doc (Rule 7)
              </button>
            </div>
          </div>
        </div>

        {/* Tender Selector */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-slate-400" />
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Tender</label>
              <select
                value={selectedTenderId}
                onChange={(e) => setSelectedTenderId(e.target.value)}
                className="font-bold text-slate-900 bg-transparent border-0 p-0 text-base focus:ring-0 cursor-pointer"
              >
                {TENDERS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.ref})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Issuing Authority: <span className="font-semibold text-slate-700">{activeTender.client}</span>
          </div>
        </div>

        {/* 4 DISTINCT TRUST INDICATORS (Rules 4 & 5) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Indicator 1: Fit Score */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Opportunity Fit</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 flex items-baseline gap-1">
              {activeTender.fitScore}%
              <span className="text-xs font-normal text-emerald-600">Strong Match</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Independent technical keyword fit</div>
          </div>

          {/* Indicator 2: Mandatory Eligibility (Rule 4: Never masked by fit score!) */}
          <div className={`p-4 rounded-xl border shadow-sm ${
            eligibilityStatus === "not_eligible"
              ? "bg-red-50/70 border-red-200 text-red-900"
              : eligibilityStatus === "potentially_eligible"
              ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
              : "bg-amber-50/70 border-amber-200 text-amber-900"
          }`}>
            <div className="text-xs font-semibold uppercase tracking-wider">Mandatory Eligibility</div>
            <div className="text-2xl font-bold mt-1 flex items-center gap-2">
              {eligibilityStatus === "potentially_eligible" && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
              {eligibilityStatus === "not_eligible" && <XCircle className="w-6 h-6 text-red-600" />}
              {eligibilityStatus === "undetermined" && <HelpCircle className="w-6 h-6 text-amber-600" />}
              <span className="capitalize">{eligibilityStatus.replace("_", " ")}</span>
            </div>
            <div className="text-[11px] opacity-80 mt-1">Rule 5: Distinct unmerged decision gate</div>
          </div>

          {/* Indicator 3: Proposal Coverage */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Proposal Coverage</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{coveragePercent}%</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {reviewedCount} of {totalReqs} requirements evaluated
            </div>
          </div>

          {/* Indicator 4: Submission Readiness */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Submission Readiness</div>
            <div className="mt-1">
              <StatusPill
                label={submissionReadiness.replace(/_/g, " ").toUpperCase()}
                variant={
                  submissionReadiness === "ready_to_submit"
                    ? "success"
                    : submissionReadiness === "blocked"
                    ? "danger"
                    : "warning"
                }
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-2">Final sign-off state</div>
          </div>
        </div>

        {/* CRITICAL DISQUALIFICATION BLOCKER ALERT (Rule 7) */}
        {blockers.length > 0 && (
          <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-xl shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
              <AlertOctagon className="w-5 h-5 text-red-600" />
              TENDER DISQUALIFICATION RISK DETECTED ({blockers.length} Blocker{blockers.length > 1 ? "s" : ""})
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-red-800">
              {blockers.map((blocker, idx) => (
                <li key={idx} className="leading-relaxed">
                  {blocker}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-red-700 italic pt-1">
              Notice: Even with a {activeTender.fitScore}% match, bidding is blocked until all mandatory eligibility criteria and valid unexpired vault credentials are provided.
            </p>
          </div>
        )}

        {/* Matrix Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Evaluated Tender Requirements ({requirements.length})
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI Pre-screen Suggestion
              </span>
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Evaluator Human Sign-off
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Code / Category</th>
                  <th className="py-3 px-4">Requirement & Citation</th>
                  <th className="py-3 px-4">AI Suggestion</th>
                  <th className="py-3 px-4">Reviewer Status</th>
                  <th className="py-3 px-4">Vault Evidence Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {requirements.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Code & Kind */}
                    <td className="py-4 px-4 align-top w-36">
                      <div className="font-mono font-bold text-xs text-slate-900">{req.code}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{req.category}</div>
                      <span className={`inline-block mt-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        req.kind === "mandatory" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {req.kind}
                      </span>
                    </td>

                    {/* Original Text & Citation */}
                    <td className="py-4 px-4 align-top max-w-md">
                      <p className="text-slate-800 text-xs leading-relaxed font-medium">{req.originalText}</p>
                      <div className="mt-2 text-[11px] text-blue-600 flex items-center gap-1 cursor-pointer hover:underline">
                        <CitationLink
                          documentName="Tender_Dossier_ICU_Ventilators.pdf"
                          page={14}
                          section="Legal Eligibility"
                          fullCitation={req.citation}
                        />
                      </div>
                      {req.notApplicableJustification && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                          <strong>Recorded N/A Justification (Rule 6):</strong> {req.notApplicableJustification}
                        </div>
                      )}
                    </td>

                    {/* AI Suggestion (Rule 6: Clearly labeled as AI) */}
                    <td className="py-4 px-4 align-top w-44">
                      <div className="p-2 bg-purple-50/70 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-900">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          <span>AI Pre-Screen</span>
                        </div>
                        <div className="mt-1">
                          <StatusPill
                            label={req.aiStatus.replace(/_/g, " ").toUpperCase()}
                            variant={req.aiStatus === "meets_requirement" ? "success" : "danger"}
                          />
                        </div>
                        <div className="text-[10px] text-purple-700 mt-1 font-mono">
                          Confidence: {(req.aiConfidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    </td>

                    {/* Evaluator Status */}
                    <td className="py-4 px-4 align-top w-48">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-blue-600" /> Human Sign-Off
                        </label>
                        <select
                          value={req.reviewerStatus}
                          onChange={(e) => handleStatusChange(req, e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="unreviewed">Unreviewed</option>
                          <option value="meets_requirement">Meets Requirement</option>
                          <option value="partially_meets">Partially Meets</option>
                          <option value="does_not_meet">Does Not Meet</option>
                          <option value="missing_evidence">Missing Evidence</option>
                          <option value="not_applicable">Not Applicable (N/A)</option>
                        </select>
                      </div>
                    </td>

                    {/* Linked Vault Evidence */}
                    <td className="py-4 px-4 align-top w-64">
                      {req.linkedEvidenceTitle ? (
                        <div className={`p-2.5 rounded-lg border text-xs ${
                          req.isEvidenceExpired
                            ? "bg-red-50 border-red-300 text-red-900"
                            : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}>
                          <div className="flex items-start gap-1.5 font-semibold text-xs">
                            <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${req.isEvidenceExpired ? "text-red-600" : "text-blue-600"}`} />
                            <span className="leading-tight">{req.linkedEvidenceTitle}</span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            Valid until: {req.linkedEvidenceExpiresOn}
                          </div>
                          {req.isEvidenceExpired && (
                            <div className="mt-1.5 text-[10px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> EXPIRED EVIDENCE (DISQUALIFIED)
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic p-2 border border-dashed border-slate-200 rounded-lg text-center">
                          No evidence attached
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RULE 6: Mandatory Justification Modal */}
        {justificationModalReq && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
              <div className="flex items-start gap-3">
                <span className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                  <AlertTriangle className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Rule 6 Compliance: N/A Justification Required
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Requirement <strong>{justificationModalReq.code}</strong> cannot be marked "Not Applicable" without an official recorded justification for audit defense.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Audit Defense Justification
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Under Federal Statutory Regulatory Order (SRO) 456/2025, commercial healthcare import vendors are exempt from provincial sales tax registration..."
                  value={justificationInput}
                  onChange={(e) => {
                    setJustificationInput(e.target.value);
                    setJustificationError("");
                  }}
                  className="w-full mt-1.5 p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {justificationError && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium">{justificationError}</p>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setJustificationModalReq(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveJustification}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-sm"
                >
                  Record Justification & Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

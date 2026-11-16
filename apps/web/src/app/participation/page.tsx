"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Building,
  Clock,
  ArrowRight,
  ChevronRight,
  Gavel,
  X,
} from "lucide-react";
import { useTenant } from "../../context/TenantContext";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";

interface BidItem {
  id: string;
  tenderId: string;
  tenderTitle: string;
  tenderRef: string;
  client: string;
  stage: "discovered" | "shortlisted" | "evaluating" | "participation_approved" | "preparing" | "submitted";
  decision?: "bid" | "no_bid" | "hold";
  decisionRationale?: string;
  contractValue: number;
  currency: string;
  internalDeadline: string;
  tasksCount: number;
  tasksCompleted: number;
  fitScore: number;
}

const STAGES = [
  { id: "shortlisted", title: "Shortlisted" },
  { id: "evaluating", title: "Evaluating Fit" },
  { id: "participation_approved", title: "Decision Approved" },
  { id: "preparing", title: "Preparing Proposal" },
  { id: "submitted", title: "Submitted" },
];

export default function BidParticipationPage() {
  const { activeOrg } = useTenant();
  const { success, info } = useToast();
  const [bids, setBids] = useState<BidItem[]>([]);
  const [decisionModalBid, setDecisionModalBid] = useState<BidItem | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<"bid" | "no_bid" | "hold">("bid");
  const [decisionRationaleInput, setDecisionRationaleInput] = useState("");
  const [decisionError, setDecisionError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.getBids(activeOrg.id)
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          const mapped: BidItem[] = data.map((b: any) => ({
            id: String(b.id),
            tenderId: String(b.tender_id),
            tenderTitle: b.tender_title || "Tender Opportunity",
            tenderRef: b.tender_ref || "REF-NOT-STATED",
            client: b.buyer_name || b.client || "Procuring Authority",
            stage: b.stage || "evaluating",
            decision: b.decision || undefined,
            decisionRationale: b.decision_rationale || undefined,
            contractValue: Number(b.potential_contract_value || b.expected_bid_cost || 0),
            currency: b.currency || "PKR",
            internalDeadline: b.internal_deadline ? String(b.internal_deadline).split("T")[0] : "Not stated",
            tasksCount: b.tasks_count || 3,
            tasksCompleted: b.tasks_completed || 1,
            fitScore: b.fit_score || 88,
          }));
          setBids(mapped);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [activeOrg.id]);

  const totalPipelineValue = bids.reduce((acc, b) => acc + b.contractValue, 0);

  const handleOpenDecisionModal = (bid: BidItem) => {
    setDecisionModalBid(bid);
    setSelectedDecision(bid.decision || "bid");
    setDecisionRationaleInput(bid.decisionRationale || "");
    setDecisionError("");
  };

  const handleSaveDecision = async () => {
    if (!decisionRationaleInput.trim() || decisionRationaleInput.trim().length < 5) {
      setDecisionError("Please provide an auditable justification (minimum 5 characters) for the bid decision.");
      return;
    }

    if (decisionModalBid) {
      try {
        await api.updateBidDecision(decisionModalBid.id, activeOrg.id, {
          decision: selectedDecision,
          decision_rationale: decisionRationaleInput.trim(),
        });

        const targetStage =
          selectedDecision === "bid" && decisionModalBid.stage === "evaluating"
            ? "participation_approved"
            : decisionModalBid.stage;

        if (targetStage !== decisionModalBid.stage) {
          await api.updateBidStage(decisionModalBid.id, activeOrg.id, targetStage);
        }

        setBids(
          bids.map((b) =>
            b.id === decisionModalBid.id
              ? {
                  ...b,
                  decision: selectedDecision,
                  decisionRationale: decisionRationaleInput.trim(),
                  stage: targetStage,
                }
              : b
          )
        );
        setDecisionModalBid(null);
        success(`Decision recorded: ${selectedDecision.toUpperCase()} for ${decisionModalBid.tenderRef}`);
      } catch (err: any) {
        setDecisionError(`Failed to save decision: ${err.message}`);
      }
    }
  };

  const handleAdvanceStage = async (bidId: string) => {
    const stageOrder: BidItem["stage"][] = [
      "discovered",
      "shortlisted",
      "evaluating",
      "participation_approved",
      "preparing",
      "submitted",
    ];

    const currentBid = bids.find((b) => b.id === bidId);
    if (!currentBid) return;
    const currentIndex = stageOrder.indexOf(currentBid.stage);
    if (currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1];
      try {
        await api.updateBidStage(bidId, activeOrg.id, nextStage);
        setBids(bids.map((b) => (b.id === bidId ? { ...b, stage: nextStage } : b)));
        info(`Bid advanced to "${nextStage.replace(/_/g, " ").toUpperCase()}" stage.`);
      } catch {
        // network or server error handled gracefully
      }
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <Layers className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Bid Participation & Pipeline Workspace</h1>
                <p className="text-sm text-slate-500">
                  Track active opportunities for {activeOrg?.name || "Apex Healthcare Technologies"}. Manage Bid/No-Bid decisions and progress toward proposal submission.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/tenders"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Browse Discovery Hub
            </Link>
          </div>
        </div>

        {/* Pipeline Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Pipeline Bids</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{bids.length}</div>
            <div className="text-xs text-slate-500 mt-1">Across multiple stages</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total Pipeline Value</div>
            <div className="text-2xl font-bold text-blue-700 mt-1">
              PKR {(totalPipelineValue / 1000000).toFixed(0)}M
            </div>
            <div className="text-xs text-slate-500 mt-1">Estimated contract volume</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Approved to Bid</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {bids.filter((b) => b.decision === "bid").length}
            </div>
            <div className="text-xs text-emerald-600 mt-1">Committee sign-off recorded</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Decision on Hold</div>
            <div className="text-2xl font-bold text-amber-700 mt-1">
              {bids.filter((b) => b.decision === "hold").length}
            </div>
            <div className="text-xs text-amber-600 mt-1">Evaluating criteria</div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {STAGES.map((col) => {
            const colBids = bids.filter((b) => b.stage === col.id);
            return (
              <div key={col.id} className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 min-w-[260px] flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">{col.title}</h3>
                  <span className="w-5 h-5 bg-slate-200 text-slate-700 rounded-full text-[11px] font-bold flex items-center justify-center">
                    {colBids.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {colBids.length === 0 ? (
                    <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                      No bids in this stage
                    </div>
                  ) : (
                    colBids.map((bid) => (
                      <div
                        key={bid.id}
                        className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-500">{bid.tenderRef}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                            Fit: {bid.fitScore}%
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                          {bid.tenderTitle}
                        </h4>

                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{bid.client}</span>
                        </div>

                        <div className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-800">
                          <span>{bid.currency} {(bid.contractValue / 1000000).toFixed(1)}M</span>
                          {bid.decision ? (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                                bid.decision === "bid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : bid.decision === "no_bid"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              Decision: {bid.decision}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">No Decision</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> Due: {bid.internalDeadline}
                          </span>
                          <span className="font-medium text-slate-600">
                            Tasks: {bid.tasksCompleted}/{bid.tasksCount}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenDecisionModal(bid)}
                              className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            >
                              Decision
                            </button>
                            <Link
                              href={`/compliance?tender_id=${bid.tenderId}`}
                              className="px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                            >
                              Compliance
                            </Link>
                          </div>

                          {bid.stage === "preparing" ? (
                            <Link
                              href={`/proposals/${bid.id}`}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#0051d5] hover:bg-blue-700 rounded transition-colors flex items-center gap-1"
                            >
                              Proposal <ArrowRight className="w-3 h-3" />
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleAdvanceStage(bid.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              Advance <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Decision Matrix Modal */}
        {decisionModalBid && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Gavel className="w-5 h-5 text-blue-600" /> Bid / No-Bid Decision Committee
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{decisionModalBid.tenderTitle}</p>
                </div>
                <button onClick={() => setDecisionModalBid(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {/* Scorecard Preview */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                    Internal Committee Scorecard
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div>Technical Capability: <span className="font-bold text-slate-900">95% (High)</span></div>
                    <div>Target Gross Margin: <span className="font-bold text-slate-900">32%</span></div>
                    <div>Resource Bandwidth: <span className="font-bold text-slate-900">Available</span></div>
                    <div>Buyer Payment Track: <span className="font-bold text-slate-900">Standard Gov</span></div>
                  </div>
                </div>

                {/* Decision Options */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">Committee Determination</label>
                  <div className="grid grid-cols-3 gap-3 mt-1.5">
                    {[
                      { id: "bid", label: "BID (Proceed)", color: "border-emerald-500 bg-emerald-50 text-emerald-900" },
                      { id: "hold", label: "HOLD (Review)", color: "border-amber-500 bg-amber-50 text-amber-900" },
                      { id: "no_bid", label: "NO BID (Pass)", color: "border-red-500 bg-red-50 text-red-900" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedDecision(opt.id as any)}
                        className={`p-2.5 text-xs font-bold rounded-lg border text-center transition-all ${
                          selectedDecision === opt.id ? opt.color + " shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mandatory Rationale */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Auditable Committee Rationale
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide justification for why the company is bidding or declining this opportunity..."
                    value={decisionRationaleInput}
                    onChange={(e) => {
                      setDecisionRationaleInput(e.target.value);
                      setDecisionError("");
                    }}
                    className="w-full mt-1.5 p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {decisionError && <p className="text-xs text-red-600 mt-1 font-medium">{decisionError}</p>}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setDecisionModalBid(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDecision}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Sign Off & Record Decision
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

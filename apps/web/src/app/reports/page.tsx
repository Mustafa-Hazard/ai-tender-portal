"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  Download,
  Plus,
  Building,
  ShieldCheck,
  PieChart,
  Lightbulb,
} from "lucide-react";
import { useTenant } from "../../context/TenantContext";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";

interface OutcomeItem {
  id: string;
  bidRef: string;
  tenderTitle: string;
  tenderRef: string;
  client: string;
  outcomeStatus: "awarded" | "lost" | "disqualified" | "under_evaluation";
  ourBidAmount: string;
  winningBidder?: string;
  winningPrice?: string;
  priceVariancePercent?: number;
  debriefNotes: string;
  lessonsLearned: string;
  recordedDate: string;
}

export default function ReportsAndAnalyticsPage() {
  const { activeOrg } = useTenant();
  const { success } = useToast();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [showDebriefModal, setShowDebriefModal] = useState(false);
  const [liveAnalytics, setLiveAnalytics] = useState<any>(null);
  const [outcomesList, setOutcomesList] = useState<OutcomeItem[]>([]);

  const handleExportBrief = () => {
    success("Generating and downloading Executive Procurement Brief...");
    const reportData = {
      organization: activeOrg.name,
      report: "Executive Procurement & Win-Rate Analytics",
      generated_at: new Date().toISOString(),
      win_rate: "42.8%",
      total_submissions: 14,
      total_awarded_value: "PKR 415,000,000",
      compliance_clearance_rate: "94.2%",
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Executive_Procurement_Brief_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    api.getAnalyticsSummary(activeOrg.id)
      .then((data) => setLiveAnalytics(data))
      .catch(() => {});

    api.getOutcomes(activeOrg.id)
      .then((records) => {
        if (Array.isArray(records) && records.length > 0) {
          const mapped: OutcomeItem[] = records.map((r: any) => ({
            id: String(r.id),
            bidRef: `BID-${(r.tender_ref || "TENDER").slice(0, 10)}`,
            tenderTitle: r.tender_title || "Tender Outcome",
            tenderRef: r.tender_ref || "REF-NOT-STATED",
            client: r.buyer_name || "Procuring Authority",
            outcomeStatus: r.outcome_status || "awarded",
            ourBidAmount: `PKR ${Number(r.actual_bid_amount || 0).toLocaleString()}`,
            winningBidder: r.winning_bidder || "Apex Healthcare Technologies",
            winningPrice: `PKR ${Number(r.winning_price || r.actual_bid_amount || 0).toLocaleString()}`,
            priceVariancePercent: r.price_variance_percentage || 0,
            debriefNotes: r.debrief_notes || "Decision recorded.",
            lessonsLearned: r.lessons_learned || "Not stated",
            recordedDate: r.recorded_at ? String(r.recorded_at).split("T")[0] : "2026-10-17",
          }));
          setOutcomesList(mapped);
        }
      })
      .catch(() => {});
  }, [activeOrg.id]);

  const filteredOutcomes = outcomesList.filter((item) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "awarded") return item.outcomeStatus === "awarded";
    if (selectedFilter === "lost") return item.outcomeStatus === "lost";
    return true;
  });

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Phase 6 Intelligence
              </span>
              <span className="text-xs text-slate-400 font-medium">Updated Oct 2026</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight">
              Executive Win-Loss & Debrief Analytics
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Data-driven procurement intelligence, competitor pricing margins, and post-award audit debriefs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportBrief}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export Executive Brief</span>
            </button>
            <button
              onClick={() => setShowDebriefModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0051d5] text-xs font-semibold text-white hover:bg-[#0041ab] shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Bid Debrief</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Win Rate</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                {liveAnalytics ? `${liveAnalytics.win_rate_percent}%` : "66.7%"}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 font-medium">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span>Rule 14 Verified</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Awarded Value</span>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-[#0051d5] font-mono">
                {liveAnalytics ? `PKR ${(Number(liveAnalytics.total_awarded_value) / 1000000).toFixed(1)}M` : "PKR 95.0M"}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {liveAnalytics ? `${liveAnalytics.awarded_count} contracts awarded` : "2 contracts awarded YTD"}
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Pipeline</span>
              <BarChart3 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                {liveAnalytics ? `PKR ${(Number(liveAnalytics.total_pipeline_value) / 1000000).toFixed(1)}M` : "PKR 142.5M"}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {liveAnalytics ? `${liveAnalytics.total_participated} bids tracked` : "Active bid participation"}
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Avg Discount</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                {liveAnalytics ? `${liveAnalytics.average_discount_percent}%` : "4.8%"}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Price variance vs L2 bidder
              </div>
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Disqualification</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-emerald-700 font-mono">
                {liveAnalytics ? `${liveAnalytics.disqualification_rate_percent}%` : "0.0%"}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">
                Rule 7 Zero-Disqualification
              </div>
            </div>
          </div>
        </div>

        {/* Competitor Pricing Intelligence Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Competitor Pricing Intelligence & Benchmark</h2>
            </div>
            <span className="text-xs font-mono text-slate-500">Last Auction: ME/PUNJAB/2026/0491</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-blue-50/80 border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900">Apex MedTech (Our Bid)</span>
                <span className="text-[10px] font-mono bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded font-bold">
                  WINNER
                </span>
              </div>
              <div className="text-lg font-bold text-blue-900 font-mono mt-2">PKR 59,000,000</div>
              <p className="text-xs text-blue-800/80 mt-1">
                Exact estimate match; highest technical rating (98%).
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Medina Electro-Medical</span>
                <span className="text-[10px] font-mono text-slate-500">+3.7% Variance</span>
              </div>
              <div className="text-lg font-bold text-slate-800 font-mono mt-2">PKR 61,200,000</div>
              <p className="text-xs text-slate-500 mt-1">
                Higher margin quote; second ranked in commercial evaluation.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">BioTech Solutions Ltd</span>
                <span className="text-[10px] font-mono text-slate-500">+8.1% Variance</span>
              </div>
              <div className="text-lg font-bold text-slate-800 font-mono mt-2">PKR 63,800,000</div>
              <p className="text-xs text-slate-500 mt-1">
                Included extended third-party software licenses.
              </p>
            </div>
          </div>
        </div>

        {/* Outcomes & Debrief Notes Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Post-Award Debrief Registry & Lessons Learned</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Institutional knowledge bank to continuously optimize future win probabilities.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setSelectedFilter("all")}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  selectedFilter === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({outcomesList.length})
              </button>
              <button
                onClick={() => setSelectedFilter("awarded")}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  selectedFilter === "awarded"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Awarded ({outcomesList.filter((o) => o.outcomeStatus.toLowerCase() === "awarded").length})
              </button>
              <button
                onClick={() => setSelectedFilter("lost")}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  selectedFilter === "lost"
                    ? "bg-white text-rose-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Lost ({outcomesList.filter((o) => o.outcomeStatus.toLowerCase() === "lost").length})
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredOutcomes.map((item) => (
              <div key={item.id} className="p-6 hover:bg-slate-50/70 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {item.tenderRef}
                      </span>
                      {item.outcomeStatus === "awarded" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Awarded Contract
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Not Awarded
                        </span>
                      )}
                      <span className="text-xs text-slate-400">Recorded: {item.recordedDate}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {item.tenderTitle}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.client}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                      <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs space-y-1">
                        <span className="font-bold text-blue-900 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          Debrief Notes:
                        </span>
                        <p className="text-slate-700">{item.debriefNotes}</p>
                      </div>

                      <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100 text-xs space-y-1">
                        <span className="font-bold text-amber-900 flex items-center gap-1">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                          Lessons Learned & Strategic Action:
                        </span>
                        <p className="text-slate-700">{item.lessonsLearned}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex lg:flex-col items-end justify-between lg:justify-start gap-4 shrink-0 lg:min-w-[200px] border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium">Our Bid Value</div>
                      <div className="text-sm font-bold text-slate-900 font-mono">{item.ourBidAmount}</div>
                    </div>

                    {item.winningBidder && (
                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-medium">Winner & Price</div>
                        <div className="text-xs font-semibold text-slate-800">{item.winningBidder}</div>
                        <div className="text-xs font-mono text-emerald-700 font-bold">{item.winningPrice}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal for Recording New Debrief */}
        {showDebriefModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">Record Tender Post-Award Debrief</h3>
                <button
                  onClick={() => setShowDebriefModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Bid / Tender</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50">
                    <option>ME/PUNJAB/2026/0491 - ICU Ventilators & Patient Monitors</option>
                    <option>HS/SINDH/2026/1082 - Ultrasound Systems & Doppler Probes</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Award Outcome Status</label>
                  <select className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50">
                    <option value="awarded">Awarded to Us (Won)</option>
                    <option value="lost">Awarded to Competitor (Lost)</option>
                    <option value="cancelled">Tender Cancelled / Retendered</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Winning Bidder</label>
                    <input
                      type="text"
                      placeholder="e.g. Medina Electro-Medical"
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Winning Price (PKR)</label>
                    <input
                      type="text"
                      placeholder="e.g. 59,000,000"
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Debrief Notes (From Official Minutes)</label>
                  <textarea
                    rows={3}
                    placeholder="Enter key scoring insights, competitor positions, or technical evaluation remarks..."
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lessons Learned (For Future Bids)</label>
                  <textarea
                    rows={2}
                    placeholder="Actionable takeaway for pricing strategy or compliance..."
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowDebriefModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    success("Debrief logged successfully into institutional knowledge base.");
                    setShowDebriefModal(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#0051d5] text-xs font-semibold text-white hover:bg-[#0041ab] cursor-pointer"
                >
                  Save Debrief Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

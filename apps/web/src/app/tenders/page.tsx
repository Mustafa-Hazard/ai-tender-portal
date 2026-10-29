"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Bookmark,
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useTenant } from "../../context/TenantContext";
import { TenderCard, TenderCardData } from "../../components/shared/TenderCard";
import { StatusPill } from "../../components/shared/StatusPill";

interface SavedSearchModalState {
  isOpen: boolean;
  name: string;
  cadence: "instant" | "daily_digest" | "weekly";
}

  // Realistic Tenders Catalog (All visibly marked fictional sample per Rule 13)
  const allTenders: (TenderCardData & {
    procurementMethod: string;
    descriptionSnippet: string;
    aiRationale: string;
    proposalCoveragePercent?: number;
  })[] = [
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
      deadlineAt: "2026-11-20T14:00:00+05:00",
      deadlineTimezone: "Asia/Karachi",
      lifecycleStatus: "open",
      sourceName: "Federal EPADS Portal",
      fitScore: 94,
      mandatoryEligibility: "potentially_eligible",
      submissionReadiness: "in_progress",
      proposalCoveragePercent: 45,
      procurementMethod: "Single Stage Two Envelope",
      descriptionSnippet: "Turnkey supply, clinical installation, testing, and 3-year warranty maintenance for 40 invasive ICU ventilators and multi-parameter cardiac monitors.",
      aiRationale: "High 94% fit: Matches your company's registered biomedical category. Valid DRAP manufacturer certification verified in vault.",
    },
    {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      title: "Tier-3 Datacenter Infrastructure & High-Density Hyperconverged Cluster (Sample Fictional Data)",
      buyerName: "Punjab Information Technology Board",
      referenceNumber: "PITB-DC-2026-114",
      category: "IT & Telecom",
      country: "PK",
      city: "Lahore",
      estimatedValue: 480000000,
      currency: "PKR",
      deadlineAt: "2026-11-12T14:00:00+05:00",
      deadlineTimezone: "Asia/Karachi",
      lifecycleStatus: "open",
      sourceName: "Punjab PPRA Feed",
      fitScore: 88,
      mandatoryEligibility: "not_eligible",
      submissionReadiness: "blocked",
      proposalCoveragePercent: 15,
      procurementMethod: "Single Stage Two Envelope",
      descriptionSnippet: "Enterprise cloud hardware, SAN storage expansion, and hyperconverged virtualization cluster for provincial government cloud.",
      aiRationale: "Disqualified: Mandatory PRA Provincial Sales Tax Registration expired 35 days ago (Rule 7 blocker). Must renew before submission.",
      unresolvedFields: ["technical_evaluation_weightage"],
    },
    {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      title: "Emergency Disaster Response Fleet Supply & Logistics Service (Sample Fictional Data)",
      buyerName: "National Disaster Management Authority (NDMA)",
      referenceNumber: "NDMA-FLEET-2026-041",
      category: "Vehicles & Heavy Equipment",
      country: "PK",
      city: "Islamabad",
      estimatedValue: 240000000,
      currency: "PKR",
      deadlineAt: "2026-11-24T12:00:00+05:00",
      deadlineTimezone: "Asia/Karachi",
      lifecycleStatus: "amended",
      sourceName: "Federal EPADS Portal",
      fitScore: 78,
      mandatoryEligibility: "potentially_eligible",
      submissionReadiness: "in_progress",
      proposalCoveragePercent: 60,
      procurementMethod: "Open Competitive Bidding",
      descriptionSnippet: "Supply of 30 specialized 4x4 relief transport vehicles, heavy payload winches, and rapid-deployment logistics support.",
      aiRationale: "Corrigendum 01 issued: delivery compressed from 90 to 45 days. Prior approvals invalidated per Rule 11.",
    },
    {
      id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      title: "Supply of Molecular Biology Reagents & Automated DNA Sequencer (Sample Fictional Data)",
      buyerName: "National Health Research Institute",
      referenceNumber: "NHRI-GEN-2026-012",
      category: "Medical Equipment",
      country: "PK",
      city: "Islamabad",
      estimatedValue: 85000000,
      currency: "PKR",
      deadlineAt: "2026-11-26T14:00:00+05:00",
      deadlineTimezone: "Asia/Karachi",
      lifecycleStatus: "open",
      sourceName: "Federal EPADS Portal",
      fitScore: 82,
      mandatoryEligibility: "potentially_eligible",
      submissionReadiness: "in_progress",
      proposalCoveragePercent: 20,
      procurementMethod: "Open Competitive Bidding",
      descriptionSnippet: "High-throughput next-generation sequencing system and 12-month consumable reagents for genomic epidemiology.",
      aiRationale: "Good category fit (82%). Requires cold-chain freight evidence from authorized distributor.",
    },
    {
      id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      title: "Solar PV Microgrid & 500kVA Smart Inverter Installation (Sample Fictional Data)",
      buyerName: "Energy Department Government of Punjab",
      referenceNumber: "ENERGY-PUN-2026-079",
      category: "Renewable Energy",
      country: "PK",
      city: "Lahore",
      estimatedValue: 135000000,
      currency: "PKR",
      deadlineAt: "2026-11-30T14:00:00+05:00",
      deadlineTimezone: "Asia/Karachi",
      lifecycleStatus: "open",
      sourceName: "Punjab PPRA Feed",
      fitScore: 65,
      mandatoryEligibility: "undetermined",
      submissionReadiness: "in_progress",
      proposalCoveragePercent: 10,
      procurementMethod: "Open Competitive Bidding",
      descriptionSnippet: "Grid-tied rooftop solar power system with lithium-ion BESS battery storage for public secretariat complexes.",
      aiRationale: "Moderate fit (65%). Requires PEC Category C4 or higher electrical engineering license.",
    },
    {
      id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
      title: "Hospital Enterprise PACS Imaging & Cloud Archival System (Sample Fictional Data)",
      buyerName: "Sindh Healthcare Commission",
      referenceNumber: "SHC-PACS-2026-033",
      category: "IT & Telecom",
      country: "PK",
      city: "Karachi",
      estimatedValue: 190000000,
      currency: "PKR",
      deadlineAt: "2026-12-05T14:00:00+05:00",
      deadlineTimezone: "Asia/Karachi",
      lifecycleStatus: "open",
      sourceName: "Sindh PPRA Feed",
      fitScore: 91,
      mandatoryEligibility: "potentially_eligible",
      submissionReadiness: "in_progress",
      proposalCoveragePercent: 35,
      procurementMethod: "Single Stage Two Envelope",
      descriptionSnippet: "Cloud-native DICOM Picture Archiving and Communication System (PACS) with AI-assisted radiologist diagnostic workflows.",
      aiRationale: "91% strong match for healthcare IT suppliers. Meets 99.99% uptime SLA requirements.",
    },
  ];

export default function DiscoverTendersPage() {
  const { activeOrg, uiState } = useTenant();
  const router = useRouter();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [minFitScore, setMinFitScore] = useState(0);
  const [minValue, setMinValue] = useState<string>("");
  const [maxValue, setMaxValue] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [sortBy, setSortBy] = useState<"deadline" | "fit" | "value" | "newest">("deadline");
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Save Search Modal
  const [saveModal, setSaveModal] = useState<SavedSearchModalState>({
    isOpen: false,
    name: "",
    cadence: "daily_digest",
  });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Filtering Logic
  const filteredTenders = useMemo(() => {
    return allTenders.filter((t) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = t.title.toLowerCase().includes(q);
        const buyerMatch = t.buyerName ? t.buyerName.toLowerCase().includes(q) : false;
        const refMatch = t.referenceNumber ? t.referenceNumber.toLowerCase().includes(q) : false;
        const descMatch = t.descriptionSnippet ? t.descriptionSnippet.toLowerCase().includes(q) : false;
        if (!titleMatch && !buyerMatch && !refMatch && !descMatch) return false;
      }

      // Category filter
      if (selectedCategory !== "all" && t.category !== selectedCategory) {
        return false;
      }

      // Region filter
      if (selectedRegion !== "all") {
        if (selectedRegion === "Federal" && t.city !== "Islamabad") return false;
        if (selectedRegion === "Punjab" && t.city !== "Lahore") return false;
        if (selectedRegion === "Sindh" && t.city !== "Karachi") return false;
      }

      // Procurement method filter
      if (selectedMethod !== "all" && t.procurementMethod !== selectedMethod) {
        return false;
      }

      // Source filter
      if (selectedSource !== "all") {
        const src = t.sourceName || "";
        if (selectedSource === "epads" && !src.includes("EPADS")) return false;
        if (selectedSource === "punjab" && !src.includes("Punjab")) return false;
        if (selectedSource === "sindh" && !src.includes("Sindh")) return false;
      }

      // Fit score filter
      const fit = t.fitScore || 0;
      if (fit < minFitScore) return false;

      // Budget min/max
      const val = Number(t.estimatedValue) || 0;
      if (minValue && val < Number(minValue)) return false;
      if (maxValue && val > Number(maxValue)) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === "deadline") {
        const timeA = a.deadlineAt ? new Date(a.deadlineAt).getTime() : 0;
        const timeB = b.deadlineAt ? new Date(b.deadlineAt).getTime() : 0;
        return timeA - timeB;
      }
      if (sortBy === "fit") {
        return (b.fitScore || 0) - (a.fitScore || 0);
      }
      if (sortBy === "value") {
        return (Number(b.estimatedValue) || 0) - (Number(a.estimatedValue) || 0);
      }
      return 0;
    });
  }, [searchQuery, selectedCategory, selectedRegion, selectedMethod, selectedSource, minFitScore, minValue, maxValue, sortBy]);

  const handleSaveSearch = () => {
    if (!saveModal.name.trim()) return;
    setSaveSuccessMsg(`Saved search "${saveModal.name}" created with ${saveModal.cadence.replace("_", " ")} alerts!`);
    setSaveModal({ isOpen: false, name: "", cadence: "daily_digest" });
    setTimeout(() => setSaveSuccessMsg(""), 4000);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedRegion("all");
    setSelectedMethod("all");
    setSelectedSource("all");
    setMinFitScore(0);
    setMinValue("");
    setMaxValue("");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedRegion !== "all" ||
    selectedMethod !== "all" ||
    selectedSource !== "all" ||
    minFitScore > 0 ||
    minValue !== "" ||
    maxValue !== "";

  // Handle Loading UI State
  if (uiState === "loading") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/3"></div>
        <div className="h-14 bg-slate-200 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // Handle Error UI State
  if (uiState === "error") {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center gap-3 text-red-800 font-semibold mb-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          Failed to load live discovery feeds
        </div>
        <p className="text-sm text-red-700 mb-4">
          Could not establish connection to the public tender aggregator cluster.
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
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              Live Feed
            </span>
            <span className="text-xs text-slate-400">
              • Federal EPADS, Punjab PPRA & Sindh SPPRA
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Discover Tenders & Market Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time public opportunities scored against{" "}
            <span className="font-semibold text-slate-700">{activeOrg.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSaveModal({ isOpen: true, name: searchQuery ? `Query: ${searchQuery}` : "Filtered Tender Search", cadence: "daily_digest" })}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <Bookmark className="w-3.5 h-3.5 text-blue-600" />
            Save Current Search
          </button>
          <Link
            href="/saved-searches"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Manage Saved Alerts
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Success Notification if saved */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <Link href="/saved-searches" className="font-semibold underline ml-2">
            View in Saved Searches
          </Link>
        </div>
      )}

      {/* Search & Main Filter Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Universal Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, buyer, reference number, scope..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="Medical Equipment">Medical Equipment</option>
              <option value="IT & Telecom">IT & Telecom</option>
              <option value="Vehicles & Heavy Equipment">Vehicles & Fleet</option>
              <option value="Renewable Energy">Renewable Energy</option>
              <option value="Laboratory Equipment">Lab & Diagnostics</option>
            </select>

            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Regions</option>
              <option value="Federal">Federal Capital (Islamabad)</option>
              <option value="Punjab">Punjab (Lahore)</option>
              <option value="Sindh">Sindh (Karachi)</option>
            </select>

            <button
              onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                showFiltersDrawer || minFitScore > 0 || minValue || maxValue
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              More Filters
              {(minFitScore > 0 || minValue || maxValue) && (
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              )}
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50 p-0.5 ml-auto">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === "grid"
                    ? "bg-white shadow-2xs text-blue-600 font-bold"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === "table"
                    ? "bg-white shadow-2xs text-blue-600 font-bold"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Advanced Filters Tray */}
        {showFiltersDrawer && (
          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Min. Opportunity Fit Score:{" "}
                <span className="text-blue-600 font-bold">{minFitScore}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="95"
                step="5"
                value={minFitScore}
                onChange={(e) => setMinFitScore(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>0% (All)</span>
                <span>50%</span>
                <span>80%+ (High Fit)</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Procurement Method
              </label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-slate-700"
              >
                <option value="all">All Methods</option>
                <option value="Single Stage Two Envelope">Single Stage Two Envelope</option>
                <option value="Open Competitive Bidding">Open Competitive Bidding</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Estimated Value (PKR Min / Max)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min PKR"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  className="w-1/2 p-1.5 border border-slate-300 rounded-lg text-xs"
                />
                <input
                  type="number"
                  placeholder="Max PKR"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  className="w-1/2 p-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Source Portal Feed
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-slate-700"
              >
                <option value="all">All Connected Portals</option>
                <option value="epads">Federal EPADS Portal</option>
                <option value="punjab">Punjab PPRA Feed</option>
                <option value="sindh">Sindh PPRA Feed</option>
              </select>
            </div>
          </div>
        )}

        {/* Active Filters Summary & Sorting */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-medium">
              Showing <strong>{filteredTenders.length}</strong> matching tenders
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="ml-2 text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "deadline" | "fit" | "value" | "newest")}
              className="font-semibold text-slate-700 bg-transparent cursor-pointer focus:outline-hidden"
            >
              <option value="deadline">Deadline (Soonest)</option>
              <option value="fit">Opportunity Fit (Highest)</option>
              <option value="value">Estimated Value (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Zero State if no tenders match */}
      {filteredTenders.length === 0 ? (
        <div className="p-12 bg-white rounded-xl border border-dashed border-slate-300 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 text-base">
            No opportunities match your current criteria
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try loosening category constraints, lowering the minimum fit score slider, or clearing the search query.
          </p>
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View with Rich Tender Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTenders.map((tender) => (
            <div key={tender.id} className="relative group">
              <TenderCard
                tender={tender}
                onSelect={(id) => {
                  router.push(`/tenders/${id}`);
                }}
              />
              {/* "Why Recommended" AI Rationale Tooltip Banner */}
              <div className="mt-1.5 p-2 rounded-lg bg-blue-50/80 border border-blue-100 text-[11px] text-blue-900 flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed">{tender.aiRationale}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Tender & Buyer</th>
                  <th className="py-3 px-3">Est. Value</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Deadline</th>
                  <th className="py-3 px-3 text-center">Fit Score</th>
                  <th className="py-3 px-3 text-center">Mandatory Eligibility</th>
                  <th className="py-3 px-3 text-center">Readiness</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTenders.map((tender) => (
                  <tr key={tender.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <Link
                        href={`/tenders/${tender.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600 block line-clamp-1"
                      >
                        {tender.title}
                      </Link>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {tender.referenceNumber} • {tender.buyerName}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono font-medium text-slate-800">
                      {tender.estimatedValue
                        ? `${tender.currency} ${tender.estimatedValue.toLocaleString()}`
                        : "Not stated"}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {tender.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-mono text-slate-700">
                        {tender.deadlineAt ? tender.deadlineAt.slice(0, 10) : "Not stated"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {tender.deadlineTimezone || "Asia/Karachi"}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
                          (tender.fitScore || 0) >= 80
                            ? "bg-emerald-100 text-emerald-800"
                            : (tender.fitScore || 0) >= 60
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {tender.fitScore}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <StatusPill
                        category="eligibility"
                        label={
                          tender.mandatoryEligibility === "potentially_eligible"
                            ? "Eligible"
                            : tender.mandatoryEligibility === "not_eligible"
                            ? "Disqualified"
                            : "Undetermined"
                        }
                        variant={
                          tender.mandatoryEligibility === "potentially_eligible"
                            ? "success"
                            : tender.mandatoryEligibility === "not_eligible"
                            ? "danger"
                            : "warning"
                        }
                      />
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <StatusPill
                        category="readiness"
                        label={
                          tender.submissionReadiness === "ready_to_submit"
                            ? "Ready"
                            : tender.submissionReadiness === "blocked"
                            ? "Blocked"
                            : "In Progress"
                        }
                        variant={
                          tender.submissionReadiness === "ready_to_submit"
                            ? "success"
                            : tender.submissionReadiness === "blocked"
                            ? "danger"
                            : "info"
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/tenders/${tender.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold transition-colors"
                      >
                        Inspect <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save Search Modal */}
      {saveModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-900 text-base">Save Search & Alert</h2>
              </div>
              <button
                onClick={() => setSaveModal({ ...saveModal, isOpen: false })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Save your current filters to automatically monitor newly ingested tenders and receive email notifications.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Saved Search Name:
                </label>
                <input
                  type="text"
                  value={saveModal.name}
                  onChange={(e) => setSaveModal({ ...saveModal, name: e.target.value })}
                  placeholder="e.g. Federal Medical Equipment &gt; 100M PKR"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alert Cadence:
                </label>
                <select
                  value={saveModal.cadence}
                  onChange={(e) => setSaveModal({ ...saveModal, cadence: e.target.value as "instant" | "daily_digest" | "weekly" })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
                >
                  <option value="daily_digest">Daily Digest (9:00 AM PKT)</option>
                  <option value="instant">Instant Notification (Real-time Crawl Sync)</option>
                  <option value="weekly">Weekly Summary (Every Monday)</option>
                </select>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-[11px] text-slate-600">
                <span className="font-semibold block text-slate-800">Saved Criteria:</span>
                <div>• Category: {selectedCategory}</div>
                <div>• Region: {selectedRegion}</div>
                {minFitScore > 0 && <div>• Min Fit Score: {minFitScore}%</div>}
                {minValue && <div>• Min Value: PKR {Number(minValue).toLocaleString()}</div>}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSaveModal({ ...saveModal, isOpen: false })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={!saveModal.name.trim()}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-xs disabled:opacity-50"
              >
                Confirm & Create Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

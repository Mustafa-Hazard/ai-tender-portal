"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Play,
  Trash2,
  Plus,
  Search,
  ArrowRight,
  X,
  Mail,
  Zap,
} from "lucide-react";
import { useTenant } from "../../context/TenantContext";

interface SavedSearchItem {
  id: string;
  name: string;
  category: string;
  region: string;
  minValue?: number;
  cadence: "instant" | "daily_digest" | "weekly" | "paused";
  matchesCount: number;
  lastRun: string;
  createdAt: string;
}

export default function SavedSearchesPage() {
  const { activeOrg, uiState } = useTenant();

  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>([
    {
      id: "sav-001",
      name: "Federal ICU & Healthcare Equipment > 100M",
      category: "Medical Equipment",
      region: "Federal Capital",
      minValue: 100000000,
      cadence: "daily_digest",
      matchesCount: 14,
      lastRun: "Today at 09:00 AM PKT",
      createdAt: "2026-10-09",
    },
    {
      id: "sav-002",
      name: "Punjab Cloud & Datacenter Infrastructure",
      category: "IT & Telecom",
      region: "Punjab",
      minValue: 50000000,
      cadence: "instant",
      matchesCount: 8,
      lastRun: "12 minutes ago",
      createdAt: "2026-10-10",
    },
    {
      id: "sav-003",
      name: "Emergency Mobility & Fleet Logistics",
      category: "Vehicles & Heavy Equipment",
      region: "Federal Capital",
      cadence: "weekly",
      matchesCount: 5,
      lastRun: "Yesterday at 09:00 AM PKT",
      createdAt: "2026-10-11",
    },
  ]);

  const [searchFilter, setSearchFilter] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSearchName, setNewSearchName] = useState("");
  const [newCategory, setNewCategory] = useState("Medical Equipment");
  const [newRegion, setNewRegion] = useState("Federal Capital");
  const [newCadence, setNewCadence] = useState<"instant" | "daily_digest" | "weekly">("daily_digest");

  const filteredSearches = savedSearches.filter((s) =>
    s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.region.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setSavedSearches((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleCadence = (id: string, newCadence: SavedSearchItem["cadence"]) => {
    setSavedSearches((prev) =>
      prev.map((s) => (s.id === id ? { ...s, cadence: newCadence } : s))
    );
  };

  const handleCreateSearch = () => {
    if (!newSearchName.trim()) return;
    const item: SavedSearchItem = {
      id: `sav-${Date.now().toString().slice(-4)}`,
      name: newSearchName.trim(),
      category: newCategory,
      region: newRegion,
      cadence: newCadence,
      matchesCount: 6,
      lastRun: "Just now",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setSavedSearches([item, ...savedSearches]);
    setIsCreateModalOpen(false);
    setNewSearchName("");
  };

  // Loading State
  if (uiState === "loading") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
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
              Automated Feed Monitor
            </span>
            <span className="text-xs text-slate-400">• Email & Webhook Alerts</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Saved Searches & Intelligent Alerts
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Automated queries monitoring public feeds for{" "}
            <span className="font-semibold text-slate-700">{activeOrg.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Saved Search
          </button>
          <Link
            href="/tenders"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
          >
            Discover All Tenders
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Quick Search & Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search saved queries..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>
            Active Alerts:{" "}
            <strong className="text-slate-800">
              {savedSearches.filter((s) => s.cadence !== "paused").length}
            </strong>
          </span>
          <span>•</span>
          <span>
            Total Monitored Opportunities:{" "}
            <strong className="text-emerald-700 font-mono">
              {savedSearches.reduce((sum, s) => sum + s.matchesCount, 0)}
            </strong>
          </span>
        </div>
      </div>

      {/* Saved Searches Grid or Empty State */}
      {filteredSearches.length === 0 ? (
        <div className="p-12 bg-white rounded-xl border border-dashed border-slate-300 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 text-base">
            No saved searches found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create automated search alerts to get notified whenever new tenders matching your criteria are published on EPADS or PPRA.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Saved Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSearches.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-shadow space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Bookmark className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                        {item.name}
                      </h3>
                      <span className="text-[11px] text-slate-400">Created {item.createdAt}</span>
                    </div>
                  </div>
                </div>

                {/* Filter tags */}
                <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                    Category: {item.category}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                    Region: {item.region}
                  </span>
                  {item.minValue && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200 font-mono">
                      &gt; PKR {item.minValue / 1000000}M
                    </span>
                  )}
                </div>

                {/* Cadence Pill */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    {item.cadence === "instant" ? (
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <span className="capitalize font-semibold">
                      {item.cadence.replace("_", " ")}
                    </span>
                  </div>
                  <select
                    value={item.cadence}
                    onChange={(e) => handleToggleCadence(item.id, e.target.value as SavedSearchItem["cadence"])}
                    className="bg-transparent text-[11px] font-semibold text-blue-600 cursor-pointer focus:outline-hidden"
                  >
                    <option value="daily_digest">Daily Digest</option>
                    <option value="instant">Instant Alert</option>
                    <option value="weekly">Weekly</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xl font-bold font-mono text-emerald-600 block">
                    {item.matchesCount}
                  </span>
                  <span className="text-[10px] text-slate-400">matching opportunities</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete saved query"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/tenders?category=${encodeURIComponent(item.category)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-2xs transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" /> Run Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: New Saved Search */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="font-bold text-slate-900 text-base">New Automated Search Alert</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alert Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Biomedical High-Value Opportunities"
                  value={newSearchName}
                  onChange={(e) => setNewSearchName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Target:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
                >
                  <option value="Medical Equipment">Medical Equipment</option>
                  <option value="IT & Telecom">IT & Telecom</option>
                  <option value="Vehicles & Heavy Equipment">Vehicles & Heavy Equipment</option>
                  <option value="Renewable Energy">Renewable Energy</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Geographic Region:</label>
                <select
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
                >
                  <option value="Federal Capital">Federal Capital (Islamabad)</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Sindh">Sindh</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notification Cadence:</label>
                <select
                  value={newCadence}
                  onChange={(e) => setNewCadence(e.target.value as "instant" | "daily_digest" | "weekly")}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
                >
                  <option value="daily_digest">Daily Digest (9:00 AM PKT)</option>
                  <option value="instant">Instant Notification (Real-time Crawl Sync)</option>
                  <option value="weekly">Weekly Summary (Every Monday)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSearch}
                disabled={!newSearchName.trim()}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-xs disabled:opacity-50"
              >
                Create Alert Query
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

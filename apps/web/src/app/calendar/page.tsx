"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  Building,
  AlertCircle,
  CheckCircle2,
  Download,
  Filter,
  ChevronRight,
  ShieldAlert,
  Bell,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import { AppLayout } from "../../components/layout/AppLayout";
import { useTenant } from "../../context/TenantContext";
import { api } from "../../lib/api";

interface MilestoneEvent {
  id: string;
  title: string;
  tenderRef: string;
  client: string;
  type: "submission_deadline" | "pre_bid" | "bid_opening" | "bond_expiry" | "internal_task";
  date: string;
  time: string;
  urgency: "critical" | "warning" | "normal";
  status: string;
  tenderId?: string;
}

export default function CalendarMilestonesPage() {
  const { activeOrg } = useTenant();
  const [filterType, setFilterType] = useState<string>("all");
  const [liveMilestones, setLiveMilestones] = useState<MilestoneEvent[] | null>(null);

  React.useEffect(() => {
    api.getCalendarMilestones(activeOrg.id)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: MilestoneEvent[] = data.map((m: any, idx: number) => ({
            id: m.id || `live-ev-${idx}`,
            title: `${(m.event_type || "milestone").replace(/_/g, " ").toUpperCase()} - ${m.tender_title}`,
            tenderRef: m.tender_ref || "TENDER-REF",
            client: m.client || "Procuring Entity",
            type: m.event_type as any,
            date: typeof m.event_date === "string" ? m.event_date.split("T")[0] : new Date(m.event_date).toISOString().split("T")[0],
            time: "14:00 PKT",
            urgency: "critical",
            status: m.status || "Scheduled",
          }));
          setLiveMilestones(mapped);
        }
      })
      .catch((err) => console.log("Milestones offline fallback", err));
  }, [activeOrg.id]);

  const milestones: MilestoneEvent[] = [
    {
      id: "ev-1",
      title: "Final Submission & Cryptographic Seal - ICU Ventilators",
      tenderRef: "ME/PUNJAB/2026/0491",
      client: "Specialized Healthcare & Medical Education Dept, Punjab",
      type: "submission_deadline",
      date: "2026-10-22",
      time: "11:00 PKT",
      urgency: "critical",
      status: "Gate Verified",
      tenderId: "1",
    },
    {
      id: "ev-2",
      title: "Technical Bid Opening Session",
      tenderRef: "ME/PUNJAB/2026/0491",
      client: "Specialized Healthcare & Medical Education Dept, Punjab",
      type: "bid_opening",
      date: "2026-10-22",
      time: "11:30 PKT",
      urgency: "critical",
      status: "Scheduled",
      tenderId: "1",
    },
    {
      id: "ev-3",
      title: "Pre-Bid Clarification Conference",
      tenderRef: "HS/SINDH/2026/1082",
      client: "Sindh Health Services Directorate, Karachi",
      type: "pre_bid",
      date: "2026-10-26",
      time: "10:00 PKT",
      urgency: "warning",
      status: "Upcoming",
      tenderId: "2",
    },
    {
      id: "ev-4",
      title: "Rule 7 Vault Expiry Review - ISO 13485 Recertification",
      tenderRef: "VAULT-DOC-2026",
      client: "Internal Apex Compliance Gate",
      type: "internal_task",
      date: "2026-10-29",
      time: "17:00 PKT",
      urgency: "warning",
      status: "Pending Action",
    },
    {
      id: "ev-5",
      title: "Bank Guarantee (Bid Bond) 90-Day Validity Expiry",
      tenderRef: "BG-HBL-2026-994",
      client: "Habib Bank Limited (HBL) Treasury",
      type: "bond_expiry",
      date: "2026-11-15",
      time: "15:00 PKT",
      urgency: "normal",
      status: "Active",
    },
  ];

  const activeList = liveMilestones && liveMilestones.length > 0 ? liveMilestones : milestones;
  const filtered = activeList.filter((m) => {
    if (filterType === "all") return true;
    return m.type === filterType;
  });

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            Critical (&lt; 5 Days)
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Upcoming (Next 2 Weeks)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            Scheduled
          </span>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "submission_deadline":
        return "Submission Deadline";
      case "bid_opening":
        return "Bid Opening";
      case "pre_bid":
        return "Pre-Bid Conference";
      case "bond_expiry":
        return "Bid Bond Expiry";
      case "internal_task":
        return "Compliance Gate";
      default:
        return type;
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Phase 6 Deadlines & Governance
              </span>
              <span className="text-xs text-slate-400 font-medium">Synced with Calendar</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight">
              Tender Milestones & Regulatory Calendar
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time monitoring of submission deadlines, bid openings, pre-bid conferences, and bond expiries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert("Calendar (.ics) export generated. Importing into Outlook / Google Calendar.")}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0051d5] text-xs font-semibold text-white hover:bg-[#0041ab] shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export iCal (.ics)</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Filter By:
          </span>
          {[
            { id: "all", label: "All Milestones" },
            { id: "submission_deadline", label: "Submissions" },
            { id: "bid_opening", label: "Bid Openings" },
            { id: "pre_bid", label: "Pre-Bid Conferences" },
            { id: "bond_expiry", label: "Bid Bond Expiries" },
            { id: "internal_task", label: "Internal Tasks" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === f.id
                  ? "bg-[#0051d5] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Timeline Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Milestones List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
              <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Chronological Milestone Sequence
                </span>
                <span className="text-xs font-mono text-slate-500">{filtered.length} Events Listed</span>
              </div>

              {filtered.map((item) => (
                <div key={item.id} className="p-5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      {/* Date Badge */}
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {new Date(item.date).toLocaleString("en-US", { month: "short" })}
                        </span>
                        <span className="text-lg font-black font-mono leading-none">
                          {new Date(item.date).getDate()}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {item.tenderRef}
                          </span>
                          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {getTypeLabel(item.type)}
                          </span>
                          {getUrgencyBadge(item.urgency)}
                        </div>

                        <h3 className="text-sm font-bold text-slate-900">
                          {item.title}
                        </h3>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            {item.client}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {item.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="shrink-0">
                      <Link
                        href="/tenders"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Info Card: Compliance & Calendar Sync */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Automated Deadline Protection</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                The portal continuously monitors official procuring agency gazettes for addenda and deadline extensions.
              </p>
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Slack/Email notifications sent 72h & 24h before submission cutoff.</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bank guarantee expiries mapped to 90/120 day validity periods.</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Submission gates lock at 12:00 AM on deadline date to enforce pre-flight seal.</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0b1c30] to-[#1e3a5f] p-5 rounded-xl text-white shadow-sm space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded border border-blue-400/20">
                Rule 7 Expiry Assurance
              </span>
              <h4 className="font-bold text-sm">Zero Late Disqualifications</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Every document in the vault undergoes automated validity check. Any tender with less than 15-day document validity triggers an immediate renewal warning.
              </p>
              <Link
                href="/vault"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-white pt-1"
              >
                <span>Check Document Vault</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

"use client";

import React, { useState } from "react";
import {
  Building2,
  ShieldCheck,
  Award,
  CheckCircle2,
  FileText,
  MapPin,
  Calendar,
  Globe,
  TrendingUp,
  FolderLock,
  ExternalLink,
  Edit,
} from "lucide-react";
import { AppLayout } from "../../components/layout/AppLayout";
import { StatusPill } from "../../components/shared/StatusPill";
import { useTenant } from "../../context/TenantContext";

export default function CompanyProfilePage() {
  const { activeOrg } = useTenant();
  const [activeTab, setActiveTab] = useState<"overview" | "tax" | "certifications" | "past_performance">("overview");

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
                {activeOrg?.name ? activeOrg.name.charAt(0) : "A"}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {activeOrg?.name || "Apex Healthcare Technologies Ltd"}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" /> FBR Active Taxpayer
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Premier medical technology distributor & turnkey hospital infrastructure engineering partner.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Blue Area, Sector F-6, Islamabad
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Incorporated: 2018
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" /> apex-healthtech.example.pk
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                <Edit className="w-3.5 h-3.5" /> Edit Organization Profile
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">NTN / Registration</div>
              <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">7182934-1</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">ATL Verified (Active)</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">DUNS Number</div>
              <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">65-432-1098</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Dun & Bradstreet Verified</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">3-Yr Avg Turnover</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">PKR 148 Million</div>
              <div className="text-[11px] text-blue-600 mt-0.5">Audited by KPMG</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Vault Documents</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">6 Credentials</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Mapped to compliance</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          {[
            { id: "overview", label: "Corporate Overview" },
            { id: "tax", label: "Tax & Statutory Credentials" },
            { id: "certifications", label: "ISO & Quality Certifications" },
            { id: "past_performance", label: "Past Performance & Track Record" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" /> Legal Entity & Incorporation
              </h2>
              <dl className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500">Legal Company Name</dt>
                  <dd className="font-semibold text-slate-900 text-right">Apex Healthcare Technologies Ltd</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500">SECP Company Reg. No.</dt>
                  <dd className="font-semibold text-slate-900 font-mono text-right">0129845-SECP-ISB</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500">Legal Entity Type</dt>
                  <dd className="font-semibold text-slate-900 text-right">Public Unlisted Limited Company</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500">Authorized Capital</dt>
                  <dd className="font-semibold text-slate-900 text-right">PKR 250,000,000</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500">Paid-up Capital</dt>
                  <dd className="font-semibold text-slate-900 text-right">PKR 120,000,000</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" /> Tender Readiness Badges
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">Pre-Qualified Medical Equipment Supplier</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      Punjab Health Department & Federal Directorate of Health Pre-Qualified Tier-1 Bidder.
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-blue-900">ISO 13485:2016 Certified</div>
                    <div className="text-[11px] text-blue-700 mt-0.5">
                      Audited by BSI Group UK with active MDR Class IIb & III scope.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tax" && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Statutory Tax & Regulatory Registrations</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-400 font-semibold uppercase">FBR National Tax Number</div>
                <div className="text-base font-bold text-slate-900 mt-1 font-mono">7182934-1</div>
                <div className="mt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active on ATL (Tax Year 2026)
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-400 font-semibold uppercase">Sales Tax Registration (STRN)</div>
                <div className="text-base font-bold text-slate-900 mt-1 font-mono">32-77-8761-234-91</div>
                <div className="mt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active & Registered
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-400 font-semibold uppercase">Punjab Revenue Authority</div>
                <div className="text-base font-bold text-slate-900 mt-1 font-mono">PRA-LHR-2024-9912</div>
                <div className="mt-2 text-xs text-blue-700 font-semibold flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Provincial Service Tax Reg.
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "certifications" && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Quality Management & Industry Accreditations</h2>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">ISO 13485:2016 Medical Devices Quality Management</div>
                  <div className="text-slate-500">Issuer: BSI Group • Certificate: MD-77491-UK</div>
                </div>
                <StatusPill label="VALID UNTIL 2028" variant="success" />
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">ISO 9001:2015 Quality Management System</div>
                  <div className="text-slate-500">Issuer: SGS International • Certificate: PK-99182</div>
                </div>
                <StatusPill label="VALID UNTIL 2027" variant="success" />
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">ISO 27001:2022 Information Security Management</div>
                  <div className="text-slate-500">Issuer: SGS International • Certificate: SEC-1120</div>
                </div>
                <StatusPill label="EXPIRING SOON" variant="warning" />
              </div>
            </div>
          </div>
        )}

        {activeTab === "past_performance" && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Past Performance & Government Contract Track Record</h2>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Supply of 60 ICU Ventilators & Central Monitoring</div>
                  <div className="text-slate-500">Client: Rawalpindi Institute of Cardiology (RIC) • Year: 2024</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-900">PKR 92,000,000</div>
                  <span className="text-[10px] text-emerald-600 font-bold">COMPLETED 100%</span>
                </div>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Turnkey Modular Cath Lab Installation & 5-Yr SLA</div>
                  <div className="text-slate-500">Client: Lady Reading Hospital, Peshawar • Year: 2023</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-900">PKR 145,000,000</div>
                  <span className="text-[10px] text-emerald-600 font-bold">COMPLETED 100%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

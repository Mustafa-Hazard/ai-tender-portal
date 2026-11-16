"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Globe2,
  Briefcase,
  FileText,
  Users,
  Bell,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { useTenant } from "../../context/TenantContext";

export default function OnboardingPage() {
  const router = useRouter();
  const { activeOrg, setActiveOrg } = useTenant();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [orgName, setOrgName] = useState(activeOrg.name);
  const [country, setCountry] = useState("PK");
  const [ntn, setNtn] = useState(activeOrg.ntn || "1234567-8");
  const [secp, setSecp] = useState(activeOrg.secp || "0098765");

  const [categories, setCategories] = useState<string[]>([
    "Medical Equipment",
    "Hospital Systems",
  ]);
  const [regions, setRegions] = useState<string[]>(["Federal Capital", "Punjab"]);

  const [turnover, setTurnover] = useState("185000000");
  const [companySize, setCompanySize] = useState("Medium (50-249)");

  const [uploadedDocs] = useState<
    { name: string; type: string; expiresOn: string }[]
  >([
    {
      name: "Active Taxpayer Status 2026.pdf",
      type: "FBR Tax Registration",
      expiresOn: "2027-06-30",
    },
    {
      name: "ISO 13485 Certificate.pdf",
      type: "Quality Management",
      expiresOn: "2028-12-31",
    },
  ]);

  const [teamMembers, setTeamMembers] = useState<
    { email: string; role: string }[]
  >([
    { email: "fatima.bid@example.com", role: "bid_manager" },
    { email: "bilal.comp@example.com", role: "compliance_reviewer" },
  ]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("bid_manager");

  const [alertFrequency, setAlertFrequency] = useState("daily");
  const [minFitScore, setMinFitScore] = useState(75);

  const steps = [
    { number: 1, title: "Organization", icon: Building2 },
    { number: 2, title: "Industries & Regions", icon: Globe2 },
    { number: 3, title: "Capabilities", icon: Briefcase },
    { number: 4, title: "Document Vault", icon: FileText },
    { number: 5, title: "Team & Roles", icon: Users },
    { number: 6, title: "Alert Preferences", icon: Bell },
  ];

  // Dynamic completeness calculation
  const completeness = Math.min(
    100,
    Math.round(
      (Number(Boolean(orgName && ntn)) * 20) +
        (Number(categories.length > 0) * 15) +
        (Number(Boolean(turnover)) * 15) +
        (Number(uploadedDocs.length > 0) * 20) +
        (Number(teamMembers.length > 0) * 15) +
        (Number(Boolean(alertFrequency)) * 15)
    )
  );

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save and finish
      setActiveOrg({
        ...activeOrg,
        name: orgName,
        ntn,
        secp,
        categories,
        regions,
        profileCompleteness: completeness,
      });
      router.push("/");
    }
  };

  const handleCompleteLater = () => {
    setActiveOrg({
      ...activeOrg,
      profileCompleteness: completeness,
    });
    router.push("/");
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      {/* Top Header & Completeness Meter */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-[#0b1c30]">
              Supplier Workspace Onboarding
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure your procurement profile, eligibility evidence, and team permissions.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCompleteLater}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            Complete Later & Browse Tenders →
          </button>
        </div>

        {/* Profile Completeness Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Profile Completeness:</span>
            <span className="font-mono text-blue-700">{completeness}% Complete</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-6 gap-2 mt-6 pt-4 border-t border-slate-100">
          {steps.map((s) => {
            const Icon = s.icon;
            const isDone = s.number < currentStep;
            const isCurrent = s.number === currentStep;

            return (
              <button
                key={s.number}
                type="button"
                onClick={() => setCurrentStep(s.number)}
                className={`flex flex-col items-center text-center p-2 rounded-md transition-colors cursor-pointer ${
                  isCurrent
                    ? "bg-blue-50 text-blue-900 font-bold border border-blue-200"
                    : isDone
                    ? "text-emerald-700 font-medium hover:bg-slate-50"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="text-xs">Step {s.number}</span>
                </div>
                <span className="text-[11px] truncate w-full hidden sm:block">
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs min-h-[380px] flex flex-col justify-between">
        <div>
          {/* STEP 1: Organization Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                1. Organization Identity & Legal Identifiers
              </h2>
              <p className="text-xs text-slate-500">
                Enter your registered legal entity details for Pakistan public procurement verification.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Legal Company Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration Jurisdiction
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white text-slate-800"
                  >
                    <option value="PK">Pakistan (Federal & Provincial PPRA)</option>
                    <option value="AE">United Arab Emirates</option>
                    <option value="SA">Saudi Arabia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    FBR National Tax Number (NTN)
                  </label>
                  <input
                    type="text"
                    value={ntn}
                    onChange={(e) => setNtn(e.target.value)}
                    placeholder="e.g. 1234567-8"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SECP Incorporation / Registration Number
                  </label>
                  <input
                    type="text"
                    value={secp}
                    onChange={(e) => setSecp(e.target.value)}
                    placeholder="e.g. 0098765"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white text-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Industries & Regions */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                2. Target Sectors & Geographic Coverage
              </h2>
              <p className="text-xs text-slate-500">
                Select your procurement categories and operational regions for tender matching.
              </p>

              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Target Procurement Categories (Select multiple)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Medical Devices",
                    "Hospital Systems",
                    "Pharmaceuticals",
                    "Information Technology",
                    "Cloud Computing",
                    "Heavy Vehicles",
                    "Civil Construction",
                    "Consulting Services",
                  ].map((cat) => {
                    const isSelected = categories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setCategories(categories.filter((c) => c !== cat));
                          } else {
                            setCategories([...categories, cat]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs border font-medium cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 font-bold"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {cat} {isSelected ? "✓" : "+"}
                      </button>
                    );
                  })}
                </div>

                <label className="block text-xs font-semibold text-slate-700 pt-3">
                  Operating Provinces & Territories
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Federal Capital", "Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan"].map(
                    (reg) => {
                      const isSelected = regions.includes(reg);
                      return (
                        <button
                          key={reg}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setRegions(regions.filter((r) => r !== reg));
                            } else {
                              setRegions([...regions, reg]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs border font-medium cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-600 font-bold"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {reg} {isSelected ? "✓" : "+"}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Capabilities & Financial Thresholds */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                3. Company Scale & Financial Capacity
              </h2>
              <p className="text-xs text-slate-500">
                Determines financial qualification checks for mandatory turnover clauses.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company Enterprise Scale
                  </label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white text-slate-800"
                  >
                    <option value="Micro (<10)">Micro (&lt;10 Employees)</option>
                    <option value="Small (10-49)">Small (10-49 Employees)</option>
                    <option value="Medium (50-249)">Medium (50-249 Employees)</option>
                    <option value="Large (250+)">Large Enterprise (250+ Employees)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Average Annual Turnover (PKR)
                  </label>
                  <input
                    type="number"
                    value={turnover}
                    onChange={(e) => setTurnover(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white text-slate-800 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Calculated average over last 3 audited financial fiscal years.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Initial Document Vault Drop */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    4. Document Vault & Evidence Verification
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pre-load active certificates so AI can automatically verify mandatory tender compliance.
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                  Optional: Skip now, upload anytime
                </span>
              </div>

              <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 text-center">
                <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-800">
                  Drop Compliance Documents Here
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Tax registration, ISO certificates, PEC/SECP certificates, audited financials (PDF, DOCX up to 50MB)
                </p>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Vault Evidence Ready ({uploadedDocs.length})
                </h4>
                {uploadedDocs.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded border border-slate-200 bg-white text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-semibold text-slate-800">{doc.name}</div>
                        <div className="text-[10px] text-slate-400">{doc.type}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Valid to: {doc.expiresOn}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Invite Team Members & Assign RBAC */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                5. Team Members & RBAC Permission Roles
              </h2>
              <p className="text-xs text-slate-500">
                Assign role-based access for separation of duties across bid preparation and sign-offs.
              </p>

              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="colleague@yourcompany.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 text-xs p-2.5 border border-slate-300 rounded-md bg-white text-slate-800"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="text-xs p-2.5 border border-slate-300 rounded-md bg-white text-slate-800 capitalize"
                >
                  <option value="bid_manager">Bid Manager</option>
                  <option value="compliance_reviewer">Compliance Reviewer</option>
                  <option value="technical_contributor">Technical Contributor</option>
                  <option value="finance_contributor">Finance Contributor</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (newEmail.trim()) {
                      setTeamMembers([...teamMembers, { email: newEmail, role: newRole }]);
                      setNewEmail("");
                    }
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Invite
                </button>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
                {teamMembers.map((m, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs bg-white">
                    <span className="font-medium text-slate-800">{m.email}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 capitalize">
                      {m.role.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: Alert & Notification Preferences */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                6. Tender Opportunity Alerts & Notification Cadence
              </h2>
              <p className="text-xs text-slate-500">
                Set how often you receive updates on matching tenders and corrigendum addenda.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notification Digest Cadence
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["instant", "daily", "weekly"].map((cadence) => (
                      <button
                        key={cadence}
                        type="button"
                        onClick={() => setAlertFrequency(cadence)}
                        className={`p-3 rounded-md border text-center text-xs font-bold capitalize cursor-pointer transition-colors ${
                          alertFrequency === cadence
                            ? "bg-blue-50 text-blue-900 border-blue-400"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {cadence} Digest
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum Opportunity Fit Score Threshold ({minFitScore}%)
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={minFitScore}
                    onChange={(e) => setMinFitScore(Number(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>50% (Broad)</span>
                    <span>75% (Recommended)</span>
                    <span>95% (Strict Fit)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded text-xs font-bold hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCompleteLater}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Complete Later
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 bg-[#0051d5] hover:bg-[#0041ab] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <span>{currentStep === 6 ? "Finish & Launch Workspace" : "Continue"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

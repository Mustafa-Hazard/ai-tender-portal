"use client";

import React, { useState } from "react";
import {
  FolderLock,
  Plus,
  Search,
  Filter,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Eye,
  Trash2,
  UploadCloud,
  X,
  FileCheck,
  Calendar,
  Building,
} from "lucide-react";
import { AppLayout } from "../../components/layout/AppLayout";
import { StatusPill } from "../../components/shared/StatusPill";
import { DocumentPreviewShell } from "../../components/shared/DocumentPreviewShell";
import { useTenant } from "../../context/TenantContext";

interface VaultDoc {
  id: string;
  title: string;
  docType: string;
  version: number;
  issuer: string;
  issuedOn: string;
  expiresOn: string;
  isExpired: boolean;
  daysToExpiry: number;
  category: "tax" | "quality" | "financial" | "legal";
  jurisdiction: string;
  confidentiality: string;
  approvalState: "approved" | "pending" | "rejected";
  storageSize: string;
}

const INITIAL_DOCS: VaultDoc[] = [
  {
    id: "doc-1",
    title: "Active Taxpayer Status Certificate 2026-27",
    docType: "FBR Tax Active Taxpayer Certificate",
    version: 1,
    issuer: "Federal Board of Revenue (FBR)",
    issuedOn: "2026-07-01",
    expiresOn: "2027-07-14",
    isExpired: false,
    daysToExpiry: 272,
    category: "tax",
    jurisdiction: "Pakistan (Federal)",
    confidentiality: "Internal",
    approvalState: "approved",
    storageSize: "1.4 MB",
  },
  {
    id: "doc-2",
    title: "ISO 13485:2016 Medical Devices Quality Management System",
    docType: "ISO 13485 Medical Devices Certification",
    version: 2,
    issuer: "BSI Group UK",
    issuedOn: "2023-10-12",
    expiresOn: "2028-10-11",
    isExpired: false,
    daysToExpiry: 727,
    category: "quality",
    jurisdiction: "Global / International",
    confidentiality: "Public / Tender Evidence",
    approvalState: "approved",
    storageSize: "2.8 MB",
  },
  {
    id: "doc-3",
    title: "Annual Audited Accounts FY2024-2025",
    docType: "Audited Financial Statements",
    version: 1,
    issuer: "KPMG Taseer Hadi & Co.",
    issuedOn: "2025-09-30",
    expiresOn: "2027-06-14",
    isExpired: false,
    daysToExpiry: 242,
    category: "financial",
    jurisdiction: "Pakistan",
    confidentiality: "Restricted",
    approvalState: "approved",
    storageSize: "4.2 MB",
  },
  {
    id: "doc-4",
    title: "PRA Provincial Tax Clearance Certificate 2025",
    docType: "Provincial Sales Tax Registration",
    version: 1,
    issuer: "Punjab Revenue Authority (PRA)",
    issuedOn: "2025-08-01",
    expiresOn: "2026-09-07",
    isExpired: true,
    daysToExpiry: -37,
    category: "tax",
    jurisdiction: "Punjab, Pakistan",
    confidentiality: "Internal",
    approvalState: "rejected",
    storageSize: "890 KB",
  },
  {
    id: "doc-5",
    title: "ISO 27001:2022 Information Security Management",
    docType: "ISO 27001 Security Accreditation",
    version: 1,
    issuer: "SGS International",
    issuedOn: "2025-11-20",
    expiresOn: "2026-11-15",
    isExpired: false,
    daysToExpiry: 32,
    category: "quality",
    jurisdiction: "Global",
    confidentiality: "Internal",
    approvalState: "approved",
    storageSize: "1.9 MB",
  },
  {
    id: "doc-6",
    title: "Certificate of Incorporation & SECP Form 29",
    docType: "SECP Incorporation Charter",
    version: 1,
    issuer: "Securities & Exchange Commission of Pakistan",
    issuedOn: "2018-03-14",
    expiresOn: "2099-12-31",
    isExpired: false,
    daysToExpiry: 26740,
    category: "legal",
    jurisdiction: "Pakistan",
    confidentiality: "Public",
    approvalState: "approved",
    storageSize: "3.1 MB",
  },
];

export default function DocumentVaultPage() {
  const { activeOrg } = useTenant();
  const [documents, setDocuments] = useState<VaultDoc[]>(INITIAL_DOCS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [previewDoc, setPreviewDoc] = useState<VaultDoc | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // New doc form state
  const [newTitle, setNewTitle] = useState("");
  const [newDocType, setNewDocType] = useState("Tax Certificate");
  const [newIssuer, setNewIssuer] = useState("");
  const [newExpiresOn, setNewExpiresOn] = useState("");
  const [newCategory, setNewCategory] = useState<"tax" | "quality" | "financial" | "legal">("tax");

  const expiredCount = documents.filter((d) => d.isExpired).length;
  const expiringSoonCount = documents.filter((d) => !d.isExpired && d.daysToExpiry <= 45).length;

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.docType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const expiresDate = newExpiresOn ? new Date(newExpiresOn) : new Date(Date.now() + 365 * 86400000);
    const today = new Date();
    const isExp = expiresDate < today;
    const daysDiff = Math.ceil((expiresDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    const newDoc: VaultDoc = {
      id: `doc-${Date.now()}`,
      title: newTitle,
      docType: newDocType,
      version: 1,
      issuer: newIssuer || "Regulatory Body",
      issuedOn: new Date().toISOString().split("T")[0],
      expiresOn: expiresDate.toISOString().split("T")[0],
      isExpired: isExp,
      daysToExpiry: daysDiff,
      category: newCategory,
      jurisdiction: "Pakistan",
      confidentiality: "Internal",
      approvalState: "approved",
      storageSize: "1.2 MB",
    };

    setDocuments([newDoc, ...documents]);
    setShowUploadModal(false);
    setNewTitle("");
    setNewIssuer("");
    setNewExpiresOn("");
  };

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <FolderLock className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Document Vault & Compliance Credentials</h1>
                <p className="text-sm text-slate-500">
                  Secure evidence locker for {activeOrg?.name || "Apex Healthcare Technologies"}. Verified documents map directly to tender compliance matrices.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Evidence Document
            </button>
          </div>
        </div>

        {/* Expiry Risk Alert Banner (Rule 7) */}
        {expiredCount > 0 && (
          <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-lg shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <h2 className="text-sm font-semibold text-red-900">
                  Critical Compliance Warning: {expiredCount} Expired Document{expiredCount > 1 ? "s" : ""} in Vault
                </h2>
                <p className="text-xs text-red-700 mt-1">
                  <strong>RULE 7 ENFORCEMENT:</strong> Expired credentials in your vault automatically disqualify active tender bids (NOT_ELIGIBLE). Please replace or re-certify these documents immediately before proposal submission.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Documents</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{documents.length}</div>
            <div className="text-xs text-slate-500 mt-1">Across 4 statutory categories</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active & Valid</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{documents.filter((d) => !d.isExpired).length}</div>
            <div className="text-xs text-emerald-600 mt-1">Ready for compliance binding</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Expiring Soon</div>
            <div className="text-2xl font-bold text-amber-700 mt-1">{expiringSoonCount}</div>
            <div className="text-xs text-amber-600 mt-1">Within 45 days renewal cycle</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-red-600 uppercase tracking-wider">Disqualification Risk</div>
            <div className="text-2xl font-bold text-red-700 mt-1">{expiredCount}</div>
            <div className="text-xs text-red-600 mt-1">Expired / Action required</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: "all", label: "All Credentials" },
                { id: "tax", label: "Tax & Statutory" },
                { id: "quality", label: "Quality & ISO" },
                { id: "financial", label: "Financial & Audits" },
                { id: "legal", label: "Legal & Corporate" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === tab.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search certificate, doc type, or issuer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Document Title & Details</th>
                  <th className="py-3 px-4">Issuing Authority</th>
                  <th className="py-3 px-4">Validity & Expiry</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                      No documents match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          <span className={`p-2 rounded-lg mt-0.5 ${doc.isExpired ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                            <FileText className="w-5 h-5" />
                          </span>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              {doc.title}
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-mono rounded">
                                v{doc.version}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>{doc.docType}</span>
                              <span>•</span>
                              <span>{doc.jurisdiction}</span>
                              <span>•</span>
                              <span>{doc.storageSize}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-800 font-medium">{doc.issuer}</div>
                        <div className="text-xs text-slate-400">Issued: {doc.issuedOn}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-700">Expires: {doc.expiresOn}</span>
                          {doc.isExpired ? (
                            <span className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="w-3 h-3" /> Expired {Math.abs(doc.daysToExpiry)} days ago
                            </span>
                          ) : doc.daysToExpiry <= 45 ? (
                            <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> {doc.daysToExpiry} days remaining
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Valid ({doc.daysToExpiry} days)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusPill
                          label={doc.isExpired ? "EXPIRED" : doc.daysToExpiry <= 45 ? "RENEWAL DUE" : "VERIFIED"}
                          variant={doc.isExpired ? "danger" : doc.daysToExpiry <= 45 ? "warning" : "success"}
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Preview Document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-blue-600" /> Upload Vault Credential
                </h2>
                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase">Document Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ISO 9001:2015 Quality Certification"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="tax">Tax & Statutory</option>
                      <option value="quality">Quality & ISO</option>
                      <option value="financial">Financial & Audits</option>
                      <option value="legal">Legal & Corporate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase">Doc Type</label>
                    <input
                      type="text"
                      placeholder="e.g. ISO 9001 Certificate"
                      value={newDocType}
                      onChange={(e) => setNewDocType(e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase">Issuing Body</label>
                    <input
                      type="text"
                      placeholder="e.g. SGS / BSI / FBR"
                      value={newIssuer}
                      onChange={(e) => setNewIssuer(e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase">Expiration Date</label>
                    <input
                      type="date"
                      required
                      value={newExpiresOn}
                      onChange={(e) => setNewExpiresOn(e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center bg-slate-50">
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-medium">Select PDF or scan (up to 25 MB)</p>
                  <p className="text-[11px] text-slate-400 mt-1">Files are hashed (SHA-256) and encrypted at rest</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                  >
                    Save to Vault
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Document Preview Drawer / Shell */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
              <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="font-semibold text-sm">{previewDoc.title}</h3>
                    <p className="text-xs text-slate-400">
                      Issuer: {previewDoc.issuer} • Valid until: {previewDoc.expiresOn}
                    </p>
                  </div>
                </div>
                <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <DocumentPreviewShell
                  filename={`${previewDoc.title.replace(/\s+/g, "_")}.pdf`}
                  totalPages={4}
                  currentPage={1}
                  highlightedSection="Statutory Accreditation & Registration Schedule"
                  highlightedExcerpt={`Official certification issued by ${previewDoc.issuer} verifying active compliance status under regulatory framework. Reference: VAULT-REG-${previewDoc.id}. Expiration date confirmed as ${previewDoc.expiresOn}.`}
                />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-mono">
                  SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-700"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

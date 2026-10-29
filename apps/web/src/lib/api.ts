/**
 * AI Tender Portal — Type-safe Backend API Client
 * Connects Next.js web application to FastAPI backend services (/api/v1).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackData?: T
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson.detail || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }

    return await res.json();
  } catch (err: any) {
    if (fallbackData !== undefined) {
      console.warn(`[API Client] Falling back to offline dataset for ${endpoint}:`, err.message);
      return fallbackData;
    }
    throw err;
  }
}

export const api = {
  // Service Health
  health: () => request<{ status: string; service: string }>("/health"),

  // Tenders
  getTenders: (params?: Record<string, string>, headers?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<any>(`/api/v1/tenders${qs}`, { headers });
  },
  getTender: (id: string, headers?: Record<string, string>) =>
    request<any>(`/api/v1/tenders/${id}`, { headers }),

  // Compliance Matrix & Assessments
  getComplianceMatrix: (tenderId: string, organizationId: string) =>
    request<any>(`/api/v1/compliance/matrix/${tenderId}?organization_id=${organizationId}`),
  updateAssessment: (
    requirementId: string,
    organizationId: string,
    payload: {
      reviewer_status: string;
      evidence_id?: string | null;
      not_applicable_justification?: string | null;
      notes?: string | null;
    }
  ) =>
    request<any>(
      `/api/v1/compliance/assessments/${requirementId}?organization_id=${organizationId}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    ),

  // Document Vault
  getVaultEvidence: (organizationId: string, docType?: string) => {
    const qs = docType ? `&doc_type=${encodeURIComponent(docType)}` : "";
    return request<any>(`/api/v1/vault?organization_id=${organizationId}${qs}`);
  },

  // Bid Participation & Tasks
  getBids: (organizationId: string, stage?: string) => {
    const qs = stage ? `&stage=${encodeURIComponent(stage)}` : "";
    return request<any[]>(`/api/v1/bids?organization_id=${organizationId}${qs}`);
  },
  createBid: (organizationId: string, payload: any) =>
    request<any>(`/api/v1/bids?organization_id=${organizationId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateBidStage: (bidId: string, organizationId: string, stage: string) =>
    request<any>(`/api/v1/bids/${bidId}/stage?organization_id=${organizationId}`, {
      method: "PUT",
      body: JSON.stringify({ stage }),
    }),
  updateBidDecision: (bidId: string, organizationId: string, payload: { decision: string; decision_rationale: string }) =>
    request<any>(`/api/v1/bids/${bidId}/decision?organization_id=${organizationId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  // Rule 8 Deterministic Pricing Math
  calculatePricing: (items: any[], currency: string = "PKR") =>
    request<any>(`/api/v1/bids/pricing/calculate?currency=${encodeURIComponent(currency)}`, {
      method: "POST",
      body: JSON.stringify(items),
    }),

  // Sequential Multi-Role Approvals & Pre-Flight Gate
  getApprovals: (bidId: string, organizationId: string) =>
    request<any[]>(`/api/v1/approvals/${bidId}?organization_id=${organizationId}`),
  recordApprovalAction: (
    bidId: string,
    stepId: string,
    organizationId: string,
    payload: { action: string; notes?: string; approver_name?: string },
    headers?: Record<string, string>
  ) =>
    request<any>(
      `/api/v1/approvals/${bidId}/steps/${stepId}/action?organization_id=${organizationId}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }
    ),
  getSubmissionChecklist: (bidId: string, organizationId: string) =>
    request<any>(`/api/v1/approvals/${bidId}/checklist?organization_id=${organizationId}`),
  submitBidPackage: (
    bidId: string,
    organizationId: string,
    payload: { submitted_by_name: string; declaration_accepted: boolean }
  ) =>
    request<any>(`/api/v1/approvals/${bidId}/submit?organization_id=${organizationId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // AI Proposal Engine
  getOrCreateProposal: (bidId: string, organizationId: string, title?: string) =>
    request<any>(`/api/v1/proposals?organization_id=${organizationId}`, {
      method: "POST",
      body: JSON.stringify({ bid_id: bidId, title }),
    }),
  generateProposalContent: (proposalId: string, organizationId: string, regenerate: boolean = true) =>
    request<any>(`/api/v1/proposals/${proposalId}/generate?organization_id=${organizationId}`, {
      method: "POST",
      body: JSON.stringify({ regenerate }),
    }),
  exportProposal: (proposalId: string, organizationId: string, envelopeType: "technical" | "commercial" = "technical") =>
    request<any>(`/api/v1/proposals/${proposalId}/export?envelope_type=${envelopeType}&organization_id=${organizationId}`),

  // Outcomes & Analytics (Rule 14)
  getAnalyticsSummary: (organizationId: string) =>
    request<any>(`/api/v1/outcomes/analytics/summary?organization_id=${organizationId}`),
  getCalendarMilestones: (organizationId: string) =>
    request<any>(`/api/v1/outcomes/calendar/milestones?organization_id=${organizationId}`),
  recordOutcome: (bidId: string, organizationId: string, payload: any) =>
    request<any>(`/api/v1/outcomes/${bidId}?organization_id=${organizationId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};


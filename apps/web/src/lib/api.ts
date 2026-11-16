/**
 * AI Tender Portal — Type-safe Backend API Client
 * Connects Next.js web application to FastAPI backend services (/api/v1).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("tender_portal_token", token);
    } else {
      localStorage.removeItem("tender_portal_token");
    }
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== "undefined") {
    authToken = localStorage.getItem("tender_portal_token");
  }
  return authToken;
}

let globalAuthContext = {
  orgId: "",
  userId: "",
};

export function setApiAuthContext(orgId: string, userId: string) {
  globalAuthContext = { orgId, userId };
}

export function getApiAuthContext() {
  return globalAuthContext;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackData?: T
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    const defaultHeaders: Record<string, string> = isFormData
      ? {}
      : { "Content-Type": "application/json" };

    const token = getAuthToken();
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    if (globalAuthContext.orgId) {
      defaultHeaders["X-Org-Id"] = globalAuthContext.orgId;
    }
    if (globalAuthContext.userId) {
      defaultHeaders["X-User-Id"] = globalAuthContext.userId;
    }

    const res = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson.detail || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return null as unknown as T;
    }

    return await res.json();
  } catch (err: any) {
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    throw err;
  }
}

export const api = {
  // Authentication & RBAC
  signup: (payload: { email: string; password: string; full_name?: string; organization_name?: string; role?: string }) =>
    request<any>("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    request<any>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getMe: (headers?: Record<string, string>) =>
    request<any>("/api/v1/auth/me", { headers }),
  // Service Health
  health: () => request<{ status: string; service: string }>("/health"),

  // Tenders
  getTenders: (params?: Record<string, string>, headers?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<any>(`/api/v1/tenders${qs}`, { headers });
  },
  getTender: (id: string, headers?: Record<string, string>) =>
    request<any>(`/api/v1/tenders/${id}`, { headers }),
  createTender: (payload: any, headers?: Record<string, string>) =>
    request<any>("/api/v1/tenders", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }),
  uploadTenderDocument: (tenderId: string, formData: FormData, headers?: Record<string, string>) =>
    request<any>(`/api/v1/tenders/${tenderId}/documents`, {
      method: "POST",
      headers,
      body: formData,
    }),

  // Organizations & Team Members
  getMyOrganization: (headers?: Record<string, string>) =>
    request<any>("/api/v1/organizations/me", { headers }),
  getMembers: (headers?: Record<string, string>) =>
    request<any[]>("/api/v1/organizations/me/members", { headers }),
  inviteMember: (payload: any, headers?: Record<string, string>) =>
    request<any>("/api/v1/organizations/me/members", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }),
  getAuditEvents: (headers?: Record<string, string>) =>
    request<any[]>("/api/v1/organizations/me/audit-events", { headers }),

  // Portal Connectors
  getConnectors: (headers?: Record<string, string>) =>
    request<any[]>("/api/v1/connectors", { headers }),
  syncConnector: (connectorId: string, headers?: Record<string, string>) =>
    request<any>(`/api/v1/connectors/${connectorId}/sync`, {
      method: "POST",
      headers,
    }),
  syncAllConnectors: (headers?: Record<string, string>) =>
    request<any>("/api/v1/connectors/sync-all", {
      method: "POST",
      headers,
    }),

  // Saved Searches
  getSavedSearches: (headers?: Record<string, string>) =>
    request<any>("/api/v1/saved-searches", { headers }),
  createSavedSearch: (payload: any, headers?: Record<string, string>) =>
    request<any>("/api/v1/saved-searches", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }),
  getSavedSearch: (searchId: string, headers?: Record<string, string>) =>
    request<any>(`/api/v1/saved-searches/${searchId}`, { headers }),
  updateSavedSearch: (searchId: string, payload: any, headers?: Record<string, string>) =>
    request<any>(`/api/v1/saved-searches/${searchId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    }),
  deleteSavedSearch: (searchId: string, headers?: Record<string, string>) =>
    request<void>(`/api/v1/saved-searches/${searchId}`, {
      method: "DELETE",
      headers,
    }),
  runSavedSearch: (searchId: string, headers?: Record<string, string>) =>
    request<any>(`/api/v1/saved-searches/${searchId}/run`, {
      method: "POST",
      headers,
    }),

  // Compliance Matrix & Assessments
  getComplianceMatrix: (tenderId: string, organizationId?: string, headers?: Record<string, string>) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/compliance/matrix/${tenderId}${qs}`, { headers });
  },
  updateAssessment: (
    requirementId: string,
    organizationId: string | undefined,
    payload: {
      reviewer_status: string;
      evidence_id?: string | null;
      not_applicable_justification?: string | null;
      notes?: string | null;
    },
    headers?: Record<string, string>
  ) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/compliance/assessments/${requirementId}${qs}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
  },

  // Document Vault
  getVaultEvidence: (organizationId?: string, docType?: string, headers?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (organizationId) params.append("organization_id", organizationId);
    if (docType) params.append("doc_type", docType);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<any>(`/api/v1/vault${qs}`, { headers });
  },
  uploadVaultEvidence: (payload: any, organizationId?: string, headers?: Record<string, string>) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/vault${qs}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  },
  deleteVaultEvidence: (evidenceId: string, organizationId?: string, headers?: Record<string, string>) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/vault/${evidenceId}${qs}`, {
      method: "DELETE",
      headers,
    });
  },

  // Bid Participation & Tasks
  getBids: (organizationId?: string, stage?: string, headers?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (organizationId) params.append("organization_id", organizationId);
    if (stage) params.append("stage", stage);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<any[]>(`/api/v1/bids${qs}`, { headers });
  },
  createBid: (organizationId: string | undefined, payload: any, headers?: Record<string, string>) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/bids${qs}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  },
  getBid: (bidId: string, organizationId?: string, headers?: Record<string, string>) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/bids/${bidId}${qs}`, { headers });
  },
  updateBidStage: (bidId: string, organizationId: string | undefined, stage: string, headers?: Record<string, string>) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/bids/${bidId}/stage${qs}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ stage }),
    });
  },
  updateBidDecision: (
    bidId: string,
    organizationId: string | undefined,
    payload: { decision: string; decision_rationale: string },
    headers?: Record<string, string>
  ) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/bids/${bidId}/decision${qs}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
  },
  getBidTasks: (bidId: string, organizationId?: string, headers?: Record<string, string>) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any[]>(`/api/v1/bids/${bidId}/tasks${qs}`, { headers });
  },
  createBidTask: (bidId: string, organizationId: string | undefined, payload: any, headers?: Record<string, string>) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/bids/${bidId}/tasks${qs}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  },
  updateBidTask: (taskId: string, organizationId: string | undefined, payload: any, headers?: Record<string, string>) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/bids/tasks/${taskId}${qs}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
  },

  // Rule 8 Deterministic Pricing Math
  calculatePricing: (
    items: any[],
    currency: string = "PKR",
    bidSecurityRatePercent: number = 2.0,
    headers?: Record<string, string>
  ) => {
    const params = new URLSearchParams({
      currency,
      bid_security_rate_percent: bidSecurityRatePercent.toString(),
    });
    return request<any>(`/api/v1/bids/pricing/calculate?${params.toString()}`, {
      method: "POST",
      headers,
      body: JSON.stringify(items),
    });
  },

  // Sequential Multi-Role Approvals & Pre-Flight Gate
  getApprovals: (bidId: string, organizationId?: string, headers?: Record<string, string>) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any[]>(`/api/v1/approvals/${bidId}${qs}`, { headers });
  },
  recordApprovalAction: (
    bidId: string,
    stepId: string,
    organizationId: string | undefined,
    payload: { action: string; notes?: string; approver_name?: string },
    headers?: Record<string, string>
  ) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/approvals/${bidId}/steps/${stepId}/action${qs}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  },
  getSubmissionChecklist: (bidId: string, organizationId?: string, headers?: Record<string, string>) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/approvals/${bidId}/checklist${qs}`, { headers });
  },
  submitBidPackage: (
    bidId: string,
    organizationId: string | undefined,
    payload: { submitted_by_name: string; declaration_accepted: boolean },
    headers?: Record<string, string>
  ) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/approvals/${bidId}/submit${qs}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  },

  // AI Proposal Engine
  getOrCreateProposal: (bidId: string, organizationId?: string, title?: string, headers?: Record<string, string>) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/proposals${qs}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ bid_id: bidId, title }),
    });
  },
  getProposal: (proposalId: string, organizationId?: string, headers?: Record<string, string>) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/proposals/${proposalId}${qs}`, { headers });
  },
  generateProposalContent: (
    proposalId: string,
    organizationId?: string,
    regenerate: boolean = true,
    headers?: Record<string, string>
  ) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/proposals/${proposalId}/generate${qs}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ regenerate }),
    });
  },
  updateProposalSection: (
    proposalId: string,
    sectionId: string,
    organizationId: string | undefined,
    payload: any,
    headers?: Record<string, string>
  ) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/proposals/${proposalId}/sections/${sectionId}${qs}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
  },
  exportProposal: (
    proposalId: string,
    organizationId?: string,
    envelopeType: "technical" | "commercial" = "technical",
    headers?: Record<string, string>
  ) => {
    const params = new URLSearchParams({ envelope_type: envelopeType });
    if (organizationId) params.append("organization_id", organizationId);
    return request<any>(`/api/v1/proposals/${proposalId}/export?${params.toString()}`, { headers });
  },

  // Outcomes & Analytics (Rule 14)
  getOutcomes: (organizationId?: string, headers?: Record<string, string>) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any[]>(`/api/v1/outcomes${qs}`, { headers });
  },
  getAnalyticsSummary: (organizationId?: string, headers?: Record<string, string>) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/outcomes/analytics/summary${qs}`, { headers });
  },
  getCalendarMilestones: (organizationId?: string, headers?: Record<string, string>) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any[]>(`/api/v1/outcomes/calendar/milestones${qs}`, { headers });
  },
  recordOutcome: (bidId: string, organizationId: string | undefined, payload: any, headers?: Record<string, string>) => {
    const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return request<any>(`/api/v1/outcomes/${bidId}${qs}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  },
};

import { supabaseBrowser } from "../supabaseClient";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type LeadListSummary = {
  id: string;
  name: string;
  description: string | null;
  leadCount: number;
  color?: string | null;
  createdAt: string;
};

type LeadListDetail = LeadListSummary & {
  leads: Array<{
    id: string;
    companyId: string;
    contactId: string | null;
    notes: string | null;
    addedAt: string;
    company: {
      id: string;
      name: string;
      domain: string | null;
      industry: string | null;
    };
    contact: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      role: string | null;
    } | null;
  }>;
};

type CreditError = {
  ok: false;
  error: "INSUFFICIENT_CREDITS";
  required: number;
  available: number;
  contacts?: number;
};

type ExportResult = ({ ok: true; blob: Blob; filename: string }) | CreditError;

async function authHeaders(): Promise<Record<string, string>> {
  const session = await supabaseBrowser.auth.getSession();
  const token = session.data.session?.access_token;
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

export async function fetchLeadLists(): Promise<LeadListSummary[]> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/lists`, { headers });
  if (!res.ok) throw new Error("Failed to load lists");
  const data = await res.json();
  return data.lists || [];
}

export async function createLeadList(payload: { name: string; description?: string | null }): Promise<LeadListSummary> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/lists`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create list");
  const data = await res.json();
  return data.list || data;
}

export async function updateLeadListMeta(id: string, payload: { name?: string; description?: string | null }) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/lists/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update list");
  const data = await res.json();
  return data.list || data;
}

export async function deleteLeadList(id: string) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/lists/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error("Failed to delete list");
  return res.json();
}

export async function fetchLeadList(id: string): Promise<LeadListDetail> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/lists/${id}`, { headers });
  if (!res.ok) throw new Error("Failed to load list");
  const data = await res.json();
  return data.list || data;
}

export async function addFromSearchToList(args: {
  leadListId: string;
  leadSearchId: string;
  limit?: number;
  filters?: Record<string, any>;
}) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/lists/${args.leadListId}/add-from-search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      leadSearchId: args.leadSearchId,
      limit: args.limit,
      filters: args.filters,
    }),
  });
  if (!res.ok) throw new Error("Failed to add leads to list");
  return res.json();
}

export async function removeLeadsFromList(listId: string, leadIds: string[]) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/lists/${listId}/leads`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ leadIds }),
  });
  if (!res.ok) throw new Error("Failed to remove leads");
  return res.json();
}

export async function exportLeadList(listId: string): Promise<ExportResult> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/api/lists/${listId}/export`, { headers });

  if (res.status === 402) {
    const body = await res.json();
    return {
      ok: false,
      error: "INSUFFICIENT_CREDITS",
      required: body.required,
      available: body.available,
      contacts: body.contacts,
    };
  }

  if (!res.ok) throw new Error("Failed to export list");

  const blob = await res.blob();
  return { ok: true, blob, filename: `lead-list-${listId}.csv` };
}

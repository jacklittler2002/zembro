"use client";

import { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { SoftWallModal } from "../../../components/SoftWallModal";
import { LeadSearchProgressBar } from "../../../components/LeadSearchProgressBar";
  const [softWallModal, setSoftWallModal] = useState<null | { type: 'credits' | 'upgrade', message: string }>(null);
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabaseBrowser } from "@/lib/supabaseClient";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

const sizeOptions = [
  { value: "", label: "All Sizes" },
  { value: "MICRO", label: "Micro (1-10 employees)" },
  { value: "SMALL", label: "Small (11-50 employees)" },
  { value: "SMB", label: "SMB (51-200 employees)" },
  { value: "MIDMARKET", label: "Mid-Market (201-1000 employees)" },
  { value: "ENTERPRISE", label: "Enterprise (1000+ employees)" },
];

interface Feedback {
  id: string;
  userId: string;
  companyId: string;
  contactId?: string;
  leadSearchId: string;
  rating: number;
  feedback?: string;
  aiScore?: number;
}

interface LeadWithFeedback extends Lead {
  feedback?: Feedback;
}
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string;
  websiteUrl: string | null;
  city: string | null;
  country: string | null;
  niche: string | null;
  industry: string | null;
  sizeBucket: string | null;
  role: string | null;
  isDecisionMaker: boolean;
  score: number | null;
}

interface LeadSearch {
  id: string;
  query: string;
  status: string;
  maxLeads: number;
  createdAt: string;
}

export default function LeadSearchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const { loading: authLoading, user } = useRequireAuth();

  const [leadSearch, setLeadSearch] = useState<LeadSearch | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
    // Fetch feedbacks for this search
    useEffect(() => {
      async function fetchFeedbacks() {
        if (authLoading || !user) return;
        setFeedbackLoading(true);
        try {
          const { data: session } = await supabaseBrowser.auth.getSession();
          const token = session.session?.access_token;
          const res = await fetch(`${API_BASE}/api/lead-searches/${id}/feedback`, {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
          });
          if (res.ok) {
            const data = await res.json();
            setFeedbacks(data.feedbacks || []);
          }
        } catch (err) {
          console.error("Failed to fetch feedbacks:", err);
        } finally {
          setFeedbackLoading(false);
        }
      }
      fetchFeedbacks();
    }, [authLoading, user, id]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<keyof Lead | "score">("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Filter states
  const [minScore, setMinScore] = useState<number | undefined>(60);
  const [industry, setIndustry] = useState("");
  const [sizeBucket, setSizeBucket] = useState("");
  const [country, setCountry] = useState("");
  const [decisionMakerOnly, setDecisionMakerOnly] = useState(false);
  const [excludePreviousExports, setExcludePreviousExports] = useState(true);
  const [jobTitle, setJobTitle] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [techStackInput, setTechStackInput] = useState("");
  const [fundingStage, setFundingStage] = useState("");

  // Selection states
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [lists, setLists] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [newListName, setNewListName] = useState("");
  const [showSendToCampaignModal, setShowSendToCampaignModal] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");

  // Fetch lead search metadata
  useEffect(() => {
    async function fetchLeadSearch() {
      if (authLoading || !user) return;

      try {
        const { data: session } = await supabaseBrowser.auth.getSession();
        const token = session.session?.access_token;

        const res = await fetch(`${API_BASE}/api/lead-searches/${id}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setLeadSearch(data.leadSearch);
        } else {
          setError("Failed to load lead search");
        }
      } catch (err) {
        console.error("Failed to fetch lead search:", err);
        setError("Failed to load lead search");
      }
    }

    fetchLeadSearch();
  }, [authLoading, user, id]);

  // Fetch leads with filters
  async function fetchLeads() {
    if (authLoading || !user) return;

    setLoading(true);
    setError(null);

    try {
      const { data: session } = await supabaseBrowser.auth.getSession();
      const token = session.session?.access_token;

      const params = new URLSearchParams();
      if (minScore !== undefined) params.append("minScore", String(minScore));
      if (industry) params.append("industry", industry);
      if (sizeBucket) params.append("sizeBucket", sizeBucket);
      if (country) params.append("country", country);
      if (decisionMakerOnly) params.append("decisionMakerOnly", "true");
      if (!excludePreviousExports) params.append("excludePreviousExports", "false"); // Only send if false
      if (jobTitle) params.append("jobTitle", jobTitle);
      if (techStack.length > 0) params.append("techStack", techStack.join(","));
      if (fundingStage) params.append("fundingStage", fundingStage);

      // Client-side sort params (optional server support later)
      const res = await fetch(
        `${API_BASE}/api/lead-searches/${id}/leads?${params.toString()}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        let incoming: Lead[] = data.leads || [];
        // Apply client-side sorting
        const sorted = [...incoming].sort((a, b) => {
          const dir = sortDir === "asc" ? 1 : -1;
          const va = sortBy === "score" ? (a.score ?? 0) : (a[sortBy] as any) ?? "";
          const vb = sortBy === "score" ? (b.score ?? 0) : (b[sortBy] as any) ?? "";
          if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
          return String(va).localeCompare(String(vb)) * dir;
        });
        setLeads(sorted);
      } else {
        setError("Failed to load leads");
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
      setError("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }

  // Load leads on mount and when filters change
  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, id, sortBy, sortDir]);

  // Fetch user's lists
  useEffect(() => {
    async function fetchLists() {
      if (authLoading || !user) return;

      try {
        const { data: session } = await supabaseBrowser.auth.getSession();
        const token = session.session?.access_token;

        const res = await fetch(`${API_BASE}/api/lists`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setLists(data.lists || []);
        }
      } catch (err) {
        console.error("Failed to fetch lists:", err);
      }
    }

    fetchLists();
  }, [authLoading, user]);

  // Fetch user's campaigns
  useEffect(() => {
    async function fetchCampaigns() {
      if (authLoading || !user) return;
      try {
        const { data: session } = await supabaseBrowser.auth.getSession();
        const token = session.session?.access_token;
        const res = await fetch(`${API_BASE}/api/campaigns`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data.campaigns || []);
        }
      } catch (err) {
        console.error("Failed to fetch campaigns:", err);
      }
    }
    fetchCampaigns();
  }, [authLoading, user]);

  const router = useRouter();
  const handleDownloadCSV = async () => {
    try {
      const { data: session } = await supabaseBrowser.auth.getSession();
      const token = session.session?.access_token;

      const params = new URLSearchParams();
      if (!excludePreviousExports) params.append("excludePreviousExports", "false");

      const res = await fetch(
        `${API_BASE}/api/lead-searches/${id}/export?${params.toString()}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (res.status === 402) {
        const body = await res.json();
        setSoftWallModal({
          type: 'credits',
          message: `This export needs ${body.required} credits (you have ${body.available}). Please top up or upgrade.`,
        });
        return;
      }

      if (res.status === 403) {
        const body = await res.json();
        if (body?.error === "UPGRADE_REQUIRED") {
          setSoftWallModal({
            type: 'upgrade',
            message: "This export exceeds your plan limits. Please upgrade to a higher plan.",
          });
          return;
        }
      }

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `lead-search-${id}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to download CSV:", error);
    }
  };
      <SoftWallModal
        open={!!softWallModal}
        type={softWallModal?.type || 'upgrade'}
        message={softWallModal?.message || ''}
        onClose={() => setSoftWallModal(null)}
        onBilling={() => {
          setSoftWallModal(null);
          router.push('/app/billing');
        }}
      />

  const toggleLeadSelection = (index: number) => {
    const newSelection = new Set(selectedLeads);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedLeads(newSelection);
  };

  const selectAllLeads = () => {
    const allIndexes = leads.map((_, index) => index);
    setSelectedLeads(new Set(allIndexes));
  };

  const deselectAllLeads = () => {
    setSelectedLeads(new Set());
  };

  const handleAddToList = async () => {
    if (selectedLeads.size === 0) {
      alert("Please select at least one lead");
      return;
    }

    try {
      const { data: session } = await supabaseBrowser.auth.getSession();
      const token = session.session?.access_token;

      let listId = selectedListId;

      // Create new list if needed
      if (selectedListId === "new") {
        if (!newListName.trim()) {
          alert("Please enter a list name");
          return;
        }

        const createRes = await fetch(`${API_BASE}/api/lists`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ name: newListName }),
        });

        if (!createRes.ok) throw new Error("Failed to create list");

        const createData = await createRes.json();
        listId = createData.list?.id || createData.id;
      }

      // Import leads from search with current filters
      const filters: any = {};
      if (minScore !== undefined) filters.minScore = minScore;
      if (industry) filters.industry = industry;
      if (sizeBucket) filters.sizeBucket = sizeBucket;
      if (country) filters.country = country;
      if (decisionMakerOnly) filters.decisionMakerOnly = decisionMakerOnly;
      // Limit to selected leads count
      filters.limit = selectedLeads.size;

      const addRes = await fetch(`${API_BASE}/api/lists/${listId}/add-from-search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          leadSearchId: id,
          limit: selectedLeads.size,
          filters,
        }),
      });

      if (!addRes.ok) throw new Error("Failed to add leads to list");

      const result = await addRes.json();
      const added = result.added ?? result.addedCount ?? 0;
      const skipped = (result.totalCandidates ?? 0) - added;
      alert(`Added ${added} leads to list${skipped > 0 ? ` (${skipped} duplicates skipped)` : ""}`);

      setShowAddToListModal(false);
      setSelectedLeads(new Set());
      setSelectedListId("");
      setNewListName("");
    } catch (error: any) {
      console.error("Failed to add leads to list:", error);
      alert(error.message);
    }
  };

  const handleExportSelectedCsv = () => {
    if (selectedLeads.size === 0) {
      alert("Please select at least one lead");
      return;
    }
    const header = [
      "email","firstName","lastName","companyName","websiteUrl","city","country","niche","industry","sizeBucket","role","isDecisionMaker","score"
    ];
    const rows = Array.from(selectedLeads).map((idx) => {
      const l = leads[idx];
      const vals = [
        l.email,
        l.firstName || "",
        l.lastName || "",
        l.companyName,
        l.websiteUrl || "",
        l.city || "",
        l.country || "",
        l.niche || "",
        l.industry || "",
        l.sizeBucket || "",
        l.role || "",
        l.isDecisionMaker ? "true" : "false",
        l.score != null ? String(Math.round(l.score * 100)) : "",
      ];
      return vals.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lead-search-${id}-selected.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSendSelectedToCampaign = async () => {
    if (!selectedCampaignId) {
      alert("Please choose a campaign");
      return;
    }
    try {
      const { data: session } = await supabaseBrowser.auth.getSession();
      const token = session.session?.access_token;
      const filters: any = {};
      if (minScore !== undefined) filters.minScore = minScore;
      if (industry) filters.industry = industry;
      if (sizeBucket) filters.sizeBucket = sizeBucket;
      if (country) filters.country = country;
      if (decisionMakerOnly) filters.decisionMakerOnly = decisionMakerOnly;
      filters.limit = selectedLeads.size;

      const res = await fetch(`${API_BASE}/api/campaigns/${selectedCampaignId}/import-leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(filters),
      });
      if (!res.ok) throw new Error("Failed to import leads to campaign");
      const result = await res.json();
      alert(`Queued ${result.emailsQueued} emails for campaign`);
      setShowSendToCampaignModal(false);
      setSelectedCampaignId("");
    } catch (err: any) {
      console.error("Failed to send to campaign:", err);
      alert(err.message || "Failed to send to campaign");
    }
  };

  if (authLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div style={{ color: "var(--color-sidebar-border)" }}>Loading...</div>
      </div>
    );
  }

  // Helper to get feedback for a lead
  function getFeedbackForLead(lead: Lead) {
    return feedbacks.find(f =>
      f.companyId === lead.companyName // This assumes companyName is the id; adjust if you have real companyId
    );
  }

  // Handler to submit feedback
  async function submitFeedback(lead: Lead, rating: number, feedbackText: string) {
    try {
      const { data: session } = await supabaseBrowser.auth.getSession();
      const token = session.session?.access_token;
      // TODO: Use real companyId/contactId if available
      const companyId = lead.companyName;
      const contactId = undefined;
      const res = await fetch(`${API_BASE}/api/lead-searches/${id}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ companyId, contactId, rating, feedback: feedbackText }),
      });
      if (res.ok) {
        // Refresh feedbacks
        const data = await res.json();
        setFeedbacks((prev) => {
          const filtered = prev.filter(f => !(f.companyId === companyId && f.contactId === contactId));
          return [...filtered, data.feedback];
        });
      }
    } catch (err) {
      alert("Failed to submit feedback");
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/app/lead-searches"
              className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
            >
              ← Back to searches
            </Link>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
              {leadSearch?.query || "Lead Search"}
            </h1>
            {leadSearch && (
              <div className="text-sm text-gray-600 mt-1 flex items-center gap-3">
                <span>
                  Status: <span className="font-medium">{leadSearch.status}</span>
                </span>
                <span>• Max leads: {leadSearch.maxLeads}</span>
                {/* Campaign progress bar (live) */}
                {leadSearch.status === "RUNNING" && (
                  <LeadSearchProgressBar leadSearchId={leadSearch.id} apiBase={API_BASE} />
                )}
                {leadSearch.status === "DONE" && (
                  <LeadSearchProgressBar leadSearchId={leadSearch.id} apiBase={API_BASE} />
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm"
            style={{
              background: "var(--color-accent)",
              color: "var(--color-text)",
            }}
          >
            Download CSV
          </button>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total Found</p>
            <p className="text-3xl font-bold text-cyan-600 mt-1">{leads.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Decision Makers</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">
              {leads.filter(l => l.isDecisionMaker).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Selected</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{selectedLeads.size}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Avg Match Quality</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {leads.length > 0
                ? Math.round(
                    (leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length) * 100
                  )
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-lg border p-6 space-y-4 bg-white shadow-sm">
          <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Filter Leads
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {/* Job Title */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Job Title
                          </label>
                          <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-gray-700 hover:border-gray-400"
                            placeholder="e.g. CTO, Marketing Manager"
                          />
                        </div>

                        {/* Tech Stack */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tech Stack
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={techStackInput}
                              onChange={(e) => setTechStackInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && techStackInput.trim()) {
                                  setTechStack([...techStack, techStackInput.trim()]);
                                  setTechStackInput("");
                                  e.preventDefault();
                                }
                              }}
                              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-gray-700 hover:border-gray-400"
                              placeholder="e.g. React, Node.js"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (techStackInput.trim()) {
                                  setTechStack([...techStack, techStackInput.trim()]);
                                  setTechStackInput("");
                                }
                              }}
                              className="px-3 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                            >
                              Add
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {techStack.map((tech, idx) => (
                              <span key={idx} className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                                {tech}
                                <button
                                  type="button"
                                  onClick={() => setTechStack(techStack.filter((_, i) => i !== idx))}
                                  className="ml-1 text-cyan-600 hover:text-cyan-900"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Funding Stage */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Funding Stage
                          </label>
                          <input
                            type="text"
                            value={fundingStage}
                            onChange={(e) => setFundingStage(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-gray-700 hover:border-gray-400"
                            placeholder="e.g. Seed, Series A"
                          />
                        </div>
            {/* Min Match Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Match Quality
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={minScore ?? ""}
                onChange={(e) =>
                  setMinScore(
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-gray-700 hover:border-gray-400"
                placeholder="0-100"
              />
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-gray-700 hover:border-gray-400"
                placeholder="e.g. Healthcare"
              />
            </div>

            {/* Company Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Size
              </label>
              <select
                value={sizeBucket}
                onChange={(e) => setSizeBucket(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-gray-700 hover:border-gray-400"
              >
                {sizeOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-gray-700 hover:border-gray-400"
                placeholder="e.g. United Kingdom"
              />
            </div>

            {/* Decision Makers Only */}
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={decisionMakerOnly}
                  onChange={(e) => setDecisionMakerOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                />
                Decision makers only
              </label>
            </div>
          </div>

          {/* Exclude Previous Exports Option */}
          <div className="pt-2 border-t border-gray-200">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={excludePreviousExports}
                onChange={(e) => setExcludePreviousExports(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
              />
              Exclude previously exported leads
              <span className="text-xs text-gray-500 font-normal">
                (prevents duplicate leads across exports)
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchLeads}
              disabled={loading}
              className="inline-flex items-center px-6 py-2.5 rounded-lg font-semibold text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: "var(--color-accent)", color: "var(--color-on-accent)" }}
            >
              {loading ? "Loading..." : "Apply Filters"}
            </button>
            <button
              onClick={() => {
                setMinScore(undefined);
                setIndustry("");
                setSizeBucket("");
                setCountry("");
                setDecisionMakerOnly(false);
                setExcludePreviousExports(true);
              }}
              className="inline-flex items-center px-6 py-2.5 rounded-lg font-semibold text-sm border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                Results ({leads.length} leads)
              </h3>
              {leads.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={selectAllLeads}
                    className="px-3 py-1.5 text-sm font-medium text-cyan-600 hover:text-cyan-700 border border-cyan-300 rounded-lg hover:bg-cyan-50 transition-colors"
                  >
                    Select All
                  </button>
                  {selectedLeads.size > 0 && (
                    <button
                      onClick={deselectAllLeads}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Clear ({selectedLeads.size})
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {selectedLeads.size > 0 && (
                <>
                  <button
                    onClick={() => setShowAddToListModal(true)}
                    className="px-4 py-2 text-white rounded-lg hover:opacity-90 text-sm font-semibold transition-opacity"
                    style={{ backgroundColor: "var(--color-accent)", color: "var(--color-on-accent)" }}
                  >
                    Add {selectedLeads.size} to List
                  </button>
                  <button
                    onClick={handleExportSelectedCsv}
                    className="px-4 py-2 text-sm font-semibold rounded-lg border hover:bg-gray-50"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-sidebar-border)" }}
                  >
                    Export Selected CSV
                  </button>
                  <button
                    onClick={() => setShowSendToCampaignModal(true)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg border hover:bg-gray-50"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-sidebar-border)" }}
                  >
                    Send to Campaign
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === leads.length && leads.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAllLeads();
                        } else {
                          deselectAllLeads();
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </th>
                  {[
                    { key: "email", label: "Email" },
                    { key: "firstName", label: "Name" },
                    { key: "companyName", label: "Company" },
                    { key: "industry", label: "Industry" },
                    { key: "sizeBucket", label: "Size" },
                    { key: "country", label: "Country" },
                    { key: "role", label: "Role" },
                    { key: "score", label: "Match Quality" },
                  ].map((col) => (
                    <th key={col.key} className="px-4 py-3 text-left font-medium text-gray-700">
                      <button
                        className="flex items-center gap-1 hover:text-gray-900"
                        onClick={() => {
                          const k = col.key as keyof Lead | "score";
                          if (sortBy === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                          else { setSortBy(k); setSortDir("desc"); }
                        }}
                      >
                        <span>{col.label}</span>
                        {sortBy === col.key && (
                          <span className="text-xs text-gray-500">{sortDir === "asc" ? "▲" : "▼"}</span>
                        )}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={8}>
                      Loading leads...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={8}>
                      No leads match these filters yet. Try adjusting your filters or
                      wait for the search to complete.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead, idx) => {
                    const fb = getFeedbackForLead(lead);
                    const [rating, setRating] = useState(fb?.rating || 0);
                    const [feedbackText, setFeedbackText] = useState(fb?.feedback || "");
                    const [submitting, setSubmitting] = useState(false);
                    const [expanded, setExpanded] = useState(false);
                    return (
                      <>
                        <tr
                          key={`${lead.email}-${lead.companyName}-${idx}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedLeads.has(idx)}
                              onChange={() => toggleLeadSelection(idx)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-gray-900 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
                            {lead.email}
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            {lead.firstName || lead.lastName
                              ? `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim()
                              : "-"}
                            {lead.isDecisionMaker && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                DM
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {lead.websiteUrl ? (
                              <a
                                href={lead.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-600 hover:text-cyan-800"
                              >
                                {lead.companyName}
                              </a>
                            ) : (
                              <span className="text-gray-900">{lead.companyName}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{lead.industry || "-"}</td>
                          <td className="px-4 py-3 text-gray-700">{lead.sizeBucket || "-"}</td>
                          <td className="px-4 py-3 text-gray-700">{lead.country || "-"}</td>
                          <td className="px-4 py-3 text-gray-700">{lead.role || "-"}</td>
                          <td className="px-4 py-3">
                            {lead.score !== null ? (
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  lead.score >= 0.8
                                    ? "bg-green-100 text-green-800"
                                    : lead.score >= 0.6
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {Math.round(lead.score * 100)}
                              </span>
                            ) : (
                              <span className="text-gray-700">-</span>
                            )}
                          </td>
                          {/* Feedback controls */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {[1,2,3,4,5].map(star => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={async () => {
                                    setSubmitting(true);
                                    setRating(star);
                                    await submitFeedback(lead, star, feedbackText);
                                    setSubmitting(false);
                                  }}
                                  disabled={submitting}
                                >
                                  <FaStar color={star <= rating ? '#fbbf24' : '#e5e7eb'} />
                                </button>
                              ))}
                            </div>
                            <textarea
                              className="mt-1 w-full border rounded p-1 text-xs"
                              rows={1}
                              placeholder="Feedback (optional)"
                              value={feedbackText}
                              onChange={e => setFeedbackText(e.target.value)}
                              onBlur={async () => {
                                setSubmitting(true);
                                await submitFeedback(lead, rating, feedbackText);
                                setSubmitting(false);
                              }}
                              disabled={submitting}
                            />
                          </td>
                        </tr>
                        {expanded && (
                          <tr className="bg-gray-50">
                            <td colSpan={11} className="px-8 py-4 text-sm text-gray-700 border-t">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <div><b>Email:</b> {lead.email}</div>
                                  <div><b>Name:</b> {lead.firstName} {lead.lastName}</div>
                                  <div><b>Company:</b> {lead.companyName}</div>
                                  <div><b>Website:</b> {lead.websiteUrl}</div>
                                  <div><b>Industry:</b> {lead.industry}</div>
                                  <div><b>Size:</b> {lead.sizeBucket}</div>
                                  <div><b>Country:</b> {lead.country}</div>
                                  <div><b>City:</b> {lead.city}</div>
                                  <div><b>Niche:</b> {lead.niche}</div>
                                  <div><b>Role:</b> {lead.role}</div>
                                  <div><b>Decision Maker:</b> {lead.isDecisionMaker ? 'Yes' : 'No'}</div>
                                  <div><b>Score:</b> {lead.score !== null ? Math.round(lead.score * 100) : '-'}</div>
                                </div>
                                <div>
                                  <div><b>User Feedback:</b> {fb ? `${fb.rating} stars` : 'No feedback yet'}</div>
                                  <div><b>Feedback Text:</b> {fb?.feedback || '-'}</div>
                                  <div><b>AI Score:</b> {fb?.aiScore !== undefined ? fb.aiScore : '-'}</div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add to List Modal */}
        {showAddToListModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Add {selectedLeads.size} Leads to List</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select List
                  </label>
                  <select
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a list...</option>
                    {lists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name} ({list.leadCount} leads)
                      </option>
                    ))}
                    <option value="new">+ Create New List</option>
                  </select>
                </div>

                {selectedListId === "new" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New List Name *
                    </label>
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="e.g., Q1 Prospects"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddToListModal(false);
                    setSelectedListId("");
                    setNewListName("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddToList}
                  disabled={!selectedListId}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to List
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send to Campaign Modal */}
        {showSendToCampaignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Send {selectedLeads.size} Leads to Campaign</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Campaign
                  </label>
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a campaign...</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowSendToCampaignModal(false); setSelectedCampaignId(""); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendSelectedToCampaign}
                  disabled={!selectedCampaignId}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

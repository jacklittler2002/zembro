"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface Contact {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  isLikelyDecisionMaker: boolean;
}

interface Lead {
  id: string;
  name: string;
  domain: string | null;
  websiteUrl: string | null;
  industry: string | null;
  sizeBucket: string | null;
  hqCity: string | null;
  hqCountry: string | null;
  aiConfidence: number | null;
  isFavorited: boolean;
  isArchived: boolean;
  notes: string | null;
  createdAt: string;
  contacts: Contact[];
}

interface LeadStats {
  totalLeads: number;
  favoritedLeads: number;
  archivedLeads: number;
  companiesWithContacts: number;
  avgScore: number | null;
}

export default function LeadsPage() {
  const { user } = useRequireAuth();
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  // Filters
  const [industryFilter, setIndustryFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [minScoreFilter, setMinScoreFilter] = useState<number | undefined>(undefined);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter options
  const [industries, setIndustries] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 50;

  // Modals
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [lists, setLists] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [newListName, setNewListName] = useState("");

  useEffect(() => {
    if (user) {
      loadStats();
      loadFilterOptions();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadLeads();
    }
  }, [
    user,
    page,
    industryFilter,
    sizeFilter,
    countryFilter,
    minScoreFilter,
    showFavoritesOnly,
    showArchived,
    searchQuery,
  ]);

  async function loadStats() {
    try {
      const supabase = await getSupabaseClient();
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(`${API_BASE}/api/leads/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  async function loadFilterOptions() {
    try {
      const supabase = await getSupabaseClient();
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const [industriesRes, countriesRes] = await Promise.all([
        fetch(`${API_BASE}/api/leads/filters/industries`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/leads/filters/countries`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (industriesRes.ok) {
        const data = await industriesRes.json();
        setIndustries(data);
      }

      if (countriesRes.ok) {
        const data = await countriesRes.json();
        setCountries(data);
      }
    } catch (error) {
      console.error("Error loading filter options:", error);
    }
  }

  async function loadLeads() {
    try {
      setLoading(true);
      const supabase = await getSupabaseClient();
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", pageSize.toString());
      if (industryFilter) params.append("industry", industryFilter);
      if (sizeFilter) params.append("sizeBucket", sizeFilter);
      if (countryFilter) params.append("country", countryFilter);
      if (minScoreFilter !== undefined) params.append("minScore", minScoreFilter.toString());
      if (showFavoritesOnly) params.append("isFavorited", "true");
      params.append("isArchived", showArchived.toString());
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`${API_BASE}/api/leads?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error loading leads:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadLists() {
    try {
      const supabase = await getSupabaseClient();
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(`${API_BASE}/api/lists`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setLists(data);
      }
    } catch (error) {
      console.error("Error loading lists:", error);
    }
  }

  async function toggleFavorite(leadId: string, currentStatus: boolean) {
    try {
      const supabase = await getSupabaseClient();
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(`${API_BASE}/api/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFavorited: !currentStatus }),
      });

      if (res.ok) {
        loadLeads();
        loadStats();
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  }

  async function toggleArchive(leadId: string, currentStatus: boolean) {
    try {
      const supabase = await getSupabaseClient();
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(`${API_BASE}/api/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isArchived: !currentStatus }),
      });

      if (res.ok) {
        loadLeads();
        loadStats();
      }
    } catch (error) {
      console.error("Error toggling archive:", error);
    }
  }

  async function handleAddToList() {
    if (selectedLeads.size === 0) {
      alert("Please select at least one lead");
      return;
    }

    try {
      const supabase = await getSupabaseClient();
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      let listId = selectedListId;

      if (selectedListId === "new") {
        if (!newListName.trim()) {
          alert("Please enter a list name");
          return;
        }

        const createRes = await fetch(`${API_BASE}/api/lists`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: newListName }),
        });

        if (!createRes.ok) throw new Error("Failed to create list");

        const newList = await createRes.json();
        listId = newList.id;
      }

      const leadsToAdd = Array.from(selectedLeads).flatMap((leadId) => {
        const lead = leads.find((l) => l.id === leadId);
        if (!lead) return [];

        return lead.contacts.map((contact) => ({
          companyId: lead.id,
          contactId: contact.id,
        }));
      });

      const addRes = await fetch(`${API_BASE}/api/lists/${listId}/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ leads: leadsToAdd }),
      });

      if (!addRes.ok) throw new Error("Failed to add leads to list");

      const result = await addRes.json();
      alert(
        `Added ${result.addedCount} leads to list${result.skippedDuplicates > 0 ? ` (${result.skippedDuplicates} duplicates skipped)` : ""}`
      );

      setShowAddToListModal(false);
      setSelectedLeads(new Set());
      setSelectedListId("");
      setNewListName("");
    } catch (error: any) {
      console.error("Failed to add leads to list:", error);
      alert(error.message);
    }
  }

  function toggleLeadSelection(leadId: string) {
    const newSelection = new Set(selectedLeads);
    if (newSelection.has(leadId)) {
      newSelection.delete(leadId);
    } else {
      newSelection.add(leadId);
    }
    setSelectedLeads(newSelection);
  }

  function selectAllLeads() {
    const allLeadIds = leads.map((l) => l.id);
    setSelectedLeads(new Set(allLeadIds));
  }

  function deselectAllLeads() {
    setSelectedLeads(new Set());
  }

  const sizeOptions = [
    { value: "MICRO", label: "Micro (1-10 employees)" },
    { value: "SMALL", label: "Small (11-50 employees)" },
    { value: "SMB", label: "SMB (51-200 employees)" },
    { value: "MIDMARKET", label: "Mid-Market (201-1000 employees)" },
    { value: "ENTERPRISE", label: "Enterprise (1000+ employees)" },
  ];

  if (loading && leads.length === 0) {
    return (
      <div className="min-h-screen bg-ui p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-ui-muted">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ui p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-ui">Leads</h1>
          <p className="text-ui-muted mt-1">
            Manage your discovered companies and contacts
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface rounded-lg shadow-sm p-6">
              <p className="text-sm text-ui-muted">Total Leads</p>
              <p className="text-3xl font-bold text-ui mt-1">{stats.totalLeads}</p>
            </div>
            <div className="bg-surface rounded-lg shadow-sm p-6">
              <p className="text-sm text-ui-muted">Favorited</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.favoritedLeads}</p>
            </div>
            <div className="bg-surface rounded-lg shadow-sm p-6">
              <p className="text-sm text-ui-muted">With Contacts</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.companiesWithContacts}</p>
            </div>
            <div className="bg-surface p-6 rounded-lg shadow-sm border border-ui">
              <p className="text-sm text-ui-muted">Avg Match Quality</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats.avgScore !== null ? `${stats.avgScore}%` : "N/A"}
              </p>
            </div>
          </div>
        )}

        <div className="bg-surface rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-ui mb-4">Filters</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-ui mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Company name or domain..."
                className="w-full px-3 py-2 border border-ui rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ui mb-1">
                Industry
              </label>
              <select
                value={industryFilter}
                onChange={(e) => {
                  setIndustryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 bg-surface border border-ui rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-ui hover:border-ui"
              >
                <option value="">All Industries</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ui mb-1">
                Company Size
              </label>
              <select
                value={sizeFilter}
                onChange={(e) => {
                  setSizeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 bg-surface border border-ui rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-ui hover:border-ui"
              >
                <option value="">All Sizes</option>
                {sizeOptions.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ui mb-1">
                Country
              </label>
              <select
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 bg-surface border border-ui rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-ui hover:border-ui"
              >
                <option value="">All Countries</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ui mb-2">
                Min Match Quality
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={minScoreFilter !== undefined ? Math.round(minScoreFilter * 100) : ""}
                onChange={(e) => {
                  setMinScoreFilter(
                    e.target.value ? Number(e.target.value) / 100 : undefined
                  );
                  setPage(1);
                }}
                placeholder="0-100"
                className="w-full px-4 py-2.5 bg-surface border border-ui rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-ui hover:border-ui"
              />
            </div>

            <div className="flex flex-col gap-2 justify-center">
              <label className="flex items-center gap-2 text-sm text-ui">
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={(e) => {
                    setShowFavoritesOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                Favorites Only
              </label>
              <label className="flex items-center gap-2 text-sm text-ui">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => {
                    setShowArchived(e.target.checked);
                    setPage(1);
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                Show Archived
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                setIndustryFilter("");
                setSizeFilter("");
                setCountryFilter("");
                setMinScoreFilter(undefined);
                setShowFavoritesOnly(false);
                setShowArchived(false);
                setSearchQuery("");
                setPage(1);
              }}
              className="px-4 py-2 text-sm border border-ui rounded-lg hover:bg-surface-muted text-ui"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {selectedLeads.size > 0 && (
          <div className="bg-secondary-soft border border-secondary rounded-lg p-4 flex items-center justify-between">
            <p className="text-sm font-medium text-secondary">
              {selectedLeads.size} lead{selectedLeads.size === 1 ? "" : "s"} selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={deselectAllLeads}
                className="px-3 py-1.5 text-sm text-ui-muted hover:text-ui"
              >
                Deselect All
              </button>
              <button
                onClick={() => {
                  loadLists();
                  setShowAddToListModal(true);
                }}
                className="px-4 py-2 bg-secondary text-on-accent rounded-lg hover:bg-secondary/90 text-sm font-medium"
              >
                Add to List
              </button>
            </div>
          </div>
        )}

        <div className="bg-surface rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted border-b border-ui">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-ui">
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
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-ui">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-ui">Contacts</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-ui">Industry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-ui">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-ui">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-ui">Match Quality</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-ui">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ui">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-ui-muted">
                      Loading leads...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-ui-muted">
                      No leads found. Try adjusting your filters or run a lead search.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-surface-muted">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedLeads.has(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="max-w-xs">
                          <p className="font-medium text-ui truncate">{lead.name}</p>
                          {lead.websiteUrl && (
                            <a
                              href={lead.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline truncate block"
                            >
                              {lead.domain || lead.websiteUrl}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="max-w-xs space-y-1">
                          {lead.contacts.slice(0, 2).map((contact) => (
                            <div key={contact.id} className="text-xs">
                              <p className="font-medium text-gray-900 truncate">
                                {contact.firstName} {contact.lastName}
                                {contact.isLikelyDecisionMaker && (
                                  <span className="ml-1 text-green-600 font-bold">★</span>
                                )}
                              </p>
                              <p className="text-gray-500 truncate">{contact.email}</p>
                            </div>
                          ))}
                          {lead.contacts.length > 2 && (
                            <p className="text-xs text-gray-500">
                              +{lead.contacts.length - 2} more
                            </p>
                          )}
                          {lead.contacts.length === 0 && (
                            <p className="text-xs text-gray-500">No contacts</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-700">{lead.industry || "-"}</td>
                      <td className="px-4 py-4 text-gray-700">{lead.sizeBucket || "-"}</td>
                      <td className="px-4 py-4 text-gray-700">
                        {lead.hqCity && lead.hqCountry
                          ? `${lead.hqCity}, ${lead.hqCountry}`
                          : lead.hqCountry || "-"}
                      </td>
                      <td className="px-4 py-4">
                        {lead.aiConfidence !== null ? (
                          <div className="flex items-center gap-3 min-w-[120px]">
                            <div className="flex-1 bg-surface-muted rounded-full h-2 min-w-[60px]">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${lead.aiConfidence * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-ui whitespace-nowrap">
                              {Math.round(lead.aiConfidence * 100)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-ui-muted">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1 flex-wrap">
                          <button
                            onClick={() => toggleFavorite(lead.id, lead.isFavorited)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              lead.isFavorited 
                                ? 'bg-warning-soft text-warning hover:bg-warning-soft/80' 
                                : 'bg-surface-muted text-ui-muted hover:bg-surface-muted/80'
                            }`}
                            title={lead.isFavorited ? "Unfavorite" : "Favorite"}
                          >
                            {lead.isFavorited ? "★" : "☆"}
                          </button>
                          <button
                            onClick={() => toggleArchive(lead.id, lead.isArchived)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              lead.isArchived 
                                ? 'bg-surface-muted text-ui-muted hover:bg-surface-muted/80' 
                                : 'bg-error-soft text-error hover:bg-error-soft/80'
                            }`}
                            title={lead.isArchived ? "Unarchive" : "Archive"}
                          >
                            {lead.isArchived ? "📁" : "🗂️"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-4 border-t border-ui flex items-center justify-between">
              <p className="text-sm text-ui-muted">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-ui rounded-lg hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed text-ui"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border border-ui rounded-lg hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed text-ui"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {showAddToListModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">
                Add {selectedLeads.size} Lead{selectedLeads.size === 1 ? "" : "s"} to List
              </h3>

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
                      placeholder="e.g., High Priority Leads"
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
      </div>
    </div>
  );
}

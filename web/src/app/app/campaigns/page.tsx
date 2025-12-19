"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  status: string;
  totalLeads: number;
  emailsSent: number;
  emailsOpened: number;
  emailsReplied: number;
  createdAt: string;
  leadSearch: {
    id: string;
    query: string;
  } | null;
  steps: Array<{
    id: string;
    stepNumber: number;
    delayDays: number;
    subjectLine: string;
  }>;
  emailAccounts: Array<{
    emailAccount: {
      id: string;
      email: string;
    };
  }>;
}

export default function CampaignsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && user) {
      loadCampaigns();
    }
  }, [authLoading, user]);

  async function loadCampaigns() {
    try {
      const res = await fetch("/api/campaigns", {
        headers: { Authorization: `Bearer ${user?.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(id: string, status: string) {
    try {
      await fetch(`/api/campaigns/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.access_token}` },
        body: JSON.stringify({ status }),
      });
      loadCampaigns();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteCampaign(id: string) {
    if (!confirm("Delete this campaign?")) return;
    try {
      await fetch(`/api/campaigns/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${user?.access_token}` } });
      loadCampaigns();
    } catch (err) {
      console.error(err);
      alert("Failed to delete campaign");
    }
  }

  async function duplicateCampaign(id: string) {
    try {
      const res = await fetch(`/api/campaigns/${id}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user?.access_token}` },
      });
      if (res.ok) {
        loadCampaigns();
      } else {
        alert("Failed to duplicate campaign");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to duplicate campaign");
    }
  }

  async function bulkDelete() {
    if (selectedCampaigns.size === 0) return;
    if (!confirm(`Delete ${selectedCampaigns.size} campaigns?`)) return;
    try {
      await Promise.all(Array.from(selectedCampaigns).map(id =>
        fetch(`/api/campaigns/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${user?.access_token}` } })
      ));
      loadCampaigns();
      setSelectedCampaigns(new Set());
    } catch (err) {
      console.error(err);
      alert("Failed to delete campaigns");
    }
  }

  const filteredCampaigns = campaigns.filter(c => {
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  function toggleSelect(id: string) {
    const newSelected = new Set(selectedCampaigns);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedCampaigns(newSelected);
  }

  function selectAll() {
    if (selectedCampaigns.size === filteredCampaigns.length) {
      setSelectedCampaigns(new Set());
    } else {
      setSelectedCampaigns(new Set(filteredCampaigns.map(c => c.id)));
    }
  }

  function statusClass(status: string) {
    if (status === "RUNNING") return "bg-accent-soft text-accent";
    if (status === "PAUSED") return "bg-warning-soft text-warning";
    if (status === "DRAFT") return "bg-surface-muted text-ui-muted";
    if (status === "COMPLETED") return "bg-secondary-soft text-secondary";
    return "bg-surface-muted text-ui-muted";
  }

  if (authLoading || loading) return <div className="p-8"><div className="animate-pulse">Loading campaigns...</div></div>;

  return (
    <div className="min-h-screen bg-ui p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-accent">Email Campaigns</h1>
            <p className="text-ui-muted">Create automated email sequences for your leads</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/app/campaigns/new" className="btn btn-primary">+ New Campaign</Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-surface border border-ui rounded-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-ui rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-ui rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="RUNNING">Running</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
            </select>
            {selectedCampaigns.size > 0 && (
              <button onClick={bulkDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Delete Selected ({selectedCampaigns.size})
              </button>
            )}
          </div>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="rounded-lg border bg-surface shadow-sm p-8 text-center">
            {campaigns.length === 0 ? "No campaigns yet" : "No campaigns match your filters"}
          </div>
        ) : (
          <div className="bg-surface border border-ui rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-muted border-b border-ui">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-ui">
                    <input
                      type="checkbox"
                      checked={selectedCampaigns.size === filteredCampaigns.length && filteredCampaigns.length > 0}
                      onChange={selectAll}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-ui">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-ui">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-ui">Leads</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-ui">Sent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-ui">Opens</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-ui">Replies</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-ui">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ui">
                {filteredCampaigns.map((c) => {
                  const openRate = c.emailsSent > 0 ? ((c.emailsOpened / c.emailsSent) * 100).toFixed(1) : "0.0";
                  const replyRate = c.emailsSent > 0 ? ((c.emailsReplied / c.emailsSent) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={c.id} className="hover:bg-surface-muted">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCampaigns.has(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-ui truncate">{c.name}</div>
                          <div className="text-sm text-ui-muted truncate">{c.steps.length} steps • {c.emailAccounts.length} accounts</div>
                          {c.leadSearch && <div className="text-xs text-ui-muted mt-1 truncate">From: {c.leadSearch.query}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass(c.status)}`}>{c.status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-accent">{c.totalLeads}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-accent">
                        <div className="flex items-center gap-3 min-w-[120px]">
                          <span className="text-sm font-medium">{c.emailsSent}</span>
                          <div className="flex-1 bg-surface-muted rounded-full h-2 min-w-[60px]">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${c.totalLeads > 0 ? (c.emailsSent / c.totalLeads) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-accent">
                        <div className="flex items-center gap-3 min-w-[120px]">
                          <span className="text-sm font-medium">{c.emailsOpened} ({openRate}%)</span>
                          <div className="flex-1 bg-surface-muted rounded-full h-2 min-w-[60px]">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${c.emailsSent > 0 ? (c.emailsOpened / c.emailsSent) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-accent">
                        <div className="flex items-center gap-3 min-w-[120px]">
                          <span className="text-sm font-medium">{c.emailsReplied} ({replyRate}%)</span>
                          <div className="flex-1 bg-surface-muted rounded-full h-2 min-w-[60px]">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${c.emailsSent > 0 ? (c.emailsReplied / c.emailsSent) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {c.status === "DRAFT" && <button onClick={() => changeStatus(c.id, "RUNNING")} className="px-2 py-1 text-xs bg-accent-soft text-accent rounded hover:bg-accent-soft/80 transition-colors">Start</button>}
                          {c.status === "RUNNING" && <button onClick={() => changeStatus(c.id, "PAUSED")} className="px-2 py-1 text-xs bg-warning-soft text-warning rounded hover:bg-warning-soft/80 transition-colors">Pause</button>}
                          {c.status === "PAUSED" && <button onClick={() => changeStatus(c.id, "RUNNING")} className="px-2 py-1 text-xs bg-accent-soft text-accent rounded hover:bg-accent-soft/80 transition-colors">Resume</button>}
                          <Link href={`/app/campaigns/${c.id}`} className="px-2 py-1 text-xs bg-secondary-soft text-secondary rounded hover:bg-secondary-soft/80 transition-colors">View</Link>
                          <button onClick={() => duplicateCampaign(c.id)} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors">Duplicate</button>
                          <button onClick={() => deleteCampaign(c.id)} className="px-2 py-1 text-xs bg-error-soft text-error rounded hover:bg-error-soft/80 transition-colors">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

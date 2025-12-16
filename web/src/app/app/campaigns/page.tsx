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

  useEffect(() => {
    if (!authLoading && user) {
      fetchCampaigns();
    }
  }, [authLoading, user]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns", {
        headers: {
          Authorization: `Bearer ${user?.access_token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        fetchCampaigns();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) {
      return;
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.access_token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchCampaigns();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
            Email Campaigns
          </h1>
          <p className="text-gray-600">
            Create automated email sequences for your leads
          </p>
        </div>
        <Link
          href="/app/campaigns/new"
          className="px-4 py-2 text-white rounded hover:opacity-90"
          style={{ background: "var(--color-accent)", color: "var(--color-on-accent)" }}
        >
          + New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📧</div>
          <p className="text-gray-600 mb-4">No campaigns created yet</p>
          <p className="text-sm text-gray-500 mb-6">
            Create multi-step email sequences to reach your leads automatically
          </p>
          <Link
            href="/app/campaigns/new"
            className="inline-block px-6 py-3 rounded-lg font-medium"
            style={{ background: "var(--color-strong)", color: "var(--color-on-strong)" }}
          >
            Create First Campaign
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Leads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((campaign) => {
                const openRate =
                  campaign.emailsSent > 0
                    ? ((campaign.emailsOpened / campaign.emailsSent) * 100).toFixed(1)
                    : "0.0";
                const replyRate =
                  campaign.emailsSent > 0
                    ? ((campaign.emailsReplied / campaign.emailsSent) * 100).toFixed(1)
                    : "0.0";

                return (
                  <tr key={campaign.id}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {campaign.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {campaign.steps.length} steps • {campaign.emailAccounts.length} accounts
                        </div>
                        {campaign.leadSearch && (
                          <div className="text-xs text-gray-400 mt-1">
                            From: {campaign.leadSearch.query}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === "RUNNING"
                            ? "bg-green-100 text-green-800"
                            : campaign.status === "PAUSED"
                            ? "bg-yellow-100 text-yellow-800"
                            : campaign.status === "DRAFT"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.totalLeads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        <div>Sent: {campaign.emailsSent}</div>
                        <div className="flex gap-3">
                          <span title="Open Rate">Opens: {openRate}%</span>
                          <span title="Reply Rate">Replies: {replyRate}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col gap-2">
                        {campaign.status === "DRAFT" && (
                          <button
                            onClick={() => handleStatusChange(campaign.id, "RUNNING")}
                            className="text-green-600 hover:text-green-900 text-left"
                          >
                            Start
                          </button>
                        )}
                        {campaign.status === "RUNNING" && (
                          <button
                            onClick={() => handleStatusChange(campaign.id, "PAUSED")}
                            className="text-yellow-600 hover:text-yellow-900 text-left"
                          >
                            Pause
                          </button>
                        )}
                        {campaign.status === "PAUSED" && (
                          <button
                            onClick={() => handleStatusChange(campaign.id, "RUNNING")}
                            className="text-green-600 hover:text-green-900 text-left"
                          >
                            Resume
                          </button>
                        )}
                        <Link
                          href={`/app/campaigns/${campaign.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="text-red-600 hover:text-red-900 text-left"
                        >
                          Delete
                        </button>
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
  );
}

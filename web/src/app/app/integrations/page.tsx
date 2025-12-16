"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useState } from "react";

const integrations = [
  {
    id: "hubspot",
    name: "HubSpot",
    icon: "🟠",
    description: "Sync leads to HubSpot CRM automatically",
    category: "CRM",
    status: "coming-soon",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    icon: "☁️",
    description: "Push enriched leads to Salesforce",
    category: "CRM",
    status: "coming-soon",
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    icon: "🟢",
    description: "Create deals and contacts in Pipedrive",
    category: "CRM",
    status: "coming-soon",
  },
  {
    id: "slack",
    name: "Slack",
    icon: "💬",
    description: "Get notified about new leads and campaign updates",
    category: "Communication",
    status: "coming-soon",
  },
  {
    id: "zapier",
    name: "Zapier",
    icon: "⚡",
    description: "Connect to 5,000+ apps via Zapier",
    category: "Automation",
    status: "coming-soon",
  },
  {
    id: "make",
    name: "Make (Integromat)",
    icon: "🔷",
    description: "Build advanced automation workflows",
    category: "Automation",
    status: "coming-soon",
  },
  {
    id: "webhook",
    name: "Webhooks",
    icon: "🔗",
    description: "Send data to custom endpoints in real-time",
    category: "Developer",
    status: "coming-soon",
  },
  {
    id: "api",
    name: "REST API",
    icon: "🔌",
    description: "Access Zembro programmatically",
    category: "Developer",
    status: "coming-soon",
  },
];

export default function IntegrationsPage() {
  const { loading: authLoading } = useRequireAuth();
  const [filter, setFilter] = useState("all");

  if (authLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div style={{ color: "var(--color-sidebar-border)" }}>Loading...</div>
      </div>
    );
  }

  const categories = ["all", ...Array.from(new Set(integrations.map((i) => i.category)))];
  const filtered =
    filter === "all"
      ? integrations
      : integrations.filter((i) => i.category === filter);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
              Integrations
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Connect Zembro with your favorite tools and platforms
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                filter === cat
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((integration) => (
            <div
              key={integration.id}
              className="rounded-lg border bg-white shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl">{integration.icon}</div>
                {integration.status === "coming-soon" && (
                  <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 font-medium">
                    Coming Soon
                  </span>
                )}
              </div>

              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                {integration.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

              <div className="flex items-center gap-2">
                <button
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed"
                  disabled
                >
                  Connect
                </button>
                <button
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed"
                  disabled
                >
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="rounded-lg border bg-cyan-50 border-cyan-200 p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h4 className="font-semibold mb-1" style={{ color: "var(--color-text)" }}>
                Need a Specific Integration?
              </h4>
              <p className="text-sm text-gray-700 mb-3">
                We're actively building integrations with popular platforms. Let us know what
                tools you use and we'll prioritize them.
              </p>
              <button
                className="text-sm font-medium hover:underline"
                style={{ color: "var(--color-accent)" }}
              >
                Request an Integration →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

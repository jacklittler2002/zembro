"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { LowCreditWarning } from "@/components/LowCreditWarning";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

const sizeOptions = [
  { value: "", label: "All Sizes" },
  { value: "MICRO", label: "Micro (1-10 employees)" },
  { value: "SMALL", label: "Small (11-50 employees)" },
  { value: "SMB", label: "SMB (51-200 employees)" },
  { value: "MIDMARKET", label: "Mid-Market (201-1000 employees)" },
  { value: "ENTERPRISE", label: "Enterprise (1000+ employees)" },
];

export default function NewLeadSearchPage() {
  const router = useRouter();
  const { loading: authLoading, user } = useRequireAuth();

  const [query, setQuery] = useState("");
  const [maxLeads, setMaxLeads] = useState(100);
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [companySize, setCompanySize] = useState("");
  
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Fetch credit balance
  useEffect(() => {
    async function fetchBalance() {
      if (authLoading || !user) return;

      try {
        const { data: session } = await supabaseBrowser.auth.getSession();
        const token = session.session?.access_token;

        const res = await fetch(`${API_BASE}/api/ted/balance`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setCreditBalance(data.balance);
        }
      } catch (error) {
        console.error("Failed to fetch credit balance:", error);
      }
    }

    fetchBalance();
  }, [authLoading, user]);

  // Calculate estimated cost
  useEffect(() => {
    // Rough estimate: 10 credits per lead discovered
    setEstimatedCost(maxLeads * 10);
  }, [maxLeads]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);

    try {
      const { data: session } = await supabaseBrowser.auth.getSession();
      const token = session.session?.access_token;

      // Build filters object
      const filters: any = {};
      if (industry) filters.industry = industry;
      if (location) filters.location = location;
      if (companySize) filters.companySize = companySize;

      const res = await fetch(`${API_BASE}/api/lead-searches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          query,
          maxLeads,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/app/lead-searches/${data.leadSearch.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create lead search");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create lead search");
    } finally {
      setCreating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div style={{ color: "var(--color-sidebar-border)" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Low credit warning */}
        {creditBalance !== null && <LowCreditWarning creditBalance={creditBalance} requiredCredits={estimatedCost} />}

        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
            Create New Lead Search
          </h2>
          <p style={{ color: "var(--color-sidebar-border)" }}>
            Describe what kind of leads you're looking for and we'll find them for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Search Query */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text)" }}>
              Search Query
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What are you looking for? *
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
                rows={3}
                placeholder="e.g., 'dentists in London', 'SaaS companies in San Francisco', 'yoga studios in Los Angeles'"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-gray-700 hover:border-gray-400"
              />
              <p className="text-sm text-gray-500 mt-2">
                Tip: Be specific about industry, location, or company type for better results.
              </p>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text)" }}>
              Filters (Optional)
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g., Healthcare, Technology"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-gray-700 hover:border-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., London, United Kingdom"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-gray-700 hover:border-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Size
                </label>
                <select
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-gray-700 hover:border-gray-400"
                >
                  {sizeOptions.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Leads
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={maxLeads}
                  onChange={(e) => setMaxLeads(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-gray-700 hover:border-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Cost Estimate */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--color-text)" }}>
                  Estimated Cost
                </h3>
                <p className="text-sm text-gray-600">
                  Based on {maxLeads} max leads
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold" style={{ color: "var(--color-accent)" }}>
                  {estimatedCost.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">credits</div>
              </div>
            </div>
            
            {creditBalance !== null && (
              <div className="mt-4 pt-4 border-t border-cyan-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Your balance:</span>
                  <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                    {creditBalance.toLocaleString()} credits
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">After search:</span>
                  <span 
                    className="font-semibold"
                    style={{ color: creditBalance - estimatedCost >= 0 ? "#10B981" : "#EF4444" }}
                  >
                    {(creditBalance - estimatedCost).toLocaleString()} credits
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-lg font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !query.trim() || (creditBalance !== null && creditBalance < estimatedCost)}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              {creating ? "Creating Search..." : "Start Lead Search"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

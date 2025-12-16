"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import Link from "next/link";

export default function AnalyticsPage() {
  const { loading: authLoading } = useRequireAuth();

  if (authLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div style={{ color: "var(--color-sidebar-border)" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
              Analytics & Reports
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Track performance metrics across all your campaigns and searches
            </p>
          </div>
          <div className="flex gap-3">
            <select className="px-3 py-2 rounded-lg border border-gray-300 text-sm" disabled>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>All time</option>
            </select>
          </div>
        </div>

        {/* Coming Soon Card */}
        <div className="rounded-lg border bg-white shadow-sm p-12 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
              Analytics Dashboard Coming Soon
            </h3>
            <p className="text-gray-600">
              Get deep insights into your lead generation and outreach performance with
              comprehensive analytics.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 text-left">
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--color-text)" }}>
                  Campaign Performance
                </h4>
                <p className="text-xs text-gray-600">
                  Track email open rates, click rates, reply rates, and conversions
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-2xl mb-2">🎯</div>
                <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--color-text)" }}>
                  Lead Quality Metrics
                </h4>
                <p className="text-xs text-gray-600">
                  Analyze lead scores, industries, company sizes, and conversion patterns
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-2xl mb-2">💰</div>
                <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--color-text)" }}>
                  ROI Tracking
                </h4>
                <p className="text-xs text-gray-600">
                  Monitor credit usage, lead costs, and campaign effectiveness
                </p>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/app/leads"
                className="inline-flex items-center px-6 py-3 rounded-lg font-medium text-sm"
                style={{
                  background: "var(--color-primary)",
                  color: "var(--color-on-accent)",
                }}
              >
                View Your Leads →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

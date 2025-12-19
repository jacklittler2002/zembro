"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  const { loading: authLoading } = useRequireAuth();

  if (authLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-sidebar">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-ui">Analytics & Reports</h2>
            <p className="text-sm mt-1 text-ui-muted">Track performance metrics across all your campaigns and searches</p>
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
            <div className="text-6xl mb-4" aria-hidden>Analytics</div>
            <h3 className="text-2xl font-semibold text-ui">Analytics Dashboard Coming Soon</h3>
            <p className="text-ui-muted">Get deep insights into your lead generation and outreach performance with
              comprehensive analytics.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 text-left">
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-2xl mb-2">Overview</div>
                <h4 className="font-semibold text-sm mb-1 text-ui">Campaign Performance</h4>
                <p className="text-xs text-ui-muted">Track email open rates, click rates, reply rates, and conversions</p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-2xl mb-2">Quality</div>
                <h4 className="font-semibold text-sm mb-1 text-ui">Lead Quality Metrics</h4>
                <p className="text-xs text-ui-muted">Analyze lead scores, industries, company sizes, and conversion patterns</p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-2xl mb-2">Revenue</div>
                <h4 className="font-semibold text-sm mb-1 text-ui">ROI Tracking</h4>
                <p className="text-xs text-ui-muted">Monitor credit usage, lead costs, and campaign effectiveness</p>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/app/leads"
                className="btn btn-primary"
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

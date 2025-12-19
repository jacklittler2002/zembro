
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchBillingStatus } from "@/lib/api/billing";

export default function AppDashboard() {
  const [trialStatus, setTrialStatus] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    fetchBillingStatus().then((data) => {
      setTrialStatus(data.trialStatus);
    });
  }, []);

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {showBanner && trialStatus && !trialStatus.expired && !trialStatus.active && (
          <div className="mb-8 p-4 rounded-lg flex items-center justify-between bg-accent-soft border border-accent text-accent">
            <span>
              <b>Try Zembro Pro Free for 1 Week!</b> Upgrade now and get a free trial—no risk, cancel anytime.
            </span>
            <button
              className="ml-4 px-3 py-1 rounded text-xs font-semibold hover:opacity-80 bg-accent text-on-accent"
              onClick={() => setShowBanner(false)}
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-accent">
            Welcome to Zembro
          </h2>
          <p className="text-lg text-ui-muted">
            Run lead searches, review enrichment, and talk to TED – all in one place.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link
            href="/app/lead-searches"
            className="block p-8 bg-surface rounded-xl shadow-sm border hover:shadow-md transition-shadow border-ui"
          >
            <div className="mb-4">
              <svg className="w-16 h-16" fill="none" stroke="var(--color-accent)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-accent">
              Lead Searches
            </h3>
            <p className="text-ui-muted">
              Create and manage lead discovery searches. View results, filter by match quality, and export to CSV.
            </p>
            <div className="mt-4 inline-block px-4 py-2 rounded-lg font-medium bg-accent-soft text-accent">
              Go to searches →
            </div>
          </Link>

          <Link
            href="/app/ted"
            className="block p-8 bg-surface rounded-xl shadow-sm border hover:shadow-md transition-shadow border-ui"
          >
            <div className="mb-4">
              <svg className="w-16 h-16" fill="none" stroke="var(--color-accent)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-accent">
              TED AI Assistant
            </h3>
            <p className="text-ui-muted">
              Chat with TED to find leads, build lists, and get insights. TED handles the heavy lifting for you.
            </p>
            <div className="mt-4 inline-block px-4 py-2 rounded-lg font-medium bg-secondary-soft text-secondary">
              Chat with TED →
            </div>
          </Link>
        </div>

        <div className="bg-surface rounded-xl shadow-sm border p-6 border-ui">
          <h3 className="text-lg font-semibold mb-4 text-accent">
            Recent Activity
          </h3>
          <p className="text-ui-muted">
            Your recent searches and conversations will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}

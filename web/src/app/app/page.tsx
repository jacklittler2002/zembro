
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
          <div className="mb-8 p-4 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-900 flex items-center justify-between">
            <span>
              <b>Try Zembro Pro Free for 1 Week!</b> Upgrade now and get a free trial—no risk, cancel anytime.
            </span>
            <button
              className="ml-4 px-3 py-1 rounded bg-cyan-100 text-cyan-800 text-xs font-semibold hover:bg-cyan-200"
              onClick={() => setShowBanner(false)}
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
            Welcome to Zembro
          </h2>
          <p className="text-lg" style={{ color: "var(--color-sidebar-border)" }}>
            Run lead searches, review enrichment, and talk to TED – all in one place.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link 
            href="/app/lead-searches"
            className="block p-8 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="mb-4">
              <svg className="w-16 h-16" fill="none" stroke="var(--color-accent)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
              Lead Searches
            </h3>
            <p style={{ color: "var(--color-sidebar-border)" }}>
              Create and manage lead discovery searches. View results, filter by match quality, and export to CSV.
            </p>
            <div className="mt-4 inline-block px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: "var(--color-accent-soft)", color: "var(--color-accent)" }}>
              Go to searches →
            </div>
          </Link>

          <Link 
            href="/app/ted"
            className="block p-8 bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="mb-4">
              <svg className="w-16 h-16" fill="var(--color-secondary)" viewBox="0 0 64 64">
                <circle cx="16" cy="16" r="8"/>
                <circle cx="48" cy="16" r="8"/>
                <circle cx="32" cy="36" r="20"/>
                <circle cx="26" cy="32" r="2.5" fill="white"/>
                <circle cx="38" cy="32" r="2.5" fill="white"/>
                <path d="M24 40 Q32 46 40 40" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
              TED AI Assistant
            </h3>
            <p style={{ color: "var(--color-sidebar-border)" }}>
              Chat with TED to find leads, build lists, and get insights. TED handles the heavy lifting for you.
            </p>
            <div className="mt-4 inline-block px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: "var(--color-secondary-soft)", color: "var(--color-secondary)" }}>
              Chat with TED →
            </div>
          </Link>
        </div>

        {/* Quick stats or recent activity could go here */}
        <div className="bg-white rounded-xl shadow-sm border p-6" style={{ borderColor: "var(--color-border)" }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text)" }}>
            Recent Activity
          </h3>
          <p style={{ color: "var(--color-sidebar-border)" }}>
            {/* TODO: Fetch and display recent lead searches or TED conversations */}
            Your recent searches and conversations will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}

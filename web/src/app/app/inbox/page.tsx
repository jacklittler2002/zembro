"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import Link from "next/link";

export default function InboxPage() {
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
              Inbox
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage replies and conversations from your campaigns
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm border border-gray-300 bg-white text-gray-700"
              disabled
            >
              Mark All Read
            </button>
          </div>
        </div>

        {/* Coming Soon Card */}
        <div className="rounded-lg border bg-white shadow-sm p-12 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
              Unified Inbox Coming Soon
            </h3>
            <p className="text-gray-600">
              Manage all your email conversations in one place. Never miss a reply from a prospect.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 text-left">
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-2xl mb-2">📨</div>
                <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--color-text)" }}>
                  Centralized View
                </h4>
                <p className="text-xs text-gray-600">
                  All replies from your campaigns in one unified inbox
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-2xl mb-2">🤖</div>
                <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--color-text)" }}>
                  AI-Powered Replies
                </h4>
                <p className="text-xs text-gray-600">
                  Get AI-suggested responses based on conversation context
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-2xl mb-2">🏷️</div>
                <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--color-text)" }}>
                  Smart Categorization
                </h4>
                <p className="text-xs text-gray-600">
                  Automatically tag replies as interested, not interested, or questions
                </p>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/app/campaigns"
                className="inline-flex items-center px-6 py-3 rounded-lg font-medium text-sm"
                style={{
                  background: "var(--color-strong)",
                  color: "var(--color-on-strong)",
                }}
              >
                View Campaigns →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import Link from "next/link";

export default function InboxPage() {
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
              <h2 className="text-2xl font-semibold text-ui">Inbox</h2>
              <p className="text-sm mt-1 text-ui-muted">Manage replies and conversations from your campaigns</p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-ghost" disabled>Mark All Read</button>
          </div>
        </div>

        {/* Coming Soon Card */}
        <div className="rounded-lg border bg-white shadow-sm p-12 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="text-6xl mb-4" aria-hidden>Inbox</div>
              <h3 className="text-2xl font-semibold text-ui">Unified Inbox Coming Soon</h3>
              <p className="text-ui-muted">Manage all your email conversations in one place. Never miss a reply from a prospect.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 text-left">
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-2xl mb-2">Messages</div>
                <h4 className="font-semibold text-sm mb-1 text-ui">Centralized View</h4>
                  <p className="text-xs text-ui-muted">All replies from your campaigns in one unified inbox</p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-2xl mb-2">AI Replies</div>
                <h4 className="font-semibold text-sm mb-1 text-ui">AI-Powered Replies</h4>
                  <p className="text-xs text-ui-muted">Get AI-suggested responses based on conversation context</p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-2xl mb-2">Tags</div>
                <h4 className="font-semibold text-sm mb-1 text-ui">Smart Categorization</h4>
                  <p className="text-xs text-ui-muted">Automatically tag replies as interested, not interested, or questions</p>
              </div>
            </div>

            <div className="pt-6">
              <Link href="/app/campaigns" className="btn btn-strong">View Campaigns →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

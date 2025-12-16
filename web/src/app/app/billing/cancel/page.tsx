"use client";

import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-xl p-12 shadow-sm border" style={{ borderColor: "var(--color-border)" }}>
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
            Payment Canceled
          </h1>
          <p className="text-lg mb-8" style={{ color: "var(--color-sidebar-border)" }}>
            Your payment was canceled. No charges were made to your account.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/app/billing"
              className="inline-block px-8 py-3 rounded-lg font-semibold text-white"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              Back to Billing
            </Link>
            <Link
              href="/app"
              className="inline-block px-8 py-3 rounded-lg font-semibold border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-sidebar-border)" }}
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

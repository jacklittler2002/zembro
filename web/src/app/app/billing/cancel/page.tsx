"use client";

import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-xl p-12 shadow-sm border border-ui">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-3xl font-bold mb-4 text-ui">Payment Canceled</h1>
          <p className="text-lg mb-8 text-sidebar">Your payment was canceled. No charges were made to your account.</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/app/billing"
              className="btn btn-primary"
            >
              Back to Billing
            </Link>
            <Link
              href="/app"
              className="inline-block px-8 py-3 rounded-lg font-semibold border border-ui text-sidebar"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

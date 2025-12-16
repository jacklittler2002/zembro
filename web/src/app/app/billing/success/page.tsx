"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BillingSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to billing page after 3 seconds
    const timeout = setTimeout(() => {
      router.push("/app/billing");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-xl p-12 shadow-sm border" style={{ borderColor: "var(--color-border)" }}>
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
            Payment Successful!
          </h1>
          <p className="text-lg mb-8" style={{ color: "var(--color-sidebar-border)" }}>
            Your purchase was completed successfully. Your credits will be available shortly.
          </p>
          <Link
            href="/app/billing"
            className="inline-block px-8 py-3 rounded-lg font-semibold text-white"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            Go to Billing
          </Link>
          <p className="text-sm mt-4" style={{ color: "var(--color-sidebar-border)" }}>
            Redirecting automatically in 3 seconds...
          </p>
        </div>
      </div>
    </div>
  );
}

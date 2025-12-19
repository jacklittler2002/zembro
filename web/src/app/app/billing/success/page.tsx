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
        <div className="bg-white rounded-xl p-12 shadow-sm border border-ui">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-bold mb-4 text-ui">Payment Successful!</h1>
          <p className="text-lg mb-8 text-sidebar">Your purchase was completed successfully. Your credits will be available shortly.</p>
          <Link
            href="/app/billing"
            className="btn btn-primary"
          >
            Go to Billing
          </Link>
          <p className="text-sm mt-4 text-sidebar">Redirecting automatically in 3 seconds...</p>
        </div>
      </div>
    </div>
  );
}

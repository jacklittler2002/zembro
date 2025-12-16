
"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";

import {
  fetchBillingStatus,
  createSubscriptionCheckout,
  createCreditPackCheckout,
  BillingStatus,
} from "@/lib/api/billing";

import { PLAN_ENTITLEMENTS, PlanCode } from "../../monetization/planEntitlements";


const LIMIT_LABELS: Record<string, string> = {
  maxActiveSearches: "Active lead searches",
  maxLeadsPerSearch: "Leads per search",
  maxExportContactsPerExport: "Contacts per export",
  crawlMaxPagesPerDomain: "Pages per domain crawl",
};

const CREDIT_PACKS = [
  { code: "5K", credits: 5000, price: 49, label: "5,000 credits" },
  { code: "20K", credits: 20000, price: 149, label: "20,000 credits" },
  { code: "50K", credits: 50000, price: 299, label: "50,000 credits" },
];

export default function BillingPage() {
  // Helper for trial banner
  function renderTrialBanner() {
    if (!billing?.trialStatus) return null;
    if (billing.trialStatus.active) {
      return (
        <div className="mb-6 p-4 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-900 text-center">
          <b>Free 1-Week Trial Active!</b> Enjoy full access until {billing.trialStatus.trialEnd ? new Date(billing.trialStatus.trialEnd).toLocaleDateString() : "trial end"}.
        </div>
      );
    }
    if (!billing.trialStatus.expired && !billing.trialStatus.active && currentPlan === "FREE") {
      return (
        <div className="mb-6 p-4 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-900 text-center">
          <b>Try Any Paid Plan Free for 1 Week!</b> Upgrade now and get a free trial—no risk, cancel anytime.
        </div>
      );
    }
    return null;
  }
  useRequireAuth();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBillingStatus();
      setBilling(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load billing status");
    } finally {
      setLoading(false);
    }
  }

  const handleSubscriptionCheckout = async (planCode: PlanCode) => {
    setCheckoutLoading(`sub-${planCode}`);
    try {
      const url = await createSubscriptionCheckout(planCode);
      window.location.href = url;
    } catch (err: any) {
      alert(err?.message || "Failed to create checkout session");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleCreditPackCheckout = async (packCode: string) => {
    setCheckoutLoading(`pack-${packCode}`);
    try {
      const url = await createCreditPackCheckout(packCode);
      window.location.href = url;
    } catch (err: any) {
      alert(err?.message || "Failed to create checkout session");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const currentPlan = (billing?.planCode as PlanCode) || "FREE";
  const currentPlanData = PLAN_ENTITLEMENTS[currentPlan] || PLAN_ENTITLEMENTS.FREE;
  const creditBalance = billing?.credits ?? 0;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div style={{ color: "var(--color-sidebar-border)" }}>Loading billing status...</div>
      </div>
    );
  }

  return (
    <div className="p-8" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
            Billing & Credits
          </h1>
          <p className="text-lg" style={{ color: "var(--color-sidebar-border)" }}>
            Manage your subscription, top up credits, and view plan limits.
          </p>
        </div>

        {renderTrialBanner()}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm mb-6">{error}</div>
        )}

        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-sm" style={{ color: "var(--color-sidebar-border)" }}>
                Current Plan
              </div>
              <div className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                {currentPlanData.name}
              </div>
              <div className="text-sm mt-1" style={{ color: "var(--color-sidebar-border)" }}>
                {currentPlanData.monthlyCredits.toLocaleString()} monthly credits • {PLAN_LIMITS[currentPlan].maxLeadSearchActive} active lead searches
              </div>
              {billing?.currentPeriodEnd && (
                <div className="text-sm" style={{ color: "var(--color-sidebar-border)" }}>
                  Renews: {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm" style={{ color: "var(--color-sidebar-border)" }}>
                Credits Balance
              </div>
              <div className="text-4xl font-bold" style={{ color: "var(--color-accent)" }}>
                {creditBalance.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--color-text)" }}>
            Subscription Plans
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {Object.entries(PLAN_ENTITLEMENTS).map(([code, plan]) => (
              <div
                key={code}
                className={`bg-white rounded-xl p-6 shadow-sm border ${currentPlan === code ? "ring-2 ring-cyan-500" : ""}`}
                style={{ borderColor: currentPlan === code ? "var(--color-accent)" : "var(--color-border)" }}
              >
                {currentPlan === code && (
                  <div
                    className="text-xs font-semibold px-3 py-1 rounded-full mb-4 inline-block"
                    style={{ backgroundColor: "var(--color-accent-soft)", color: "var(--color-accent)" }}
                  >
                    Current Plan
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
                  {plan.label}
                </h3>
                <div className="mb-2 text-sm" style={{ color: "var(--color-sidebar-border)" }}>
                  Includes {plan.monthlyCredits.toLocaleString()} credits/mo
                </div>
                {/* Price: You may want to fetch this from backend or config if needed */}
                <div className="mb-4">
                  <span className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                    {/* £{plan.price} */}
                  </span>
                  <span style={{ color: "var(--color-sidebar-border)" }}>/mo</span>
                </div>
                <div className="mb-4 space-y-2 text-sm" style={{ color: "var(--color-sidebar-border)" }}>
                  {Object.keys(LIMIT_LABELS).map((key) => (
                    <div key={key} className="flex items-start justify-between gap-2">
                      <span>{LIMIT_LABELS[key]}</span>
                      <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                        {plan[key as keyof typeof plan]?.toLocaleString?.() ?? "-"}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Features: You may want to add a features array to PLAN_ENTITLEMENTS or fetch from config */}
                {code !== "FREE" && currentPlan !== code && (
                  <button
                    onClick={() => handleSubscriptionCheckout(code as PlanCode)}
                    disabled={checkoutLoading === `sub-${code}`}
                    className="w-full py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "var(--color-accent)" }}
                  >
                    {checkoutLoading === `sub-${code}` ? "Loading..." : "Upgrade"}
                  </button>
                )}
                {currentPlan === code && code !== "FREE" && (
                  <button
                    className="w-full py-3 rounded-lg font-semibold border"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-sidebar-border)" }}
                  >
                    Manage Subscription
                  </button>
                )}
                {code === "FREE" && currentPlan === "FREE" && (
                  <button
                    className="w-full py-3 rounded-lg font-semibold border"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-sidebar-border)" }}
                    disabled
                  >
                    You are on Free
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
            Buy Credit Packs
          </h2>
          <p className="mb-6" style={{ color: "var(--color-sidebar-border)" }}>
            Need more credits? Purchase one-time credit packs that never expire.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.code}
                className="bg-white rounded-xl p-6 shadow-sm border"
                style={{ borderColor: "var(--color-border)" }}
              >
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
                  {pack.label}
                </h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                    £{pack.price}
                  </span>
                </div>
                <div className="mb-6 text-sm" style={{ color: "var(--color-sidebar-border)" }}>
                  One-time purchase • Never expires
                </div>
                <button
                  onClick={() => handleCreditPackCheckout(pack.code)}
                  disabled={checkoutLoading === `pack-${pack.code}`}
                  className="w-full py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-secondary)" }}
                >
                  {checkoutLoading === `pack-${pack.code}` ? "Loading..." : "Buy Now"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

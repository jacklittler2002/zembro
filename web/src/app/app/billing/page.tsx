
"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";

import {
  fetchBillingStatus,
  createSubscriptionCheckout,
  createCreditPackCheckout,
  BillingStatus,
} from "@/lib/api/billing";

import { PLAN_ENTITLEMENTS, PlanCode } from "@/monetization/planEntitlements";


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
        <div className="text-sidebar">Loading billing status...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-ui text-ui">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-ui">
            Billing & Credits
          </h1>
          <p className="text-lg text-sidebar">
            Manage your subscription, top up credits, and view plan limits.
          </p>
        </div>

        {renderTrialBanner()}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm mb-6">{error}</div>
        )}

        <div className="bg-surface rounded-xl p-6 shadow-sm border mb-8 border-ui">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-sm text-sidebar">
                Current Plan
              </div>
              <div className="text-2xl font-bold text-ui">
                {currentPlanData.label}
              </div>
              <div className="text-sm mt-1 text-sidebar">
                {currentPlanData.monthlyCredits.toLocaleString()} monthly credits • {PLAN_ENTITLEMENTS[currentPlan].maxActiveSearches} active lead searches
              </div>
              {billing?.currentPeriodEnd && (
                <div className="text-sm text-sidebar">
                  Renews: {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-sidebar">
                Credits Balance
              </div>
              <div className="text-4xl font-bold text-accent">
                {creditBalance.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-ui">
            Subscription Plans
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {Object.entries(PLAN_ENTITLEMENTS).map(([code, plan]) => (
                <div
                key={code}
                className={`bg-surface rounded-xl p-6 shadow-sm border ${currentPlan === code ? "ring-2 ring-cyan-500" : ""} ${currentPlan === code ? 'border-accent' : 'border-ui'}`}
              >
                {currentPlan === code && (
                    <div
                    className="text-xs font-semibold px-3 py-1 rounded-full mb-4 inline-block bg-accent-soft text-accent"
                  >
                    Current Plan
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2 text-ui">
                  {plan.label}
                </h3>
                <div className="mb-2 text-sm text-sidebar">
                  Includes {plan.monthlyCredits.toLocaleString()} credits/mo
                </div>
                {/* Price: You may want to fetch this from backend or config if needed */}
                <div className="mb-4">
                  <span className="text-3xl font-bold text-ui">
                    {/* £{plan.price} */}
                  </span>
                  <span className="text-sidebar">/mo</span>
                </div>
                <div className="mb-4 space-y-2 text-sm text-sidebar">
                  {Object.keys(LIMIT_LABELS).map((key) => (
                    <div key={key} className="flex items-start justify-between gap-2">
                      <span>{LIMIT_LABELS[key]}</span>
                      <span className="font-semibold text-ui">
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
                    className="btn btn-primary w-full"
                  >
                    {checkoutLoading === `sub-${code}` ? "Loading..." : "Upgrade"}
                  </button>
                )}
                {currentPlan === code && code !== "FREE" && (
                  <button
                    className="btn btn-ghost w-full"
                  >
                    Manage Subscription
                  </button>
                )}
                {code === "FREE" && currentPlan === "FREE" && (
                  <button
                    className="btn btn-ghost w-full"
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
          <h2 className="text-2xl font-bold mb-2 text-ui">
            Buy Credit Packs
          </h2>
          <p className="mb-6 text-sidebar">
            Need more credits? Purchase one-time credit packs that never expire.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
                {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.code}
                className="bg-surface rounded-xl p-6 shadow-sm border border-ui"
              >
                <h3 className="text-xl font-bold mb-2 text-ui">
                  {pack.label}
                </h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-ui">
                    £{pack.price}
                  </span>
                </div>
                <div className="mb-6 text-sm text-sidebar">
                  One-time purchase • Never expires
                </div>
                <button
                  onClick={() => handleCreditPackCheckout(pack.code)}
                  disabled={checkoutLoading === `pack-${pack.code}`}
                  className="btn btn-secondary w-full"
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

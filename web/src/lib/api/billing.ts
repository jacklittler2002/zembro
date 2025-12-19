const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export type BillingStatus = {
  stripeCustomerId: string | null;
  planCode: "FREE" | "STARTER" | "GROWTH" | "SCALE" | string;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  credits: number;
  trialStatus?: {
    active: boolean;
    trialEnd?: string;
    expired?: boolean;
  };
};

async function authedHeaders(): Promise<Record<string, string>> {
  const { getSupabaseClient } = await import("../supabaseClient");
  const supabase = await getSupabaseClient();
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchBillingStatus(): Promise<BillingStatus> {
  const headers = await authedHeaders();
  const res = await fetch(`${API_BASE}/api/billing/status`, { headers });
  if (!res.ok) throw new Error("Failed to load billing status");
  return res.json();
}

export async function createSubscriptionCheckout(planCode: string): Promise<string> {
  const headers = await authedHeaders();
  const res = await fetch(`${API_BASE}/api/billing/checkout/subscription`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ planCode }),
  });
  if (!res.ok) throw new Error("Failed to start subscription checkout");
  const data = await res.json();
  return data.url;
}

export async function createCreditPackCheckout(packCode: string): Promise<string> {
  const headers = await authedHeaders();
  const res = await fetch(`${API_BASE}/api/billing/checkout/credits`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ packCode }),
  });
  if (!res.ok) throw new Error("Failed to start credit checkout");
  const data = await res.json();
  return data.url;
}

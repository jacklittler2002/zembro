import { PLAN_ENTITLEMENTS, PlanCode } from "./entitlements";
import { CREDIT_PRICING } from "./pricing";
import { getCreditBalance, consumeCredits } from "../ted/creditService";

export class PlanLimitError extends Error {
  code = "PLAN_LIMIT_REACHED" as const;
  constructor(public details: any) {
    super("PLAN_LIMIT_REACHED");
  }
}

export class InsufficientCreditsError extends Error {
  code = "INSUFFICIENT_CREDITS" as const;
  constructor(public details: any) {
    super("INSUFFICIENT_CREDITS");
  }
}

export function getEntitlements(plan: PlanCode) {
  return PLAN_ENTITLEMENTS[plan];
}

export async function requireCredits(userId: string, amount: number, reason: string) {
  const balance = await getCreditBalance(userId);
  if (balance < amount) {
    throw new InsufficientCreditsError({ required: amount, available: balance, reason });
  }
  await consumeCredits(userId, amount, reason);
}

export function requireFeature(plan: PlanCode, flag: keyof typeof PLAN_ENTITLEMENTS["FREE"]) {
  const e = PLAN_ENTITLEMENTS[plan];
  if (!e[flag]) {
    throw new PlanLimitError({ required: flag, plan });
  }
}

export function clampByPlan(plan: PlanCode, value: number, limitKey: "maxLeadsPerSearch" | "maxExportContactsPerExport" | "crawlMaxPagesPerDomain") {
  const e = PLAN_ENTITLEMENTS[plan];
  return Math.min(value, e[limitKey]);
}

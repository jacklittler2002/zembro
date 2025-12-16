import { prisma } from "../db";

export async function getBillingStatus(userId: string) {
  const customer = await prisma.billingCustomer.findUnique({ where: { userId } });
  const sub = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  const wallet = await prisma.aiCreditWallet.findUnique({ where: { userId } });

  return {
    stripeCustomerId: customer?.stripeCustomerId ?? null,
    planCode: (sub?.planCode as string | undefined) ?? "FREE",
    subscriptionStatus: sub?.status ?? "none",
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    credits: wallet?.balance ?? 0,
  };
}

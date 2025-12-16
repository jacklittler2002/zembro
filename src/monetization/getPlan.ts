import { prisma } from "../db";
import { PlanCode } from "./entitlements";

export async function getUserPlanCode(userId: string): Promise<PlanCode> {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: "active" },
    orderBy: { updatedAt: "desc" },
  });
  const plan = (sub?.planCode as PlanCode) ?? "FREE";
  return plan;
}

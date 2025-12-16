import { prisma } from "../db";
import { PlanCode } from "./planLimits";

export async function getUserPlanCode(userId: string): Promise<PlanCode> {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: "active" },
    orderBy: { updatedAt: "desc" },
  });

  return (sub?.planCode as PlanCode) ?? "FREE";
}

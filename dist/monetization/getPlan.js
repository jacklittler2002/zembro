"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPlanCode = getUserPlanCode;
const db_1 = require("../db");
async function getUserPlanCode(userId) {
    const sub = await db_1.prisma.subscription.findFirst({
        where: { userId, status: "active" },
        orderBy: { updatedAt: "desc" },
    });
    const plan = sub?.planCode ?? "FREE";
    return plan;
}
//# sourceMappingURL=getPlan.js.map
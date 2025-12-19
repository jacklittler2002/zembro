"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsufficientCreditsError = exports.PlanLimitError = void 0;
exports.getEntitlements = getEntitlements;
exports.requireCredits = requireCredits;
exports.requireFeature = requireFeature;
exports.clampByPlan = clampByPlan;
const entitlements_1 = require("./entitlements");
const creditService_1 = require("../ted/creditService");
class PlanLimitError extends Error {
    details;
    code = "PLAN_LIMIT_REACHED";
    constructor(details) {
        super("PLAN_LIMIT_REACHED");
        this.details = details;
    }
}
exports.PlanLimitError = PlanLimitError;
class InsufficientCreditsError extends Error {
    details;
    code = "INSUFFICIENT_CREDITS";
    constructor(details) {
        super("INSUFFICIENT_CREDITS");
        this.details = details;
    }
}
exports.InsufficientCreditsError = InsufficientCreditsError;
function getEntitlements(plan) {
    return entitlements_1.PLAN_ENTITLEMENTS[plan];
}
async function requireCredits(userId, amount, reason) {
    const balance = await (0, creditService_1.getCreditBalance)(userId);
    if (balance < amount) {
        throw new InsufficientCreditsError({ required: amount, available: balance, reason });
    }
    await (0, creditService_1.consumeCredits)(userId, amount, reason);
}
function requireFeature(plan, flag) {
    const e = entitlements_1.PLAN_ENTITLEMENTS[plan];
    if (!e[flag]) {
        throw new PlanLimitError({ required: flag, plan });
    }
}
function clampByPlan(plan, value, limitKey) {
    const e = entitlements_1.PLAN_ENTITLEMENTS[plan];
    return Math.min(value, e[limitKey]);
}
//# sourceMappingURL=enforce.js.map
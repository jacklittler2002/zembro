"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const leadSearchProgressService_1 = require("../leadSearch/leadSearchProgressService");
const policyMiddleware_1 = require("../policies/policyMiddleware");
const router = (0, express_1.Router)();
// GET /api/lead-searches/:id/progress
router.get("/lead-searches/:id/progress", policyMiddleware_1.PolicyMiddleware.check("leadSearch", "read"), async (req, res) => {
    const { id } = req.params;
    const leadSearch = await db_1.prisma.leadSearch.findUnique({
        where: { id },
        select: {
            id: true,
            status: true,
            discoveredCount: true,
            crawledCount: true,
            enrichedCount: true,
            contactsFoundCount: true,
            maxLeads: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    if (!leadSearch)
        return res.status(404).json({ error: "Not found" });
    // Optionally, re-check completion
    await (0, leadSearchProgressService_1.maybeMarkLeadSearchDone)(id);
    res.json({
        ...leadSearch,
        isComplete: leadSearch.status === "DONE",
    });
});
exports.default = router;
//# sourceMappingURL=leadSearchProgress.js.map
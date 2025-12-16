"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mountListRoutes = mountListRoutes;
const authMiddleware_1 = require("../auth/authMiddleware");
const leadListService_1 = require("../lists/leadListService");
const leadListExportService_1 = require("../export/leadListExportService");
function mountListRoutes(app, logger) {
    app.get("/api/lists", authMiddleware_1.authMiddleware, async (req, res) => {
        const lists = await (0, leadListService_1.listLeadLists)(req.userId);
        // Map to UI-friendly shape
        const out = lists.map((l) => ({
            id: l.id,
            name: l.name,
            description: l.description ?? null,
            color: "#3B82F6",
            leadCount: l._count?.items ?? 0,
            leads: [],
            createdAt: l.createdAt,
        }));
        res.json({ lists: out });
    });
    app.post("/api/lists", authMiddleware_1.authMiddleware, async (req, res) => {
        const { name, description } = req.body || {};
        const list = await (0, leadListService_1.createLeadList)(req.userId, { name, description });
        res.json({ list });
    });
    app.get("/api/lists/:id", authMiddleware_1.authMiddleware, async (req, res) => {
        const id = req.params.id;
        const list = await (0, leadListService_1.getLeadList)(req.userId, id);
        if (!list)
            return res.status(404).json({ error: "Not found" });
        const mapped = {
            id: list.id,
            name: list.name,
            description: list.description ?? null,
            color: "#3B82F6",
            leadCount: list.items.length,
            createdAt: list.createdAt,
            leads: list.items.map((it) => ({
                id: it.id,
                companyId: it.companyId,
                contactId: it.contactId ?? null,
                notes: null,
                addedAt: it.createdAt,
                company: it.company
                    ? { id: it.company.id, name: it.company.name, domain: it.company.domain, industry: it.company.industry }
                    : { id: it.companyId, name: it.companyName, domain: it.websiteUrl, industry: it.industry },
                contact: it.contact
                    ? { id: it.contact.id, firstName: it.contact.firstName, lastName: it.contact.lastName, email: it.contact.email, role: it.contact.role }
                    : (it.email || it.firstName || it.lastName || it.role
                        ? { id: it.contactId, firstName: it.firstName, lastName: it.lastName, email: it.email, role: it.role }
                        : null),
            })),
        };
        res.json({ list: mapped });
    });
    app.put("/api/lists/:id", authMiddleware_1.authMiddleware, async (req, res) => {
        try {
            const { name, description } = req.body || {};
            const id = req.params.id;
            const updated = await (0, leadListService_1.updateLeadList)(req.userId, id, { name, description });
            res.json({ list: updated });
        }
        catch (err) {
            res.status(400).json({ error: err.message || "Failed to update list" });
        }
    });
    app.delete("/api/lists/:id", authMiddleware_1.authMiddleware, async (req, res) => {
        try {
            const id = req.params.id;
            const out = await (0, leadListService_1.deleteLeadList)(req.userId, id);
            res.json(out);
        }
        catch (err) {
            res.status(400).json({ error: err.message || "Failed to delete list" });
        }
    });
    app.delete("/api/lists/:id/leads", authMiddleware_1.authMiddleware, async (req, res) => {
        try {
            const id = req.params.id;
            const { leadIds } = req.body || {};
            if (!Array.isArray(leadIds) || leadIds.length === 0)
                return res.json({ removed: 0 });
            const out = await (0, leadListService_1.removeLeadListItems)(req.userId, id, leadIds);
            res.json(out);
        }
        catch (err) {
            res.status(400).json({ error: err.message || "Failed to remove leads" });
        }
    });
    app.post("/api/lists/:id/add-from-search", authMiddleware_1.authMiddleware, async (req, res) => {
        const id = req.params.id;
        const { leadSearchId, limit, filters } = req.body || {};
        const result = await (0, leadListService_1.addLeadsFromLeadSearch)(req.userId, {
            leadListId: id,
            leadSearchId,
            limit,
            filters,
        });
        res.json({ added: result.added, totalCandidates: result.totalCandidates });
    });
    app.get("/api/lists/:id/export", authMiddleware_1.authMiddleware, async (req, res) => {
        try {
            const id = req.params.id;
            const { csv } = await (0, leadListExportService_1.exportLeadListToCsv)(req.userId, id);
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename="lead-list-${req.params.id}.csv"`);
            return res.send(csv);
        }
        catch (err) {
            if (err?.code === "INSUFFICIENT_CREDITS") {
                return res.status(402).json({
                    error: "INSUFFICIENT_CREDITS",
                    required: err.required,
                    available: err.available,
                    contacts: err.contacts,
                });
            }
            if (err?.code === "UPGRADE_REQUIRED") {
                return res.status(403).json({
                    error: "UPGRADE_REQUIRED",
                    limit: err.limit,
                    allowed: err.allowed,
                    plan: err.plan,
                });
            }
            logger.error("List export failed", err);
            return res.status(500).json({ error: "Failed to export list" });
        }
    });
}
//# sourceMappingURL=lists.js.map